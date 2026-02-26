const prisma = require("../config/prisma");
const { saveImage } = require("../utils/uploadImage");
const { listGoogleEvents } = require("./googleCalendar");
const { logger } = require("../utils/logger");
const { mapGoogleSyncError } = require("../utils/googleSyncErrorMapper");
const { getStatusVariants, getStatusWhere, normalizeTicketEntity, normalizeTicketStatus } = require("../utils/ticketStatus");
const { emitTicketUpdated } = require("../utils/realtimeTicket");

const ticketUserSelect = {
    id: true,
    name: true,
    username: true,
    email: true,
    phoneNumber: true,
    picture: true,
    role: true,
};

const DEFAULT_GOOGLE_SYNC_MIN_INTERVAL_MS = 5 * 60 * 1000;
const googleSyncLastRunByUser = new Map();

const parsePositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(String(value ?? ""), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const GOOGLE_SYNC_MIN_INTERVAL_MS = parsePositiveInt(
    process.env.GOOGLE_SYNC_MIN_INTERVAL_MS,
    DEFAULT_GOOGLE_SYNC_MIN_INTERVAL_MS,
);

const parseBoolean = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value !== "string") return false;
    return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
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

        res.json(normalizeTicketEntity(ticket));
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
              { assignedToId: null, status: getStatusWhere("not_start") },
              { assignedToId: req.user.id, status: getStatusWhere("not_start") },
            ],
          },
        }),

        prisma.ticket.count({
          where: {
            assignedToId: req.user.id,
            status: getStatusWhere("in_progress"),
            isDeleted: false,
          },
        }),

        prisma.ticket.count({
          where: {
            assignedToId: req.user.id,
            status: getStatusWhere("completed"),
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
            status: { notIn: getStatusVariants("completed") },
            isDeleted: false,
          },
        }),

        // [BUG FIX] Moved completed count into Promise.all to avoid extra DB round-trip
        prisma.ticket.count({
          where: { assignedToId: req.user.id, status: getStatusWhere("completed"), isDeleted: false },
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
            status: getStatusWhere("not_start"),
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

    res.json(tasks.map(normalizeTicketEntity));
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
          createdBy: { select: ticketUserSelect } 
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

    if (normalizeTicketStatus(ticket.status) === 'rejected') {
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
        createdBy: { select: ticketUserSelect },
        assignedTo: { select: ticketUserSelect }
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

    emitTicketUpdated(req.io, updatedTicket);

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
    const existingStatus = normalizeTicketStatus(existingTicket.status);

    if (existingStatus === 'rejected') {
      return res.status(400).json({ message: "Ticket is already rejected." });
    }
    if (existingStatus === 'completed') {
      return res.status(400).json({ message: "Cannot reject a completed ticket." });
    }

    const ticket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        status: "rejected", 
        assignedToId: req.user.id,
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
          createdBy: { select: ticketUserSelect }
      }
    });

    // Email policy (2026-02-25):
    // Send email only for new ticket creation (IT notification recipients).
    // Do not send lifecycle emails on rejected/completed actions.

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
    
    emitTicketUpdated(req.io, ticket);

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

    const existingStatus = normalizeTicketStatus(existingTicket.status);
    if (existingStatus === 'rejected' || existingStatus === 'completed') {
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
    const existingStatus = normalizeTicketStatus(existingTicket.status);
    if (existingStatus === 'completed') {
      return res.status(400).json({ message: "Ticket is already completed." });
    }
    if (existingStatus === 'rejected') {
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
        createdBy: { select: ticketUserSelect },
        category: true,
        assignedTo: { select: ticketUserSelect },
        room: true
      },
    });

    // Email policy (2026-02-25):
    // Send email only for new ticket creation (IT notification recipients).
    // Do not send lifecycle emails on rejected/completed actions.

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

    emitTicketUpdated(req.io, ticket);

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
        status: getStatusWhere("completed"),
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

    res.json(history.map(normalizeTicketEntity));
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
    const userId = req.user?.id;
    try {
        const googleCalendarId = req.user.googleCalendarId; // Use custom calendar ID
        const forceSync = parseBoolean(req.body?.force);
        logger.info(`[Sync] User ${userId} requesting sync for calendar: ${googleCalendarId}`);

        if (!googleCalendarId) {
            return res.status(400).json({ message: "No Google Calendar ID configured." });
        }

        if (!forceSync) {
            const now = Date.now();
            const lastSyncedAt = googleSyncLastRunByUser.get(userId) || 0;
            const elapsedMs = now - lastSyncedAt;
            if (lastSyncedAt > 0 && elapsedMs < GOOGLE_SYNC_MIN_INTERVAL_MS) {
                const retryAfterSec = Math.ceil((GOOGLE_SYNC_MIN_INTERVAL_MS - elapsedMs) / 1000);
                logger.info(
                    `[Sync] User ${userId} sync skipped due to cooldown (${retryAfterSec}s remaining).`,
                );
                return res.json({
                    message: "Google Calendar was synced recently. Please retry later.",
                    count: 0,
                    skipped: true,
                    retryAfterSec,
                });
            }
        }

        const { syncUserCalendar } = require("../utils/syncService");
        const count = await syncUserCalendar(userId, googleCalendarId);
        googleSyncLastRunByUser.set(userId, Date.now());

        res.json({ message: `Synced ${count} events from Google Calendar`, count, skipped: false });
    } catch (err) {
        const mapped = mapGoogleSyncError(err);
        if (mapped) {
            return res.status(mapped.status).json(mapped.body);
        }
        logger.error(`[Sync] Unexpected google sync error for user ${userId}: ${err?.stack || err}`);
        return res.status(502).json({
            message: "Google Calendar sync failed due to an upstream service/network issue.",
        });
    }
};

exports.testGoogleSync = async (req, res, next) => {
    const userId = req.user?.id;
    try {
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
        logger.error(`[TestSync] Unexpected google sync error for user ${userId}: ${err?.stack || err}`);
        return res.status(502).json({
            success: false,
            message: "Google Calendar sync failed due to an upstream service/network issue.",
        });
    }
};
