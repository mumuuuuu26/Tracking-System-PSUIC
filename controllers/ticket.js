// controllers/ticket.js (ส่วนที่ต้องแก้ไข)
const prisma = require("../config/prisma");
const transporter = require("../config/nodemailer");

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
    } = req.body;

    console.log("📝 Creating new ticket...");

    const newTicket = await prisma.ticket.create({
      data: {
        title,
        description,
        urgency,
        createdById: req.user.id,
        roomId: parseInt(roomId),
        equipmentId: equipmentId ? parseInt(equipmentId) : null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        status: "pending",
      },
      include: {
        room: true,
        equipment: true,
        category: true,
        createdBy: true,
      },
    });

    console.log("✅ Ticket created:", newTicket.id);

    // ส่ง Email แจ้งเตือน IT Support
    try {
      // ตรวจสอบ config ก่อนส่ง
      if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
        console.warn(
          "⚠️ WARNING: MAIL_USER or MAIL_PASS is not set in .env file"
        );
        console.log("Skipping email notification...");
      } else {
        console.log("📧 Attempting to send email notification...");

        // ดึง IT Support emails
        const itUsers = await prisma.user.findMany({
          where: {
            OR: [{ role: "it_support" }, { role: "admin" }],
            enabled: true,
          },
          select: {
            id: true,
            email: true,
            name: true,
          },
        });

        console.log(`Found ${itUsers.length} IT staff to notify`);

        if (itUsers.length > 0) {
          const emails = itUsers
            .map((u) => u.email)
            .filter((email) => email && email.includes("@"));

          if (emails.length > 0) {
            console.log("Sending to:", emails.join(", "));

            const mailOptions = {
              from: `"PSUIC Help Desk" <${process.env.MAIL_USER}>`,
              to: emails.join(", "),
              subject: `🔔 [Urgent: ${urgency}] New Ticket #${newTicket.id}: ${title}`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <style>
                    body { font-family: Arial, sans-serif; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2563eb; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
                    .content { background: #f3f4f6; padding: 20px; border-radius: 0 0 10px 10px; }
                    .badge { padding: 5px 10px; border-radius: 5px; font-size: 12px; }
                    .high { background: #ef4444; color: white; }
                    .medium { background: #f59e0b; color: white; }
                    .low { background: #10b981; color: white; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h2>🛠️ New Support Ticket</h2>
                    </div>
                    <div class="content">
                      <p><strong>Ticket ID:</strong> #${newTicket.id}</p>
                      <p><strong>Title:</strong> ${title}</p>
                      <p><strong>Priority:</strong> <span class="badge ${urgency.toLowerCase()}">${urgency}</span></p>
                      <p><strong>Room:</strong> ${newTicket.room?.roomNumber || "N/A"
                }</p>
                      <p><strong>Equipment:</strong> ${newTicket.equipment?.name || "N/A"
                }</p>
                      <p><strong>Category:</strong> ${newTicket.category?.name || "N/A"
                }</p>
                      <p><strong>Description:</strong></p>
                      <div style="background: white; padding: 10px; border-radius: 5px;">
                        ${description}
                      </div>
                      <p><strong>Reported by:</strong> ${newTicket.createdBy?.name || newTicket.createdBy?.email
                }</p>
                      <br>
                      <a href="http://localhost:5173/it/ticket/${newTicket.id}" 
                         style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        View Ticket
                      </a>
                    </div>
                  </div>
                </body>
                </html>
              `,
            };

            await transporter.sendMail(mailOptions);
            console.log("✅ Email Sent: Notification sent to IT staff");
          } else {
            console.warn("⚠️ No valid IT email addresses found");
          }
        }
      }
    } catch (emailError) {
      console.error("❌ Email Send Error:", emailError.message);
      // ไม่ให้ email error ทำให้การสร้าง ticket ล้มเหลว
    }

    // บันทึก Notification ใน database
    const itUsers = await prisma.user.findMany({
      where: {
        OR: [{ role: "it_support" }, { role: "admin" }],
        enabled: true,
      },
      select: { id: true },
    });

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

    let updateData = {};
    if (status) updateData.status = status;
    if (urgency) updateData.urgency = urgency;
    if (assignedToId) updateData.assignedToId = parseInt(assignedToId);
    if (rating) updateData.rating = parseInt(rating);
    if (userFeedback) updateData.userFeedback = userFeedback;
    if (categoryId) updateData.categoryId = parseInt(categoryId);

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
      try {
        if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
          console.warn("⚠️ Email config missing, skipping notification");
        } else {
          console.log("📧 Sending completion notification to user...");

          const mailOptions = {
            from: `"PSUIC Help Desk" <${process.env.MAIL_USER}>`,
            to: updatedTicket.createdBy.email,
            subject: `✅ Ticket #${updatedTicket.id} has been resolved`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: #10b981; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
                  .content { background: #f3f4f6; padding: 20px; border-radius: 0 0 10px 10px; }
                  .success-box { background: #d1fae5; padding: 15px; border-radius: 5px; margin: 15px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h2>✅ Your Ticket Has Been Resolved!</h2>
                  </div>
                  <div class="content">
                    <div class="success-box">
                      <p><strong>Good news!</strong> Your support ticket has been successfully resolved.</p>
                    </div>
                    
                    <h3>Ticket Details:</h3>
                    <p><strong>Ticket ID:</strong> #${updatedTicket.id}</p>
                    <p><strong>Title:</strong> ${updatedTicket.title}</p>
                    <p><strong>Room:</strong> ${updatedTicket.room?.roomNumber || "N/A"
              }</p>
                    <p><strong>IT Support:</strong> ${updatedTicket.assignedTo?.name || "IT Team"
              }</p>
                    
                    <p style="margin-top: 20px;">Please take a moment to rate our service:</p>
                    <a href="http://localhost:5173/user/feedback/${updatedTicket.id
              }" 
                       style="background: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                      ⭐ Rate Service
                    </a>
                    
                    <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                      Thank you for using PSUIC Help Desk System
                    </p>
                  </div>
                </div>
              </body>
              </html>
            `,
          };

          await transporter.sendMail(mailOptions);
          console.log("✅ Email Sent: User notified of ticket completion");
        }
      } catch (emailError) {
        console.error("❌ Email Error:", emailError.message);
      }
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
        assignedTo: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
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
        logs: true
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
    res.json(tickets);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete ticket
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
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
