const prisma = require("../config/prisma");
const { saveImage } = require("../utils/uploadImage");

// Get dashboard statistics
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
              { assignedToId: null, status: "pending" },
            ],
            status: "pending",
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
            status: "fixed",
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
            status: { not: "fixed" },
          },
        }),
      ]);

    res.json({
      pending,
      inProgress,
      completed: await prisma.ticket.count({
        where: { assignedToId: req.user.id, status: "fixed" },
      }),
      todayComplete,
      todayTotal,
      urgent,
    });
  } catch (err) {
    console.log(err);
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
            status: "pending",
          },
          { status: "rejected" },
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
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get today's appointments
exports.getTodayAppointments = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: {
        itSupportId: req.user.id,
        scheduledAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        ticket: {
          include: {
            room: true,
            equipment: true,
            category: true,
            createdBy: {
              select: { name: true, username: true, phoneNumber: true },
            },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    res.json(appointments);
  } catch (err) {
    console.log(err);
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
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Reject ticket with reason
exports.rejectTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;

    const ticket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        status: "rejected",
        rejectedReason: `${reason}: ${notes}`,
        rejectedAt: new Date(),
        logs: {
          create: {
            action: "Reject",
            detail: `Rejected by ${req.user.name}: ${reason}`,
            updatedById: req.user.id,
          },
        },
      },
      include: {
        createdBy: true,
      },
    });

    res.json(ticket);
  } catch (err) {
    console.log(err);
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
    console.log(err);
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
        status: "fixed",
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
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Reschedule appointment
exports.rescheduleAppointment = async (req, res) => {
  try {
    const { ticketId, scheduledAt, note } = req.body;

    const appointment = await prisma.appointment.upsert({
      where: { ticketId: parseInt(ticketId) },
      update: {
        scheduledAt: new Date(scheduledAt),
        note,
      },
      create: {
        ticketId: parseInt(ticketId),
        itSupportId: req.user.id,
        scheduledAt: new Date(scheduledAt),
        note,
      },
    });

    // Update ticket status
    await prisma.ticket.update({
      where: { id: parseInt(ticketId) },
      data: {
        status: "scheduled",
        assignedToId: req.user.id,
        logs: {
          create: {
            action: "Schedule",
            detail: `Scheduled for ${new Date(scheduledAt).toLocaleString()}`,
            updatedById: req.user.id,
          },
        },
      },
    });

    res.json(appointment);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getSchedule = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const schedule = await prisma.appointment.findMany({
      where: {
        itSupportId: req.user.id,
        scheduledAt: {
          gte: targetDate,
          lt: nextDay
        }
      },
      include: {
        ticket: {
          include: {
            room: true,
            equipment: true,
            createdBy: {
              select: { name: true, username: true, phoneNumber: true }
            }
          }
        }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    res.json(schedule);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get completed tickets for history
exports.getHistory = async (req, res) => {
  try {
    const history = await prisma.ticket.findMany({
      where: {
        status: "fixed"
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
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

