const prisma = require("../config/prisma");
const { logger } = require("../utils/logger");
const { saveImage } = require("../utils/uploadImage");
const { z } = require("zod");

// --- Validation Schemas ---
const createTicketSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  urgency: z.enum(["Low", "Normal", "Medium", "High", "Critical"]),
  roomId: z.preprocess((val) => parseInt(val), z.number()),
  equipmentId: z.preprocess((val) => val ? parseInt(val) : null, z.number().nullable()).optional(),
  categoryId: z.preprocess((val) => val ? parseInt(val) : null, z.number().nullable()).optional(),
  images: z.array(z.string()).optional(),
});

const updateTicketSchema = z.object({
  status: z.enum(["not_start", "in_progress", "completed", "rejected"]).optional(),
  urgency: z.enum(["Low", "Normal", "Medium", "High", "Critical"]).optional(),
  assignedToId: z.preprocess((val) => val ? parseInt(val) : null, z.number().nullable()).optional(),
  adminNote: z.string().optional(),
  rating: z.number().min(0).max(100).optional(),
  userFeedback: z.string().optional(),
  categoryId: z.preprocess((val) => val ? parseInt(val) : null, z.number().nullable()).optional(),
});

const feedbackSchema = z.object({
  susValues: z.array(z.number().min(1).max(5)).length(10, "Please answer all 10 questions"),
  userFeedback: z.string().optional(),
});

exports.create = async (req, res, next) => {
  try {
    const validatedData = createTicketSchema.parse(req.body);
    const {
      title,
      description,
      urgency,
      roomId,
      equipmentId,
      images,
      categoryId
    } = validatedData;

    const newTicket = await prisma.ticket.create({
      data: {
        title,
        description,
        urgency,
        createdById: req.user.id,
        roomId,
        equipmentId,
        categoryId,
        status: "not_start",
        images: images && images.length > 0 ? {
          create: images.map(img => {
            const imageUrl = saveImage(img);
            return {
              url: imageUrl,
              secure_url: imageUrl,
              type: "before",
              asset_id: "local",
              public_id: "local"
            };
          }).filter(img => img.url !== null)
        } : undefined
      },
      include: {
        room: true,
        equipment: true,
        category: true,
        createdBy: true,
        images: true
      },
    });

    // Email notification logic
    try {
      const itUsers = await prisma.user.findMany({
        where: {
          OR: [{ role: "it_support" }, { role: "admin" }],
          enabled: true,
        },
        select: {
          email: true,
          isEmailEnabled: true,
          notificationEmail: true
        },
      });

      if (itUsers.length > 0) {
        const emails = itUsers
          .filter(u => u.isEmailEnabled !== false)
          .map(u => u.notificationEmail && u.notificationEmail.includes("@") ? u.notificationEmail : u.email)
          .filter(email => email && email.includes("@"));

        if (emails.length > 0) {
          const { sendEmailNotification } = require("../utils/sendEmailHelper");
          await sendEmailNotification(
            "new_ticket_it",
            emails,
            {
              ticketId: newTicket.id,
              title: title,
              urgency: newTicket.urgency,
              description: description,
              room: newTicket.room?.roomNumber || "N/A",
              equipment: newTicket.equipment?.name || "N/A",
              category: newTicket.category?.name || "N/A",
              createdBy: newTicket.createdBy?.name || newTicket.createdBy?.email,
              link: `${process.env.FRONTEND_URL}/it/ticket/${newTicket.id}`
            }
          );
        }
      }
    } catch (emailError) {
      logger.error("❌ Email Send Error:", emailError.message);
    }

    // Database Notifications
    const userForNotify = await prisma.user.findMany({
      where: {
        OR: [{ role: "it_support" }, { role: "admin" }],
        enabled: true,
      },
      select: { id: true },
    });

    if (userForNotify.length > 0) {
      await prisma.notification.createMany({
        data: userForNotify.map((user) => ({
          userId: user.id,
          ticketId: newTicket.id,
          title: "New Ticket Created",
          message: `Ticket #${newTicket.id}: ${title}`,
          type: "ticket_create",
        })),
      });
    }

    if (req.io) {
      req.io.emit("server:new-ticket", newTicket);
    }

    res.json(newTicket);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateTicketSchema.parse(req.body);
    const {
      status,
      urgency,
      assignedToId,
      adminNote,
      rating,
      userFeedback,
      categoryId,
    } = validatedData;

    const checkTicket = await prisma.ticket.findFirst({
      where: { 
        id: parseInt(id),
        isDeleted: false 
      },
    });

    if (!checkTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (
      req.user.role !== "admin" &&
      req.user.role !== "it_support" &&
      checkTicket.status !== "not_start" &&
      status !== "completed" && 
      !rating && !userFeedback 
    ) {
      return res.status(403).json({
        message: "Access Denied: Cannot edit ticket that is being processed."
      });
    }

    let updateData = {};
    if (status) updateData.status = status;
    if (urgency) updateData.urgency = urgency;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
    if (rating !== undefined) updateData.rating = rating;
    if (userFeedback !== undefined) updateData.userFeedback = userFeedback;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (adminNote !== undefined) updateData.note = adminNote;

    if (status) {
      const now = new Date();
      if (status === 'in_progress' && !checkTicket.acceptedAt) {
        updateData.acceptedAt = now;
        updateData.responseTime = Math.floor((now - new Date(checkTicket.createdAt)) / 60000);
      }
      if (status === 'completed') {
        updateData.completedAt = now;
        const startTime = checkTicket.acceptedAt || checkTicket.createdAt;
        updateData.resolutionTime = Math.floor((now - new Date(startTime)) / 60000);
      }
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        createdBy: true,
        assignedTo: true,
        room: true,
        equipment: true,
      },
    });

    if (status === "completed" && updatedTicket.createdBy?.email) {
      const { sendEmailNotification } = require("../utils/sendEmailHelper");
      try {
        await sendEmailNotification(
          "ticket_resolved_user",
          updatedTicket.createdBy.email,
          {
            id: updatedTicket.id,
            title: updatedTicket.title,
            room: updatedTicket.room?.roomNumber || "N/A",
            resolver: updatedTicket.assignedTo?.name || "IT Team",
            link: `${process.env.FRONTEND_URL}/user/feedback/${updatedTicket.id}`
          }
        );
      } catch (e) { logger.error("Email notification failed", e); }
    }

    if (updatedTicket.createdBy) {
      await prisma.notification.create({
        data: {
          userId: updatedTicket.createdById,
          ticketId: updatedTicket.id,
          title: status === "completed" ? "Ticket Resolved!" : "Ticket Updated",
          message: status === "completed"
            ? `Your ticket "${updatedTicket.title}" has been resolved. Please rate our service.`
            : `Your ticket "${updatedTicket.title}" status is now ${status}.`,
          type: "ticket_update",
        },
      });
    }

    if (req.io) {
      req.io.emit("server:update-ticket", updatedTicket);
    }

    res.json(updatedTicket);
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { 
        createdById: req.user.id,
        isDeleted: false 
      },
      include: {
        room: true,
        equipment: true,
        category: true,
        assignedTo: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    const statusOrder = { 'not_start': 1, 'in_progress': 2, 'completed': 3 };
    const sortedTickets = tickets.sort((a, b) => {
      const orderA = statusOrder[a.status] || 99;
      const orderB = statusOrder[b.status] || 99;
      return orderA !== orderB ? orderA - orderB : new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(sortedTickets);
  } catch (err) {
    logger.error("❌ List Tickets Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.history = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const userId = req.user.id;

    const where = {
      createdById: userId,
      status: 'completed',
      isDeleted: false
    };

    if (categoryId && categoryId !== 'all' && !isNaN(parseInt(categoryId))) {
      where.categoryId = parseInt(categoryId);
    }

    const allTickets = await prisma.ticket.findMany({
      where,
      include: {
        category: true,
        room: true,
        equipment: true,
        assignedTo: true,
        createdBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(allTickets);
  } catch (err) {
    logger.error("❌ History Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.read = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: parseInt(id),
        isDeleted: false
      },
      include: {
        room: true,
        equipment: true,
        category: true,
        createdBy: true,
        assignedTo: true,
        logs: { orderBy: { createdAt: 'desc' } },
        images: true,
        notification: true
      }
    });
    res.json(ticket);
  } catch (err) {
    logger.error("❌ Read Ticket Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.listAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = { isDeleted: false };

    if (status && status !== 'all' && status !== 'All') {
      where.status = status;
    } else {
      where.status = { not: 'rejected' };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        ...(Number(search) ? [{ id: Number(search) }] : []),
        { createdBy: { name: { contains: search } } },
        { createdBy: { email: { contains: search } } },
        { assignedTo: { name: { contains: search } } },
        { assignedTo: { email: { contains: search } } }
      ];
    }

    const [tickets, total] = await prisma.$transaction([
      prisma.ticket.findMany({
        where,
        skip,
        take,
        include: {
            room: true,
            equipment: true,
            category: true,
            createdBy: true,
            assignedTo: true
        },
        orderBy: [
            { status: 'desc' }, 
            { urgency: 'asc' }, 
            { createdAt: 'desc' } 
        ]
      }),
      prisma.ticket.count({ where })
    ]);

    res.json({
      data: tickets,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / take)
    });
  } catch (err) {
    logger.error("❌ List All Tickets Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const checkTicket = await prisma.ticket.findFirst({
      where: { id: parseInt(id), isDeleted: false },
    });

    if (!checkTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (
      req.user.role !== "admin" &&
      req.user.role !== "it_support" &&
      checkTicket.status !== "not_start"
    ) {
      return res.status(403).json({
        message: "Access Denied: Cannot delete ticket that is being processed or completed."
      });
    }

    await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: { isDeleted: true, deletedAt: new Date() }
    });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    logger.error("❌ Remove Ticket Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.listByEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const tickets = await prisma.ticket.findMany({
      where: { equipmentId: parseInt(id), isDeleted: false },
      include: { createdBy: true, category: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (err) {
    logger.error("❌ List By Equipment Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.submitFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { susValues, userFeedback } = feedbackSchema.parse(req.body);

    let sum = 0;
    susValues.forEach((val, index) => {
      if (index % 2 === 0) sum += (val - 1);
      else sum += (5 - val);
    });

    const finalScore = sum * 2.5;

    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
      include: { assignedTo: true }
    });

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const updatedTicket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        rating: Math.round(finalScore),
        susDetails: JSON.stringify(susValues),
        userFeedback
      }
    });

    if (ticket.assignedToId) {
      const itUser = await prisma.user.findUnique({
        where: { id: ticket.assignedToId },
        select: { totalRated: true, avgRating: true }
      });

      if (itUser) {
        const newTotal = (itUser.totalRated || 0) + 1;
        const newAvg = (((itUser.avgRating || 0) * (itUser.totalRated || 0)) + finalScore) / newTotal;

        await prisma.user.update({
          where: { id: ticket.assignedToId },
          data: { totalRated: newTotal, avgRating: newAvg }
        });

        // [NEW] Send Email to IT Support about the feedback
        if (itUser.isEmailEnabled !== false) {
           const { sendEmailNotification } = require("../utils/sendEmailHelper");
           const recipient = itUser.notificationEmail && itUser.notificationEmail.includes("@") 
              ? itUser.notificationEmail 
              : itUser.email;

           if (recipient && recipient.includes("@")) {
              await sendEmailNotification(
                "ticket_feedback_it",
                recipient,
                {
                   ticketId: ticket.id,
                   title: ticket.title,
                   rater: req.user.name || req.user.email,
                   rating: Math.round(finalScore),
                   comments: userFeedback || "No comments",
                   link: `${process.env.FRONTEND_URL}/it/ticket/${ticket.id}`
                }
              ).catch(e => logger.error("Feedback Email Error:", e));
           }
        }
      }
    }

    res.json(updatedTicket);
  } catch (err) {
    next(err);
  }
};
