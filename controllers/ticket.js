const prisma = require("../config/prisma");

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
        status: "Draft", // เริ่มต้นเป็น Draft ตาม Requirement
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
            detail: "เปิดใบแจ้งซ่อมใหม่ (Draft)",
            updatedBy: req.user.username || req.user.email,
          },
        },
      },
      include: { images: true, logs: true, category: true },
    });
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
            detail: `อัปเดตข้อมูล: ${status ? `สถานะ->${status} ` : ""}${
              adminNote ? `Note: ${adminNote}` : ""
            }`,
            updatedBy: req.user.username || "System",
          },
        },
      },
    });
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
