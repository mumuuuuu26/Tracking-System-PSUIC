// controllers/ticket.js (ส่วนที่ต้องแก้ไข)
const prisma = require("../config/prisma");
const transporter = require("../config/nodemailer");
const { saveImage } = require("../utils/uploadImage");

exports.create = async (req, res) => {
  try {
    const {
      title,
      description,
      urgency,
      roomId,
      equipmentId,
      images,
      categoryId,
      date, // [NEW] YYYY-MM-DD
      time  // [NEW] HH:mm
    } = req.body;

    console.log("📝 Creating new ticket...");

    let assignedToId = null;
    let appointmentStatus = "pending";
    let scheduledDate = null;

    // === [NEW] Auto-Booking Logic ===
    if (date && time) {
      const startDateTime = new Date(`${date}T${time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 Hour

      // 1. Find ALL IT Support staff
      const itStaff = await prisma.user.findMany({
        where: { role: 'it_support', enabled: true },
        select: { id: true }
      });

      // 2. Find Available IT
      for (const it of itStaff) {
        // Check appointments
        const busyAppt = await prisma.appointment.findFirst({
          where: {
            itSupportId: it.id,
            status: { not: 'cancelled' },
            scheduledAt: {
              gte: startDateTime,
              lt: endDateTime
            }
          }
        });

        if (busyAppt) continue;

        // Check personal tasks
        const busyTask = await prisma.personalTask.findFirst({
          where: {
            userId: it.id,
            // Simple check for overlap
            startTime: { lt: endDateTime },
            endTime: { gt: startDateTime }
          }
        });

        if (busyTask) continue;

        // Found one!
        assignedToId = it.id;
        break;
      }

      if (assignedToId) {
        appointmentStatus = "scheduled";
        scheduledDate = startDateTime;
      } else {
        // If user requested a time but NO IT is available
        // Should we fail or just create pending?
        // User said "If IT not free, cannot choose". Validation should have blocked it frontend.
        // But double check backend.
        return res.status(400).json({ message: "Selected time slot is no longer available." });
      }
    }

    const newTicket = await prisma.ticket.create({
      data: {
        title,
        description,
        urgency,
        createdById: req.user.id,
        roomId: parseInt(roomId),
        equipmentId: equipmentId ? parseInt(equipmentId) : null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        status: appointmentStatus,
        assignedToId: assignedToId, // Assigned if booked
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
        } : undefined,
        // Create Appointment if Scheduled
        appointment: scheduledDate ? {
          create: {
            itSupportId: assignedToId,
            scheduledAt: scheduledDate,
            status: 'scheduled',
            note: 'Auto-booked via Create Ticket'
          }
        } : undefined
      },
      include: {
        room: true,
        equipment: true,
        category: true,
        createdBy: true,
        images: true,
        appointment: true // Return appointment info
      },
    });

    console.log("✅ Ticket created:", newTicket.id);

    // ... (Email notification logic remains same, but might need to notify Assigned IT specifically if booked)

    // ส่ง Email แจ้งเตือน IT Support
    try {
      // ดึง IT Support emails
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
        // Filter users who want emails AND have a valid email address
        const emails = itUsers
          .filter(u => u.isEmailEnabled !== false) // Default is true, but check explicit false
          .map(u => u.notificationEmail && u.notificationEmail.includes("@") ? u.notificationEmail : u.email)
          .filter(email => email && email.includes("@"));

        if (emails.length > 0) {
          const { sendEmailNotification } = require("../utils/sendEmailHelper");
          await sendEmailNotification(
            "new_ticket_it",
            emails,
            {
              id: newTicket.id,
              title: title,
              urgency: newTicket.urgency,
              description: description,
              room: newTicket.room?.roomNumber || "N/A",
              equipment: newTicket.equipment?.name || "N/A",
              category: newTicket.category?.name || "N/A",
              reporter: newTicket.createdBy?.name || newTicket.createdBy?.email,
              link: `http://localhost:5173/it/ticket/${newTicket.id}`
            }
          );
        }
      }
    } catch (emailError) {
      console.error("❌ Email Send Error:", emailError.message);
    }

    // บันทึก Notification ใน database
    const userForNotify = await prisma.user.findMany({
      where: {
        OR: [{ role: "it_support" }, { role: "admin" }],
        enabled: true,
      },
      select: { id: true },
    });

    if (userForNotify.length > 0) {
      // If auto-assigned, maybe notify SPECIFIC IT differently?
      // For now broadcast new ticket is fine.
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

    // Real-time notification
    if (req.io) {
      req.io.emit("server:new-ticket", newTicket);
    }

    res.json(newTicket);
  } catch (err) {
    console.error("❌ Create Ticket Error:", err);
    res.status(500).json({ message: "Server Error: Create Ticket Failed" });
  }
};

// อัพเดทสถานะและส่ง email แจ้ง user
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      urgency,
      assignedToId,
      adminNote,
      rating,
      userFeedback,
      categoryId,
    } = req.body;

    console.log(`📝 Updating ticket #${id} - Status: ${status}`);

    // [New] Data Integrity Check
    const checkTicket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
    });

    if (!checkTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // ถ้าเป็น User ธรรมดา และสถานะไม่ใช่ Pending ห้ามแก้ไข
    if (
      req.user.role !== "admin" &&
      req.user.role !== "it_support" &&
      checkTicket.status !== "pending" &&
      // อนุญาตให้แก้ไข rating/feedback ได้ตอน fixed
      status !== "fixed" && // User ไม่ได้เป็นคนเปลี่ยน status เป็น fixed แต่ถ้า user ส่ง rating มา status น่าจะยังเป็น fixed หรือ user อาจจะไม่ได้ส่ง status มา
      !rating && !userFeedback // ถ้าไม่ใช่การให้ rating/feedback
    ) {
      // แต่เดี๋ยวก่อน... userFeedback เรียก endpoint submitFeedback แยก หรือ update?
      // ดูที่ submitFeedback export แยกต่างหาก (exports.submitFeedback)
      // ดังนั้น update ตรงนี้ user แทบไม่ได้ใช้ นอกจากแก้รายละเอียด?

      return res.status(403).json({
        message: "Access Denied: Cannot edit ticket that is being processed."
      });
    }

    let updateData = {};
    if (status) updateData.status = status;
    if (urgency) updateData.urgency = urgency;
    if (assignedToId) updateData.assignedToId = parseInt(assignedToId);
    if (rating) updateData.rating = parseInt(rating);
    if (userFeedback) updateData.userFeedback = userFeedback;
    if (categoryId) updateData.categoryId = parseInt(categoryId);

    // [New] SLA Calculation Logic
    if (status) {
      const currentTicket = await prisma.ticket.findUnique({
        where: { id: parseInt(id) },
        select: { createdAt: true, status: true, responseTime: true }
      });

      if (currentTicket) {
        const now = new Date();
        const created = new Date(currentTicket.createdAt);
        const diffMins = Math.floor((now - created) / 60000); // Minutes

        // Calculate Response Time (First time moving to in_progress)
        if (status === 'in_progress' && !currentTicket.responseTime) {
          updateData.responseTime = diffMins;
        }

        // Calculate Resolution Time (Moving to fixed)
        // Note: This updates every time it's marked fixed, capturing the total time until resolution.
        if (status === 'fixed') {
          updateData.resolutionTime = diffMins;
        }
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

    // ส่ง Email แจ้ง User เมื่อ ticket แก้ไขเสร็จ
    if (status === "fixed" && updatedTicket.createdBy?.email) {
      const { sendEmailNotification } = require("../utils/sendEmailHelper");
      await sendEmailNotification(
        "ticket_resolved_user",
        updatedTicket.createdBy.email,
        {
          id: updatedTicket.id,
          title: updatedTicket.title,
          room: updatedTicket.room?.roomNumber || "N/A",
          resolver: updatedTicket.assignedTo?.name || "IT Team",
          link: `http://localhost:5173/user/feedback/${updatedTicket.id}`
        }
      );
    }

    // บันทึก Notification
    if (updatedTicket.createdBy) {
      await prisma.notification.create({
        data: {
          userId: updatedTicket.createdById,
          ticketId: updatedTicket.id,
          title: status === "fixed" ? "Ticket Resolved!" : "Ticket Updated",
          message:
            status === "fixed"
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
    console.error("❌ Update Error:", err);
    res.status(500).json({ message: "Server Error: Update Ticket Failed" });
  }
};

// Get all tickets for current user
exports.list = async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { createdById: req.user.id },
      include: {
        room: true,
        equipment: true,
        category: true,
        assignedTo: true,
        appointment: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Custom Sort: Pending > In Progress > Scheduled > Fixed > Rejected
    const statusOrder = {
      'pending': 1,
      'in_progress': 2,
      'scheduled': 3,
      'fixed': 4,
      'closed': 4,
      'rejected': 5
    };

    const sortedTickets = tickets.sort((a, b) => {
      const orderA = statusOrder[a.status] || 99;
      const orderB = statusOrder[b.status] || 99;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // Secondary sort: Newest First (Descending)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(sortedTickets);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get single ticket by ID
exports.read = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
      include: {
        room: true,
        equipment: true,
        category: true,
        createdBy: true,
        assignedTo: true,
        logs: {
          orderBy: { createdAt: 'desc' }
        },
        images: true,
        appointment: true,
        notification: true
      }
    });
    res.json(ticket);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get ALL tickets (Admin/IT)
exports.listAll = async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        room: true,
        equipment: true,
        category: true,
        createdBy: true,
        assignedTo: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Custom Sort: Pending > In Progress > Scheduled > Fixed > Rejected
    const statusOrder = {
      'pending': 1,
      'in_progress': 2,
      'scheduled': 3,
      'fixed': 4,
      'closed': 4,
      'rejected': 5
    };

    const sortedTickets = tickets.sort((a, b) => {
      const orderA = statusOrder[a.status] || 99;
      const orderB = statusOrder[b.status] || 99;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // Secondary sort: Newest First (Descending)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(sortedTickets);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete ticket
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    // [New] Data Integrity Check
    const checkTicket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
    });

    if (!checkTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Role Check: If User AND Status != pending -> 403
    if (
      req.user.role !== "admin" &&
      req.user.role !== "it_support" &&
      checkTicket.status !== "pending"
    ) {
      return res.status(403).json({
        message: "Access Denied: Cannot delete ticket that is being processed or completed."
      });
    }

    await prisma.ticket.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// List tickets by equipment
exports.listByEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const tickets = await prisma.ticket.findMany({
      where: { equipmentId: parseInt(id) },
      include: {
        createdBy: true,
        category: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Submit feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, userFeedback } = req.body;

    const updated = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        rating: parseInt(rating),
        userFeedback
      }
    });
    res.json(updated);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
