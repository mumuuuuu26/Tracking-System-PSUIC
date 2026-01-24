// controllers/equipment.js
const prisma = require("../config/prisma");
const QRCode = require("qrcode");

// 1. สร้างอุปกรณ์พร้อม Generate QR Code
exports.create = async (req, res) => {
  try {
    const { name, type, serialNo, roomId } = req.body;

    // สร้าง Equipment ก่อนเพื่อเอา ID มาทำ QR
    const equipment = await prisma.equipment.create({
      data: {
        name,
        type,
        serialNo,
        roomId: parseInt(roomId),
      },
    });

    // Generate Unique QR Code String
    const qrData = `EQUIPMENT_${equipment.id}_${Date.now()}`;

    // Update Equipment กลับไปด้วย qrData ที่ gen มา
    const updatedEquipment = await prisma.equipment.update({
      where: { id: equipment.id },
      data: { qrCode: qrData },
      include: { room: true },
    });

    // สร้าง Base64 Image สำหรับส่งให้ Front-end แสดงผลทันที
    const qrCodeImage = await QRCode.toDataURL(qrData);

    res.json({
      ...updatedEquipment,
      qrCodeImage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// 2. ดูรายการอุปกรณ์ทั้งหมด (สำหรับหน้า Admin/Dashboard)
exports.list = async (req, res) => {
  try {
    const equipments = await prisma.equipment.findMany({
      include: {
        room: true,
        _count: {
          select: { tickets: true },
        },
      },
      orderBy: { id: "desc" },
    });
    res.json(equipments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// 3. ดึงข้อมูลอุปกรณ์จาก QR Code (สำหรับหน้า Scan QR ของ User)
exports.getByQRCode = async (req, res) => {
  try {
    const { qrCode } = req.params;

    const equipment = await prisma.equipment.findUnique({
      where: { qrCode },
      include: {
        room: true,
        tickets: {
          where: {
            status: { not: "Fixed" }, // แสดงเฉพาะงานที่ยังซ่อมไม่เสร็จ
          },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            category: true,
            createdBy: { select: { name: true } },
          },
        },
      },
    });

    if (!equipment) {
      return res.status(404).json({ message: "ไม่พบข้อมูลอุปกรณ์นี้ในระบบ" });
    }

    res.json(equipment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// 4. ดึงข้อมูลอุปกรณ์จาก ID พร้อมสถิติ (Enhanced Version)
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const equipment = await prisma.equipment.findUnique({
      where: { id: parseInt(id) },
      include: {
        room: true,
        tickets: {
          where: {
            OR: [
              { status: "pending" },
              { status: "in_progress" },
              {
                AND: [
                  { status: "Fixed" },
                  {
                    updatedAt: {
                      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // ย้อนหลัง 30 วัน
                    },
                  },
                ],
              },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            category: true,
            createdBy: { select: { name: true, email: true } },
            assignedTo: { select: { name: true } },
          },
        },
        _count: {
          select: { tickets: true },
        },
      },
    });

    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    // คำนวณข้อมูลเพิ่มเติมก่อนส่งกลับ (Computed Fields)
    const enhancedEquipment = {
      ...equipment,
      totalTickets: equipment._count.tickets,
      activeIssues: equipment.tickets.filter((t) =>
        ["pending", "in_progress"].includes(t.status)
      ).length,
      lastMaintenance:
        equipment.tickets
          .filter((t) => t.status === "Fixed")
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]
          ?.updatedAt || null,
    };

    res.json(enhancedEquipment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// 5. Generate QR Code Image ใหม่ (กรณีต้องการดาวน์โหลดซ้ำ)
exports.generateQR = async (req, res) => {
  try {
    const { id } = req.params;

    const equipment = await prisma.equipment.findUnique({
      where: { id: parseInt(id) },
      include: { room: true },
    });

    if (!equipment || !equipment.qrCode) {
      return res.status(400).json({ message: "No QR Code for this equipment" });
    }

    const qrCodeImage = await QRCode.toDataURL(equipment.qrCode);

    res.json({
      qrCodeImage,
      equipment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, serialNo, roomId, status } = req.body;

    const equipment = await prisma.equipment.update({
      where: { id: parseInt(id) },
      data: {
        name,
        type,
        serialNo,
        roomId: parseInt(roomId),
        status
      },
      include: { room: true }
    });

    res.json(equipment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if has active tickets
    const activeTickets = await prisma.ticket.count({
      where: {
        equipmentId: parseInt(id),
        status: { not: "Fixed" }
      }
    });

    if (activeTickets > 0) {
      return res.status(400).json({
        message: "Cannot delete equipment with active tickets"
      });
    }

    await prisma.equipment.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: "Equipment deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

