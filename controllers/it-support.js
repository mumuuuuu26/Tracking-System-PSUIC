const prisma = require("../config/prisma");
const { saveImage } = require("../utils/uploadImage");
const { listGoogleEvents } = require("./googleCalendar");

// Get dashboard statistics
exports.previewJob = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await prisma.ticket.findUnique({
            where: { id: parseInt(id) },
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
        console.error("❌ Preview Job Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all stats in parallel
    const [pending, inProgress, todayComplete, todayTotal, urgent] =
      await Promise.all([
        prisma.ticket.count({
          where: {
            OR: [
              { assignedToId: req.user.id },
              { assignedToId: null, status: "not_start" },
            ],
            status: "not_start",
          },
        }),

        prisma.ticket.count({
          where: {
            assignedToId: req.user.id,
            status: "in_progress",
          },
        }),

        prisma.ticket.count({
          where: {
            assignedToId: req.user.id,
            status: "completed",
            updatedAt: { gte: today, lt: tomorrow },
          },
        }),

        prisma.ticket.count({
          where: {
            assignedToId: req.user.id,
            createdAt: { gte: today, lt: tomorrow },
          },
        }),

        prisma.ticket.count({
          where: {
            OR: [{ assignedToId: req.user.id }, { assignedToId: null }],
            urgency: { in: ["High", "Critical"] },
            status: { not: "completed" },
          },
        }),
      ]);

    res.json({
      pending,
      inProgress,
      completed: await prisma.ticket.count({
        where: { assignedToId: req.user.id, status: "completed" },
      }),
      todayComplete,
      todayTotal,
      urgent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get tasks with full details
exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await prisma.ticket.findMany({
      where: {
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
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};



// Accept job with auto-assignment
exports.acceptJob = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ticket exists and is available
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
      include: { createdBy: true },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.assignedToId && ticket.assignedToId !== req.user.id) {
      return res
        .status(400)
        .json({ message: "Ticket already assigned to another IT" });
    }

    // Update ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        status: "in_progress",
        assignedToId: req.user.id,
        logs: {
          create: {
            action: "Accept",
            detail: `Accepted by ${req.user.name || req.user.email}`,
            updatedById: req.user.id,
          },
        },
      },
    });

    // Update IT performance metrics
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        totalResolved: { increment: 1 },
      },
    });

    res.json(updatedTicket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Reject job (Mark as completed with Reject log)
exports.rejectJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Reason is required for rejection" });
    }

    const ticket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        status: "completed", // Closest equivalent to 'Rejected' in 3-state system
        note: `REJECTED: ${reason}`, // Save rejection reason in note for visibility
        logs: {
          create: {
            action: "Reject",
            detail: `Rejected by ${req.user.name || req.user.email}: ${reason}`,
            updatedById: req.user.id,
          },
        },
      },
    });

    res.json(ticket);
  } catch (err) {
    console.error("❌ Reject Job Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};



// Save Draft (Checklist & Notes)
exports.saveDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, checklist, proof } = req.body;

    // Handle Image Upload (Optional for draft)
    let afterImages = [];
    if (proof && proof.startsWith("data:image")) {
      const url = saveImage(proof);
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
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Close job with completion details
exports.closeJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, proof, checklist } = req.body;  // Frontend sends 'note', 'proof', and 'checklist'

    // Handle Image Upload
    let afterImages = [];
    if (proof && proof.startsWith("data:image")) {
      const url = saveImage(proof);
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

    const ticket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        status: "completed",
        note: note, // Ensure note is saved to the main field too
        checklist: checklist ? JSON.stringify(checklist) : undefined,
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
      },
    });

    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};



// Get completed tickets for history
exports.getHistory = async (req, res) => {
  try {
    const history = await prisma.ticket.findMany({
      where: {
        status: "completed"
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
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
// Get public schedule (IT availability)
exports.getPublicSchedule = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isIT = req.user.role === 'it_support' || req.user.role === 'admin';

    // Fetch active tickets (accepted/in_progress) OR completed tickets from previous year
    const startOfPrevYear = new Date(today.getFullYear() - 1, today.getMonth(), 1);
    startOfPrevYear.setHours(0, 0, 0, 0);

    const activeTickets = await prisma.ticket.findMany({
      where: {
        OR: [
          { status: { in: ["in_progress"] } },
          { 
            status: "completed",
            updatedAt: { gte: startOfPrevYear }
          }
        ]
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        assignedTo: {
          select: { name: true, id: true }
        }
      }
    });

    // Fetch Personal Tasks of IT Staff
    // Show ALL tasks (completed or not) from start of PREVIOUS YEAR
    const personalTasks = await prisma.personalTask.findMany({
      where: {
        date: { gte: startOfPrevYear }
      },
      include: {
        user: { select: { name: true, id: true } }
      }
    });

    // Format for frontend
    const schedule = [
      ...activeTickets.map(t => ({
        id: `ticket-${t.id}`,
        title: isIT ? `[Ticket] ${t.title}` : `Busy: ${t.assignedTo?.name || "IT Staff"}`,
        start: t.createdAt,
        end: t.updatedAt,
        type: 'ticket',
        staff: t.assignedTo?.name,
        details: t.title, // Show real title
        description: isIT ? t.description : undefined
      })),
      ...personalTasks.map(t => ({
        id: `task-${t.id}`,
        title: isIT ? `[Task] ${t.title}` : `Busy: ${t.user?.name || "IT Staff"}`,
        start: t.startTime || t.date,
        end: t.endTime,
        type: 'personal',
        staff: t.user?.name,
        details: t.title, // Show real title
        description: isIT ? t.description : undefined
      }))
    ];

    res.json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.syncGoogleCalendar = async (req, res) => {
    try {
        const userId = req.user.id;
        const googleCalendarId = req.user.googleCalendarId; // Use custom calendar ID
        console.log(`[Sync] User ${userId} requesting sync for calendar: ${googleCalendarId}`);

        if (!googleCalendarId) {
            return res.status(400).json({ message: "No Google Calendar ID configured." });
        }

        const { syncUserCalendar } = require("../utils/syncService");
        const count = await syncUserCalendar(userId, googleCalendarId);

        res.json({ message: `Synced ${count} events from Google Calendar`, count });
    } catch (err) {
        console.error("Sync Error Detailed:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
        // Send specific error message to client
        res.status(500).json({ message: err.message || "Sync Failed" });
    }
};

exports.testGoogleSync = async (req, res) => {
    try {
        const userId = req.user.id;
        const googleCalendarId = req.user.googleCalendarId;
        
        if (!googleCalendarId) {
            return res.status(400).json({ 
                success: false, 
                message: "No Google Calendar ID found. Please Enter and Save it first.",
                user: req.user
            });
        }

        console.log(`[TestSync] Full Sync Test for ${googleCalendarId}`);

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
        console.error("Test Sync Failed:", err);
        res.status(500).json({
            success: false,
            message: "Sync Failed during Database Save",
            error: err.message,
            stack: err.stack,
            envCheck: {
                hasProjectId: !!process.env.GOOGLE_PROJECT_ID,
                hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL
            }
        });
    }
};
