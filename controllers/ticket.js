const prisma = require("../config/prisma");
const transporter = require("../config/nodemailer");


//สร้าง Ticket (Create)
exports.create = async (req, res) => {
  try {
    // รับค่า categoryId เข้ามาด้วย
    const {
      title,
      description,
      urgency,
      roomId,
      equipmentId,
      images,
      categoryId,
    } = req.body;

    const newTicket = await prisma.ticket.create({
      data: {
        title,
        description,
        urgency,
        createdById: req.user.id,
        roomId: parseInt(roomId),
        // แปลงเป็น Int หรือเป็น null ถ้าไม่ส่งมา
        equipmentId: equipmentId ? parseInt(equipmentId) : null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        status: "pending", // แก้เป็น pending เพื่อให้ IT เห็นทันที
        images: {
          create:
            images &&
            images.map((img) => ({
              asset_id: img.asset_id,
              public_id: img.public_id,
              url: img.url,
              secure_url: img.secure_url,
              type: "before",
            })),
        },
        logs: {
          create: {
            action: "Create",
            detail: "เปิดใบแจ้งซ่อมใหม่",
            updatedById: req.user.id,
          },
        },
      },
      include: { images: true, logs: true, category: true },
    });
    // --- Notification Logic ---
    // 1. Notify IT Support via Email
    // 1. Notify IT Support via Email
    const itUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: "admin" },
          { role: "it_support" }, // [FIX] Add it_support role
          { department: "IT Support" }
        ],
      },
      select: { id: true, email: true }, // Select ID too

    });

    const emails = itUsers.map((u) => u.email).filter(Boolean);


    if (emails.length > 0) {
      const mailOptions = {
        from: process.env.MAIL_USER,
        to: emails,
        subject: `[New Ticket] ${title}`,
        html: `
          <h3>New Ticket Created</h3>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Description:</strong> ${description}</p>
          <p><strong>Urgency:</strong> ${urgency}</p>
          <p><strong>Room:</strong> ${newTicket.room ? newTicket.room.roomNumber : roomId}</p>
          <br />
          <p>Please check the IT Dashboard.</p>
        `,
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.log("Email Send Error:", err);
        else console.log("Email Sent:", info.response);
      });

      // [NEW] Save Notification to DB for each IT user
      const notificationsData = itUsers.map(user => ({
        userId: user.id, // We need to select id in the query above!
        ticketId: newTicket.id,
        title: "New Ticket Created",
        message: `Ticket "${title}" has been created.`,
        type: "ticket_create"
      }));

      if (notificationsData.length > 0) {
        await prisma.notification.createMany({
          data: notificationsData
        });
      }
    }


    // 2. Real-time Update via Socket.io
    if (req.io) {
      req.io.emit("server:new-ticket", newTicket);
    }

    res.json(newTicket);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error: Create Ticket Failed" });
  }
};

//ดูรายการ Ticket ของฉัน (List)
exports.list = async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { createdById: req.user.id },
      include: {
        createdBy: {
          select: { id: true, username: true, name: true, role: true },
        },
        assignedTo: { select: { id: true, name: true } },
        room: true,
        equipment: true,
        category: true, // เพิ่ม category
        images: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(tickets);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error: List Tickets Failed" });
  }
};

//ดูรายละเอียด Ticket ตาม ID (Read)
exports.read = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assignedTo: true,
        room: true,
        equipment: true,
        category: true, // เพิ่ม category
        images: true,
        logs: { orderBy: { createdAt: "desc" } },
        appointment: true,
      },
    });
    res.json(ticket);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error: Read Ticket Failed" });
  }
};

//อัปเดตสถานะ Ticket (Update)
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    // รับค่า rating, userFeedback, categoryId เพิ่มเข้ามา
    const {
      status,
      urgency,
      assignedToId,
      adminNote,
      rating,
      userFeedback,
      categoryId,
    } = req.body;

    let updateData = {};
    if (status) updateData.status = status;
    if (urgency) updateData.urgency = urgency;
    if (assignedToId) updateData.assignedToId = parseInt(assignedToId);
    if (rating) updateData.rating = parseInt(rating);
    if (userFeedback) updateData.userFeedback = userFeedback;
    if (categoryId) updateData.categoryId = parseInt(categoryId);

    const updatedTicket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        ...updateData,
        logs: {
          create: {
            action: "Update",
            detail: `อัปเดตข้อมูล: ${status ? `สถานะ->${status} ` : ""}${adminNote ? `Note: ${adminNote}` : ""
              }`,
            updatedById: req.user?.id || null,
          },
        },
      },
    });

    // --- Notification Logic ---
    // Notify User via Email on status/update change
    const ticketOwner = await prisma.user.findUnique({
      where: { id: updatedTicket.createdById },
      select: { id: true, email: true }

    });

    if (ticketOwner) {
      // 1. Send Email
      if (ticketOwner.email) {
        const mailOptions = {
          from: process.env.MAIL_USER,
          to: ticketOwner.email,
          subject: `[Ticket Updated] ${updatedTicket.title}`,
          html: `
              <h3>Ticket Updated</h3>
              <p><strong>Status:</strong> ${updatedTicket.status}</p>
              <p><strong>Note:</strong> ${adminNote || "-"}</p>
              <br />
              <p>Check "My Tickets" for details.</p>
            `,
        };

        transporter.sendMail(mailOptions, (err, info) => {
          if (err) console.log("Email Send Error:", err);
          else console.log("Email Sent:", info.response);
        });
      }

      // 2. Save Notification to DB
      await prisma.notification.create({
        data: {
          userId: ticketOwner.id,
          ticketId: updatedTicket.id,
          title: "Ticket Updated",
          message: `Ticket "${updatedTicket.title}" status is now ${updatedTicket.status}.`,
          type: "ticket_update"
        }
      });
    }


    if (req.io) {
      req.io.emit("server:update-ticket", updatedTicket);
    }
    res.json(updatedTicket);


  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error: Update Ticket Failed" });
  }
};

//ลบ Ticket (Remove)
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.ticket.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Ticket Deleted Successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error: Remove Ticket Failed" });
  }
};

//ดูใบแจ้งซ่อมทั้งหมด (ListAll) - Admin
exports.listAll = async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        room: true,
        images: true,
        category: true, // เพิ่ม category
        createdBy: { select: { name: true, email: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(tickets);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error: List All Failed" });
  }
};

//ดูประวัติการซ่อมของอุปกรณ์ (By Equipment ID)
exports.listByEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const tickets = await prisma.ticket.findMany({
      where: { equipmentId: parseInt(id) },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        urgency: true,
        category: { select: { name: true } }, // แสดงชื่อหมวดหมู่ด้วย
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });
    res.json(tickets);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Server Error: Get Equipment History Failed" });
  }
};

//ให้คะแนนความพึงพอใจ (Submit Feedback)
exports.submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const ticketId = parseInt(id);
    if (isNaN(ticketId)) {
      return res.status(400).json({ message: "Invalid Ticket ID" });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { assignedTo: true }
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.createdById !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Update Ticket
    await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        rating: parseInt(rating),
        userFeedback: comment,
        logs: {
          create: {
            action: "Feedback",
            detail: `User gave ${rating} stars. Comment: ${comment}`,
            updatedById: req.user.id
          }
        }
      }
    });

    // Update IT Stats if assigned
    if (ticket.assignedToId) {
      const itUser = await prisma.user.findUnique({ where: { id: ticket.assignedToId } });
      if (itUser) {
        const newTotalRated = itUser.totalRated + 1;
        const currentTotalScore = (itUser.avgRating * itUser.totalRated);
        const newAvg = (currentTotalScore + parseInt(rating)) / newTotalRated;

        await prisma.user.update({
          where: { id: ticket.assignedToId },
          data: {
            totalRated: newTotalRated,
            avgRating: newAvg
          }
        });
      }
    }

    res.json({ message: "Feedback submitted successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error: Submit Feedback Failed" });
  }
};
