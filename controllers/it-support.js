const prisma = require("../config/prisma");
const { saveImage } = require("../utils/uploadImage");
const { listGoogleEvents } = require("./googleCalendar");
const { logger } = require("../utils/logger");

const mapGoogleSyncError = (err) => {
  const message = String(err?.rawMessage || err?.message || "");
  const normalized = message.toLowerCase();

  if (err?.code === "GOOGLE_CALENDAR_NOT_CONFIGURED") {
    return {
      status: 503,
      body: {
        message:
          "Google Calendar is not configured on this server yet. Please ask admin to set GOOGLE_PROJECT_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, and restart backend.",
        missingKeys: err.missingKeys || [],
      },
    };
  }

  if (
    normalized.includes("requested entity was not found") ||
    normalized.includes("google api failed: not found")
  ) {
    return {
      status: 400,
      body: {
        message:
          "Calendar ID not found. Please verify Calendar ID in Google Calendar settings.",
      },
    };
  }

  if (
    normalized.includes("caller does not have permission") ||
    normalized.includes("insufficient permission") ||
    normalized.includes("forbidden")
  ) {
    return {
      status: 400,
      body: {
        message:
          "Google Calendar permission denied. Share the target calendar with the service account email and grant 'Make changes to events'.",
      },
    };
  }

  if (normalized.includes("invalid_grant") || normalized.includes("invalid jwt")) {
    return {
      status: 503,
      body: {
        message:
          "Google credentials are invalid on server (service account key is malformed or expired).",
      },
    };
  }

  return null;
};

// Get dashboard statistics
exports.previewJob = async (req, res, next) => {
    try {
        const { id } = req.params;
        const ticket = await prisma.ticket.findFirst({
            where: { id: parseInt(id), isDeleted: false },
            include: {
                room: true,
                equipment: true,
                category: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        email: true,
                        phoneNumber: true,
                        picture: true,
                        role: true
                    }
                },
                images: true
            }
        });

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        res.json(ticket);
    } catch (err) {
        next(err);
    }
};

exports.getStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // [BUG FIX] Get all stats in parallel — including completed count
    // Bug was: pending query combined OR + outer status: "not_start" causing Prisma to AND them
    // which over-counted tickets that are assigned to this IT as not_start.
    // Fix: Use separate OR branches with status inside each branch.
    const [pending, inProgress, todayComplete, todayTotal, urgent, completed] =
      await Promise.all([
        // Pending = unassigned not_start OR assigned to me not_start
        prisma.ticket.count({
          where: {
            isDeleted: false,
            OR: [
              { assignedToId: null, status: "not_start" },
              { assignedToId: req.user.id, status: "not_start" },
            ],
          },
        }),

        prisma.ticket.count({
          where: {
            assignedToId: req.user.id,
            status: "in_progress",
            isDeleted: false,
          },
        }),

        prisma.ticket.count({
          where: {
            assignedToId: req.user.id,
            status: "completed",
            isDeleted: false,
            updatedAt: { gte: today, lt: tomorrow },
          },
        }),

        prisma.ticket.count({
          where: {
            assignedToId: req.user.id,
            isDeleted: false,
            createdAt: { gte: today, lt: tomorrow },
          },
        }),

        prisma.ticket.count({
          where: {
            OR: [{ assignedToId: req.user.id }, { assignedToId: null }],
            urgency: { in: ["High"] },
            status: { not: "completed" },
            isDeleted: false,
          },
        }),

        // [BUG FIX] Moved completed count into Promise.all to avoid extra DB round-trip
        prisma.ticket.count({
          where: { assignedToId: req.user.id, status: "completed", isDeleted: false },
        }),
      ]);

    res.json({
      pending,
      inProgress,
      completed,
      todayComplete,
      todayTotal,
      urgent,
    });
  } catch (err) {
    next(err);
  }
};

// Get tasks with full details
exports.getMyTasks = async (req, res, next) => {
  try {
    const tasks = await prisma.ticket.findMany({
      where: {
        isDeleted: false, // [BUG FIX] Don't show soft-deleted tickets in IT dashboard
        OR: [
          { assignedToId: req.user.id },
          {
            assignedToId: null,
            status: "not_start",
          },
        ],
      },
      include: {
        room: true,
        equipment: true,
        category: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            phoneNumber: true,
            picture: true,
            role: true, // Included for detail view
          },
        },
        images: {
          where: { type: "before" },
        },
        logs: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: [{ urgency: "desc" }, { createdAt: "asc" }],
    });

    res.json(tasks);
  } catch (err) {
    next(err);
  }
};



// Accept job with auto-assignment
exports.acceptJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if ticket exists and is available
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
      include: { 
          createdBy: true 
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.isDeleted) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.assignedToId && ticket.assignedToId !== req.user.id) {
      return res
        .status(400)
        .json({ message: "Ticket already assigned to another IT" });
    }

    if (ticket.status === 'rejected') {
        return res.status(400).json({ message: "Cannot accept a rejected ticket." });
    }

    // [BUG FIX] Record SLA timestamps: acceptedAt and responseTime
    // Previously, acceptJob set status=in_progress but never wrote acceptedAt/responseTime,
    // causing IT Performance report to always show 0 for response time.
    const now = new Date();
    const responseTime = ticket.acceptedAt
      ? ticket.responseTime // Already accepted once (re-accept edge case)
      : Math.floor((now - new Date(ticket.createdAt)) / 60000);

    // Update ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        status: "in_progress",
        assignedToId: req.user.id,
        acceptedAt: ticket.acceptedAt || now,         // Record first accept time
        responseTime: ticket.acceptedAt ? ticket.responseTime : responseTime, // Don't override if re-accepted
        logs: {
          create: {
            action: "Accept",
            detail: `Accepted by ${req.user.name || req.user.email}`,
            updatedById: req.user.id,
          },
        },
      },
      include: {
        createdBy: true,
        assignedTo: true
      }
    });

    // Email notification removed as per user request (2026-02-18)
    // if (updatedTicket.createdBy?.email) { ... }

    // NOTE: totalResolved is NOT incremented here on accept.
    // It is incremented in closeJob() when the ticket is actually completed.
    
    // Notify User via System Notification
    await prisma.notification.create({
        data: {
            userId: updatedTicket.createdById,
            ticketId: updatedTicket.id,
            title: "Ticket Accepted",
            message: `Your ticket "${updatedTicket.title}" has been accepted by ${req.user.name}.`,
            type: "ticket_accepted"
        }
    });

    if (req.io) {
        req.io.emit("server:update-ticket", updatedTicket);
    }

    res.json(updatedTicket);
  } catch (err) {
    next(err);
  }
};

// Reject job (Mark as completed with Reject log)
exports.rejectJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Reason is required for rejection" });
    }

    const existingTicket = await prisma.ticket.findUnique({ where: { id: parseInt(id) } });

    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    if (existingTicket.isDeleted) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    if (existingTicket.status === 'rejected') {
      return res.status(400).json({ message: "Ticket is already rejected." });
    }
    if (existingTicket.status === 'completed') {
      return res.status(400).json({ message: "Cannot reject a completed ticket." });
    }

    const ticket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        status: "rejected", 
        note: `REJECTED: ${reason}`, // Save rejection reason in note for visibility
        logs: {
          create: {
            action: "Reject",
            detail: `Rejected by ${req.user.name || req.user.email}: ${reason}`,
            updatedById: req.user.id,
          },
        },
      },
      include: {
          createdBy: true
      }
    });

    // Send Email to User
    if (ticket.createdBy?.email) {
        const { sendEmailNotification } = require("../utils/sendEmailHelper");
        await sendEmailNotification(
            "ticket_rejected",
            ticket.createdBy.email,
            {
                id: ticket.id,
                title: ticket.title,
                reason: reason
            }
        );
    }

    // System Notification
    await prisma.notification.create({
        data: {
            userId: ticket.createdById,
            ticketId: ticket.id,
            title: "Ticket Rejected",
            message: `Your ticket "${ticket.title}" was rejected. Reason: ${reason}`,
            type: "ticket_rejected"
        }
    });
    
    if (req.io) {
        req.io.emit("server:update-ticket", ticket);
    }

    res.json(ticket);
  } catch (err) {
    next(err);
  }
};



// Save Draft (Checklist & Notes)
exports.saveDraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note, checklist, proof } = req.body;

    // Handle Image Upload (Optional for draft)
    let afterImages = [];
    if (proof && proof.startsWith("data:image")) {
      const url = await saveImage(proof, { scope: "ticket-after-draft" });
      if (!url) {
        return res.status(400).json({ message: "Invalid proof image data" });
      }
      if (url) {
        afterImages.push({
          url: url,
          secure_url: url,
          type: "after",
          asset_id: "local",
          public_id: "local"
        });
      }
    }

    const existingTicket = await prisma.ticket.findUnique({ where: { id: parseInt(id) } });

    if (!existingTicket) {
        return res.status(404).json({ message: "Ticket not found" });
    }

    if (existingTicket.status === 'rejected' || existingTicket.status === 'completed') {
        return res.status(400).json({ message: "Cannot edit a finalized ticket." });
    }

    const ticket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        note: note, // Save draft note
        checklist: checklist ? JSON.stringify(checklist) : undefined, // Save checklist JSON string
        images: afterImages.length > 0
          ? { create: afterImages }
          : undefined,
      },
    });

    res.json(ticket);
  } catch (err) {
    next(err);
  }
};

// Close job with completion details
exports.closeJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note, proof, checklist } = req.body;  // Frontend sends 'note', 'proof', and 'checklist'

    // [BUG FIX] Pre-check: prevent double-closing which would double-increment totalResolved
    const existingTicket = await prisma.ticket.findUnique({ where: { id: parseInt(id) } });
    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    if (existingTicket.status === 'completed') {
      return res.status(400).json({ message: "Ticket is already completed." });
    }
    if (existingTicket.status === 'rejected') {
      return res.status(400).json({ message: "Cannot close a rejected ticket." });
    }

    // Handle Image Upload
    let afterImages = [];
    if (proof && proof.startsWith("data:image")) {
      const url = await saveImage(proof, { scope: "ticket-after-complete" });
      if (!url) {
        return res.status(400).json({ message: "Invalid proof image data" });
      }
      if (url) {
        afterImages.push({
          url: url,
          secure_url: url,
          type: "after",
          asset_id: "local",
          public_id: "local"
        });
      }
    }

    // Calculate resolution time from acceptedAt (or createdAt as fallback)
    const now = new Date();
    const startTime = existingTicket.acceptedAt || existingTicket.createdAt;
    const resolutionTime = Math.floor((now - new Date(startTime)) / 60000);

    const ticket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        status: "completed",
        note: note,
        checklist: checklist ? JSON.stringify(checklist) : undefined,
        completedAt: now,
        resolutionTime: resolutionTime,
        logs: {
          create: {
            action: "Complete",
            detail: `Fixed: ${note || "No details provided"}`,
            updatedById: req.user.id,
          },
        },
        images: afterImages.length > 0
          ? {
            create: afterImages,
          }
          : undefined,
      },
      include: {
        createdBy: true,
        category: true,
        assignedTo: true,
        room: true
      },
    });

    // Send Email to User
    if (ticket.createdBy?.email) {
        const { sendEmailNotification } = require("../utils/sendEmailHelper");
        await sendEmailNotification(
            "ticket_resolved_user",
            ticket.createdBy.email,
            {
                id: ticket.id,
                title: ticket.title,
                room: ticket.room?.roomNumber || "N/A",
                resolver: ticket.assignedTo?.name || "IT Team",
                link: `${process.env.FRONTEND_URL}/user/ticket/${ticket.id}`
            }
        );
    }

    // Update IT performance metrics — increment on CLOSE (not on accept)
    if (ticket.assignedToId) {
      await prisma.user.update({
        where: { id: ticket.assignedToId },
        data: { totalResolved: { increment: 1 } },
      });
    }

    // System Notification
    if (ticket.createdById) {
      await prisma.notification.create({
          data: {
              userId: ticket.createdById,
              ticketId: ticket.id,
              title: "Ticket Resolved",
              message: `Your ticket "${ticket.title}" has been resolved. Please rate our service.`,
              type: "ticket_resolved"
          }
      });
    }

    if (req.io) {
        req.io.emit("server:update-ticket", ticket);
    }

    res.json(ticket);
  } catch (err) {
    next(err);
  }
};





// Get completed tickets for history (scoped to the logged-in IT user)
exports.getHistory = async (req, res, next) => {
  try {
    const history = await prisma.ticket.findMany({
      where: {
        assignedToId: req.user.id, // [BUG FIX] Scope to the current IT user only, not all completed tickets
        status: "completed",
        isDeleted: false,
      },
      include: {
        room: true,
        equipment: true,
        category: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            phoneNumber: true,
            picture: true,
            role: true,
          },
        },
        logs: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json(history);
  } catch (err) {
    next(err);
  }
};
// Get public schedule (IT availability)
exports.getPublicSchedule = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch Google Calendar Events ONLY
    // Filter by description containing "Imported from Google Calendar"
    const startOfPrevYear = new Date(today.getFullYear() - 1, today.getMonth(), 1);
    startOfPrevYear.setHours(0, 0, 0, 0);

    const googleEvents = await prisma.personalTask.findMany({
      where: {
        date: { gte: startOfPrevYear },
        description: {
            contains: 'Imported from Google Calendar'
        }
      },
      include: {
        user: { select: { name: true, id: true } }
      }
    });

    // Format for frontend
    const schedule = googleEvents.map(t => ({
        id: `task-${t.id}`,
        title: t.title,
        start: t.startTime || t.date,
        end: t.endTime,
        type: 'google', // Changed type to 'google' for clarity
        staff: t.user?.name,
        details: t.title,
        description: t.description
    }));

    res.json(schedule);
  } catch (err) {
    next(err);
  }
};

exports.syncGoogleCalendar = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const googleCalendarId = req.user.googleCalendarId; // Use custom calendar ID
        logger.info(`[Sync] User ${userId} requesting sync for calendar: ${googleCalendarId}`);

        if (!googleCalendarId) {
            return res.status(400).json({ message: "No Google Calendar ID configured." });
        }

        const { syncUserCalendar } = require("../utils/syncService");
        const count = await syncUserCalendar(userId, googleCalendarId);

        res.json({ message: `Synced ${count} events from Google Calendar`, count });
    } catch (err) {
        const mapped = mapGoogleSyncError(err);
        if (mapped) {
            return res.status(mapped.status).json(mapped.body);
        }
        next(err);
    }
};

exports.testGoogleSync = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const googleCalendarId = req.user.googleCalendarId;
        
        if (!googleCalendarId) {
            return res.status(400).json({ 
                success: false, 
                message: "No Google Calendar ID found. Please Enter and Save it first."
            });
        }

        logger.info(`[TestSync] Full Sync Test for ${googleCalendarId}`);

        // Call the REAL sync service to test the entire pipeline (Fetch -> Transform -> DB Save)
        const { syncUserCalendar } = require("../utils/syncService");
        
        // This attempts to write to the DB
        const count = await syncUserCalendar(userId, googleCalendarId);
        
        res.json({
            success: true,
            message: `Success! Synced ${count} events to database.`,
            eventCount: count,
            calendarId: googleCalendarId
        });

    } catch (err) {
        const mapped = mapGoogleSyncError(err);
        if (mapped) {
            return res.status(mapped.status).json({
                success: false,
                ...mapped.body,
            });
        }
        next(err);
    }
};
