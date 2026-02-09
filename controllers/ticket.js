// controllers/ticket.js (ส่วนที่ต้องแก้ไข)
const prisma = require("../config/prisma");
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
      categoryId
    } = req.body;

    const newTicket = await prisma.ticket.create({
      data: {
        title,
        description,
        urgency,
        createdById: req.user.id,
        roomId: parseInt(roomId),
        equipmentId: equipmentId ? parseInt(equipmentId) : null,
        categoryId: categoryId ? parseInt(categoryId) : null,
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
              link: `${process.env.FRONTEND_URL}/it/ticket/${newTicket.id}`
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

    // Data Integrity Check
    const checkTicket = await prisma.ticket.findFirst({
      where: { 
        id: parseInt(id),
        isDeleted: false 
      },
    });

    if (!checkTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // ถ้าเป็น User ธรรมดา และสถานะไม่ใช่ Pending ห้ามแก้ไข
    if (
      req.user.role !== "admin" &&
      req.user.role !== "it_support" &&
      checkTicket.status !== "not_start" &&
      // อนุญาตให้แก้ไข rating/feedback ได้ตอน completed
      status !== "completed" && // User ไม่ได้เป็นคนเปลี่ยน status เป็น completed แต่ถ้า user ส่ง rating มา status น่าจะยังเป็น completed หรือ user อาจจะไม่ได้ส่ง status มา
      !rating && !userFeedback // ถ้าไม่ใช่การให้ rating/feedback
    ) {
      // Note: User feedback usually goes through submitFeedback endpoint. 
      // This block allows minor updates if conditions met.

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

    // SLA Calculation Logic
    if (status) {
      const currentTicket = await prisma.ticket.findUnique({
        where: { id: parseInt(id) }, // No need to check isDeleted here again if checkTicket passed, but safer? checkTicket is already checked above.
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

        // Calculate Resolution Time (Moving to completed)
        // Note: This updates every time it's marked completed, capturing the total time until resolution.
        if (status === 'completed') {
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
    if (status === "completed" && updatedTicket.createdBy?.email) {
      const { sendEmailNotification } = require("../utils/sendEmailHelper");
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
    }

    // บันทึก Notification
    if (updatedTicket.createdBy) {
      await prisma.notification.create({
        data: {
          userId: updatedTicket.createdById,
          ticketId: updatedTicket.id,
          title: status === "completed" ? "Ticket Resolved!" : "Ticket Updated",
          message:
            status === "completed"
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

    // Custom Sort: Not Start > In Progress > Completed
    const statusOrder = {
      'not_start': 1,
      'in_progress': 2,
      'completed': 3
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
    console.error("❌ List Tickets Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get user ticket history with category filter
exports.history = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const userId = req.user.id;

    const where = {
      createdById: userId,
      isDeleted: false
    };

    // Robust filter handling
    if (categoryId && categoryId !== 'all' && categoryId !== 'undefined' && categoryId !== 'null') {
       const parsedCat = parseInt(categoryId);
       if (!isNaN(parsedCat)) {
           where.categoryId = parsedCat;
       }
    }

    const allTickets = await prisma.ticket.findMany({
      where,
      include: {
        category: true,
        room: true,
        equipment: true,
        assignedTo: true,
        createdBy: {
          select: {
            name: true
          }
        }
      }
    });

    // Custom Sort: Not Start > In Progress > Completed  
    const statusOrder = {
      'not_start': 1,
      'in_progress': 2,
      'completed': 3
    };

    const sortedTickets = allTickets.sort((a, b) => {
      const orderA = statusOrder[a.status] || 99;
      const orderB = statusOrder[b.status] || 99;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // Secondary sort: Newest First
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(sortedTickets);
  } catch (err) {
    console.error("❌ History Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get single ticket by ID
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
        logs: {
          orderBy: { createdAt: 'desc' }
        },
        images: true,
        notification: true
      }
    });
    res.json(ticket);
  } catch (err) {
    console.error("❌ Read Ticket Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get ALL tickets (Admin/IT)
// Get ALL tickets (Admin/IT) with Pagination & Search
exports.listAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build Where Clause
    const where = {
      isDeleted: false
    };

    if (status && status !== 'all' && status !== 'All') {
      where.status = status;
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

    // Use Transaction to get Data and Count in parallel
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
            // Status Sort: not_start(n) > in_progress(i) > completed(co) > closed(cl)
            { status: 'desc' }, 
            // Urgency Sort: Critical(c) > High(h) > Low(l) > Medium(m) > Normal(n)
            { urgency: 'asc' }, 
            // Date Sort: Newest First
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
    console.error("❌ List All Tickets Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete ticket
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Data Integrity Check
    const checkTicket = await prisma.ticket.findFirst({
      where: {
        id: parseInt(id),
        isDeleted: false
      },
    });

    if (!checkTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Role Check: If User AND Status != pending -> 403
    if (
      req.user.role !== "admin" &&
      req.user.role !== "it_support" &&
      checkTicket.status !== "not_start"
    ) {
      return res.status(403).json({
        message: "Access Denied: Cannot delete ticket that is being processed or completed."
      });
    }

    // Soft Delete
    await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error("❌ Remove Ticket Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// List tickets by equipment
exports.listByEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const tickets = await prisma.ticket.findMany({
      where: { 
        equipmentId: parseInt(id),
        isDeleted: false
      },
      include: {
        createdBy: true,
        category: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (err) {
    console.error("❌ List By Equipment Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Submit feedback
// Submit feedback (SUS Score Calculation)
exports.submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { susValues, userFeedback } = req.body; // Expecting array of 10 integers (1-5)

    // 1. Validate Input
    if (!susValues || !Array.isArray(susValues) || susValues.length !== 10) {
      // Fallback: If legacy call or simplified rating, handle cautiously? 
      // User requested "Correct calculation", so we enforce SUS.
      // But if frontend sends old format temporarily, we might break. 
      // Let's assume frontend is also updated.
      return res.status(400).json({ message: "Invalid Survey Data. Please answer all 10 questions." });
    }

    // 2. Calculate SUS Score
    // Odd items (1,3,5... index 0,2,4...): Score - 1
    // Even items (2,4,6... index 1,3,5...): 5 - Score
    let sum = 0;
    susValues.forEach((val, index) => {
      const score = parseInt(val);
      if (index % 2 === 0) {
        // Odd Question (Index 0, 2, 4...)
        sum += (score - 1);
      } else {
        // Even Question (Index 1, 3, 5...)
        sum += (5 - score);
      }
    });

    // SUS Score = Sum * 2.5 (Range 0-100)
    const finalScore = sum * 2.5;

    // 3. Get Ticket & Current IT Stats
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
      include: { assignedTo: true }
    });

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // 4. Update Ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        rating: Math.round(finalScore), // Store Int 0-100
        susDetails: JSON.stringify(susValues),
        userFeedback
      }
    });

    // 5. Update IT Support Stats
    if (ticket.assignedToId) {
      const itId = ticket.assignedToId;
      // Fetch fresh stats just in case
      const itUser = await prisma.user.findUnique({
        where: { id: itId },
        select: { totalRated: true, avgRating: true }
      });

      if (itUser) {
        const oldTotal = itUser.totalRated || 0;
        const oldAvg = itUser.avgRating || 0;

        const newTotal = oldTotal + 1;
        const newAvg = ((oldAvg * oldTotal) + finalScore) / newTotal;

        await prisma.user.update({
          where: { id: itId },
          data: {
            totalRated: newTotal,
            avgRating: newAvg
          }
        });
      }
    }

    res.json(updatedTicket);
  } catch (err) {
    console.error("❌ Submit Feedback Error:", err);
    res.status(500).json({ message: "Server Error: Feedback Submission Failed" });
  }
};
