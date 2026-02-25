const prisma = require("../config/prisma");
const { logger } = require("../utils/logger");
const { saveImage } = require("../utils/uploadImage");
const { getStatusWhere, normalizeTicketEntity } = require("../utils/ticketStatus");
const { z } = require("zod");

const EMAIL_ADDRESS_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeForEmail = (value, fallback = "N/A") => {
  const raw = value === undefined || value === null ? "" : String(value).trim();
  const normalized = raw || fallback;
  return normalized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

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

const ticketUserSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  phoneNumber: true,
  picture: true,
  role: true,
};

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

    const beforeImages = [];
    if (Array.isArray(images) && images.length > 0) {
      for (const imageBase64 of images) {
        const imageUrl = await saveImage(imageBase64, { scope: "ticket-before" });
        if (!imageUrl) {
          return res.status(400).json({ message: "Invalid ticket image data" });
        }

        beforeImages.push({
          url: imageUrl,
          secure_url: imageUrl,
          type: "before",
          asset_id: "local",
          public_id: "local",
        });
      }
    }

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
        images: beforeImages.length > 0 ? { create: beforeImages } : undefined,
      },
      include: {
        room: true,
        equipment: true,
        category: true,
        createdBy: { select: ticketUserSelect },
        images: true
      },
    });

    // Fetch IT/admin users once. DB notifications stay unchanged, but email is IT-only.
    const notificationUsers = await prisma.user.findMany({
      where: {
        OR: [{ role: "it_support" }, { role: "admin" }],
        enabled: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        isEmailEnabled: true,
        notificationEmail: true
      },
    });

    // Email notification: send only to IT notification emails (no admin, no account-email fallback)
    if (notificationUsers.length > 0) {
      try {
        const emails = [
          ...new Set(
            notificationUsers
              .filter(
                (u) =>
                  u.role === "it_support" &&
                  u.isEmailEnabled !== false &&
                  typeof u.notificationEmail === "string" &&
                  EMAIL_ADDRESS_REGEX.test(u.notificationEmail.trim())
              )
              .map((u) => u.notificationEmail.trim().toLowerCase())
          ),
        ];

        if (emails.length > 0) {
          const { sendEmailNotification } = require("../utils/sendEmailHelper");
          const frontendBaseUrl = (process.env.FRONTEND_URL || "").replace(/\/+$/, "");
          const createdAt = newTicket.createdAt
            ? new Date(newTicket.createdAt).toLocaleString("th-TH", {
                timeZone: process.env.APP_TIMEZONE || "Asia/Bangkok",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "N/A";

          await sendEmailNotification(
            "new_ticket_it",
            emails,
            {
              ticketId: sanitizeForEmail(newTicket.id),
              title: sanitizeForEmail(title),
              description: sanitizeForEmail(description),
              urgency: sanitizeForEmail(newTicket.urgency),
              status: sanitizeForEmail(newTicket.status),
              category: sanitizeForEmail(newTicket.category?.name),
              subComponent: sanitizeForEmail(newTicket.subComponent),
              room: sanitizeForEmail(newTicket.room?.roomNumber),
              building: sanitizeForEmail(newTicket.room?.building),
              floor: sanitizeForEmail(newTicket.room?.floor),
              equipment: sanitizeForEmail(newTicket.equipment?.name),
              equipmentType: sanitizeForEmail(newTicket.equipment?.type),
              reporterName: sanitizeForEmail(newTicket.createdBy?.name),
              reporterEmail: sanitizeForEmail(newTicket.createdBy?.email),
              reporterPhone: sanitizeForEmail(newTicket.createdBy?.phoneNumber),
              createdAt: sanitizeForEmail(createdAt),
              createdBy: sanitizeForEmail(newTicket.createdBy?.name || newTicket.createdBy?.email),
              reporter: sanitizeForEmail(newTicket.createdBy?.name || newTicket.createdBy?.email),
              link: sanitizeForEmail(
                frontendBaseUrl
                  ? `${frontendBaseUrl}/it/ticket/${newTicket.id}`
                  : `/it/ticket/${newTicket.id}`
              ),
            }
          );
          logger.info(
            `📨 New ticket email sent to IT notification list (${emails.length} recipient(s)) for ticket #${newTicket.id}`
          );
        } else {
          logger.warn(
            `⚠️ No IT notificationEmail recipient configured for ticket #${newTicket.id}. Email notification skipped.`
          );
        }
      } catch (emailError) {
        logger.error(`❌ Email Notification Failed for Ticket #${newTicket.id}:`, emailError);
      }
    }

    // Database Notifications — keep admin + IT in-app notifications
    if (notificationUsers.length > 0) {
      await prisma.notification.createMany({
        data: notificationUsers.map((user) => ({
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
      subComponent,
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
    if (subComponent !== undefined) updateData.subComponent = subComponent;

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
        createdBy: { select: ticketUserSelect },
        assignedTo: { select: ticketUserSelect },
        room: true,
        equipment: true,
      },
    });

    // Email policy (2026-02-25):
    // Send email only when a user creates a new ticket (IT notification recipients).
    // Do not send lifecycle emails on completed/rejected updates.

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
        assignedTo: { select: ticketUserSelect },
      },
    });

    const normalizedTickets = tickets.map(normalizeTicketEntity);
    const statusOrder = { 'not_start': 1, 'in_progress': 2, 'completed': 3, 'rejected': 4 };
    const sortedTickets = normalizedTickets.sort((a, b) => {
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
      status: { in: ['completed', 'complete', 'done', 'closed', 'resolved', 'rejected', 'reject', 'declined', 'cancelled', 'canceled'] },
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
        assignedTo: { select: ticketUserSelect },
        createdBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(allTickets.map(normalizeTicketEntity));
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
        createdBy: { select: ticketUserSelect },
        assignedTo: { select: ticketUserSelect },
        logs: { orderBy: { createdAt: 'desc' } },
        images: true,
        notification: true
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

exports.listAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status, floor, roomId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = { isDeleted: false };

    const statusWhere = getStatusWhere(status);
    if (statusWhere) {
      where.status = statusWhere;
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

    if (roomId !== undefined && roomId !== null && roomId !== "") {
      const parsedRoomId = Number.parseInt(roomId, 10);
      if (!Number.isNaN(parsedRoomId)) {
        where.roomId = parsedRoomId;
      }
    }

    if (floor !== undefined && floor !== null && floor !== "") {
      const parsedFloor = Number.parseInt(floor, 10);
      if (!Number.isNaN(parsedFloor)) {
        where.room = {
          ...(where.room || {}),
          floor: parsedFloor
        };
      }
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
            createdBy: { select: ticketUserSelect },
            assignedTo: { select: ticketUserSelect }
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
      data: tickets.map(normalizeTicketEntity),
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
      include: { createdBy: { select: ticketUserSelect }, category: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets.map(normalizeTicketEntity));
  } catch (err) {
    next(err);
  }
};
