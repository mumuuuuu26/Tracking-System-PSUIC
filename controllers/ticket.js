const prisma = require("../config/prisma");
const { logger } = require("../utils/logger");
const { saveImage } = require("../utils/uploadImage");
const { z } = require("zod");

// --- Validation Schemas ---
const createTicketSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  urgency: z.enum(["Low", "Medium", "High"]),
  roomId: z.preprocess((val) => parseInt(val), z.number()),
  equipmentId: z.preprocess((val) => val ? parseInt(val) : null, z.number().nullable()).optional(),
  categoryId: z.preprocess((val) => val ? parseInt(val) : null, z.number().nullable()).optional(),
  subComponent: z.string().nullable().optional(),
  images: z.array(z.string()).optional(),
});

const updateTicketSchema = z.object({
  status: z.enum(["not_start", "in_progress", "completed", "rejected"]).optional(),
  urgency: z.enum(["Low", "Medium", "High"]).optional(),
  assignedToId: z.preprocess((val) => val ? parseInt(val) : null, z.number().nullable()).optional(),
  adminNote: z.string().optional(),
  categoryId: z.preprocess((val) => val ? parseInt(val) : null, z.number().nullable()).optional(),
  subComponent: z.string().nullable().optional(),
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
      categoryId,
      subComponent
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
        subComponent,
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

    // Fetch IT/admin users ONCE — shared for both email and DB notifications
    const itUsers = await prisma.user.findMany({
      where: {
        OR: [{ role: "it_support" }, { role: "admin" }],
        enabled: true,
      },
      select: {
        id: true,
        email: true,
        isEmailEnabled: true,
        notificationEmail: true
      },
    });

    // Email notification
    if (itUsers.length > 0) {
      try {
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
      } catch (emailError) {
        logger.error(`❌ Email Notification Failed for Ticket #${newTicket.id}:`, emailError);
      }
    }

    // Database Notifications — reuse the same itUsers list fetched above
    if (itUsers.length > 0) {
      await prisma.notification.createMany({
        data: itUsers.map((user) => ({
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

    // Since the route is protected by `itCheck`, only admin or it_support can reach this point.
    // They can update any ticket, so we don't need the old role check block.

    let updateData = {};
    if (status) updateData.status = status;
    if (urgency) updateData.urgency = urgency;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (adminNote !== undefined) updateData.note = adminNote;
    if (validatedData.subComponent !== undefined) updateData.subComponent = validatedData.subComponent;

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
            link: `${process.env.FRONTEND_URL}/user/ticket/${updatedTicket.id}`
          }
        );
      } catch (e) { logger.error("Email notification failed", e); }
    }

    if (updatedTicket.createdBy && updatedTicket.createdById) {
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

exports.list = async (req, res, next) => {
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
    next(err);
  }
};

exports.history = async (req, res, next) => {
  try {
    const { categoryId } = req.query;
    const userId = req.user.id;

    const where = {
      createdById: userId,
      status: { in: ['completed', 'rejected'] },
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
    next(err);
  }
};

exports.read = async (req, res, next) => {
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
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    res.json(ticket);
  } catch (err) {
    next(err);
  }
};

exports.listAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = { isDeleted: false };

    if (status && status !== 'all' && status !== 'All') {
      where.status = status;
    } // No else - if 'all', we don't apply any status filter, showing everything including rejected

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
    next(err);
  }
};

exports.remove = async (req, res, next) => {
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
    next(err);
  }
};

exports.listByEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tickets = await prisma.ticket.findMany({
      where: { equipmentId: parseInt(id), isDeleted: false },
      include: { createdBy: true, category: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (err) {
    next(err);
  }
};


