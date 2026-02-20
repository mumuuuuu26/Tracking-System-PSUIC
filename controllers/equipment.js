// controllers/equipment.js
const prisma = require("../config/prisma");
const { logger } = require("../utils/logger");
const QRCode = require("qrcode");

// 1. สร้างอุปกรณ์พร้อม Generate QR Code
exports.create = async (req, res, next) => {
  try {
    const { name, type, serialNo: inputSerialNo, roomId } = req.body;

    // Auto-generate Serial Number if not provided
    const serialNo = inputSerialNo || `SN-${Date.now()}`;

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
    next(err);
  }
};

// 2. ดูรายการอุปกรณ์ทั้งหมด (สำหรับหน้า Admin/Dashboard)
exports.list = async (req, res, next) => {
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
    next(err);
  }
};

// 3. ดึงข้อมูลอุปกรณ์จาก QR Code (สำหรับหน้า Scan QR ของ User)
exports.getByQRCode = async (req, res, next) => {
  try {
    const { qrCode } = req.params;

    // 1. Try exact QR Code match
    let equipment = await prisma.equipment.findUnique({
      where: { qrCode },
      include: {
        room: true,
        tickets: {
          where: { status: { not: "completed" } },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            category: true,
            createdBy: { select: { name: true } },
          },
        },
      },
    });

    // 2. Fallback: Try Serial Number
    if (!equipment) {
      equipment = await prisma.equipment.findFirst({
        where: { serialNo: qrCode },
        include: {
          room: true,
          tickets: {
            where: { status: { not: "completed" } },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
              category: true,
              createdBy: { select: { name: true } },
            },
          },
        },
      });
    }

    // 3. Fallback: Try ID (if input is numeric)
    if (!equipment && /^\d+$/.test(qrCode)) {
      equipment = await prisma.equipment.findUnique({
        where: { id: parseInt(qrCode) },
        include: {
          room: true,
          tickets: {
            where: { status: { not: "completed" } },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
              category: true,
              createdBy: { select: { name: true } },
            },
          },
        },
      });
    }

    if (!equipment) {
      return res.status(404).json({ message: "ไม่พบข้อมูลอุปกรณ์นี้ในระบบ" });
    }

    res.json(equipment);
  } catch (err) {
    next(err);
  }
};

// 4. ดึงข้อมูลอุปกรณ์จาก ID พร้อมสถิติ (Enhanced Version)
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const equipment = await prisma.equipment.findUnique({
      where: { id: parseInt(id) },
      include: {
        room: true,
        tickets: {
          // No status filter here — fetch all tickets so activeIssues can be calculated correctly
          orderBy: { createdAt: "desc" },
          take: 20,
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
        ["not_start", "in_progress"].includes(t.status)
      ).length,
      lastMaintenance:
        equipment.tickets
          .filter((t) => t.status === "completed")
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]
          ?.updatedAt || null,
    };

    res.json(enhancedEquipment);
  } catch (err) {
    next(err);
  }
};

// 5. Generate QR Code Image ใหม่ (กรณีต้องการดาวน์โหลดซ้ำ)
exports.generateQR = async (req, res, next) => {
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
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, serialNo, roomId, status } = req.body;

    const equipment = await prisma.equipment.update({
      where: { id: parseInt(id) },
      data: {
        name,
        type,
        serialNo,
        ...(roomId !== undefined && roomId !== '' && { roomId: parseInt(roomId) }),
        status
      },
      include: { room: true }
    });

    res.json(equipment);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if has active tickets
    const activeTickets = await prisma.ticket.count({
      where: {
        equipmentId: parseInt(id),
        status: { notIn: ["completed", "rejected"] }
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
    next(err);
  }
};
