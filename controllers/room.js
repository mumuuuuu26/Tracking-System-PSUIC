// controllers/room.js
const prisma = require("../config/prisma");
const { logger } = require("../utils/logger");

// สร้างห้อง
exports.create = async (req, res, next) => {
  try {
    const { roomNumber, building, floor, imageUrl } = req.body;

    const room = await prisma.room.create({
      data: {
        roomNumber,
        building,
        floor: parseInt(floor),
        imageUrl,
      },
    });

    res.json(room);
  } catch (err) {
    next(err);
  }
};

// ดูรายการห้องทั้งหมด
exports.list = async (req, res, next) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        _count: {
          select: { equipments: true },
        },
      },
      orderBy: { roomNumber: "asc" },
    });

    res.json(rooms);
  } catch (err) {
    next(err);
  }
};

// อัพเดทข้อมูลห้อง
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { roomNumber, building, floor, imageUrl } = req.body;

    const updated = await prisma.room.update({
      where: { id: parseInt(id) },
      data: {
        roomNumber,
        building,
        floor: parseInt(floor),
        imageUrl,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// ลบห้อง
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.room.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: "Room deleted successfully" });
  } catch (err) {
    next(err);
  }
};
