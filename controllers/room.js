// controllers/room.js
const prisma = require("../config/prisma");

// สร้างห้อง
exports.create = async (req, res, next) => {
  try {
    const { roomNumber, building, floor } = req.body;

    const normalizedRoomNumber = String(roomNumber || "").trim();
    const normalizedBuilding = String(building || "").trim();
    if (!normalizedRoomNumber || !normalizedBuilding) {
      return res.status(400).json({ message: "Room number and building are required" });
    }

    const parsedFloor = Number.parseInt(floor, 10);
    if (!Number.isFinite(parsedFloor)) {
      return res.status(400).json({ message: "Invalid floor value" });
    }

    const room = await prisma.room.create({
      data: {
        roomNumber: normalizedRoomNumber,
        building: normalizedBuilding,
        floor: parsedFloor,
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
    const { roomNumber, building, floor } = req.body;

    const roomId = Number.parseInt(id, 10);
    if (!Number.isFinite(roomId)) {
      return res.status(400).json({ message: "Invalid room id" });
    }

    const normalizedRoomNumber = String(roomNumber || "").trim();
    const normalizedBuilding = String(building || "").trim();
    if (!normalizedRoomNumber || !normalizedBuilding) {
      return res.status(400).json({ message: "Room number and building are required" });
    }

    const parsedFloor = Number.parseInt(floor, 10);
    if (!Number.isFinite(parsedFloor)) {
      return res.status(400).json({ message: "Invalid floor value" });
    }

    const updated = await prisma.room.update({
      where: { id: roomId },
      data: {
        roomNumber: normalizedRoomNumber,
        building: normalizedBuilding,
        floor: parsedFloor,
      },
    });

    res.json(updated);
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ message: "Room not found" });
    }
    next(err);
  }
};

// ลบห้อง
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const roomId = Number.parseInt(id, 10);
    if (!Number.isFinite(roomId)) {
      return res.status(400).json({ message: "Invalid room id" });
    }

    await prisma.room.delete({
      where: { id: roomId },
    });

    res.json({ message: "Room deleted successfully" });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ message: "Room not found" });
    }
    next(err);
  }
};
