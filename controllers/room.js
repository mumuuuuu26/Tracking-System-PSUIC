// controllers/room.js
const prisma = require("../config/prisma");

const normalizeRoomNumber = (value) =>
  String(value ?? "").replace(/^room\s*/i, "").trim();

const normalizeBuilding = (value) => String(value ?? "").trim();

const normalizeFloor = (value) => {
  const cleaned = String(value ?? "")
    .replace(/^floor\s*/i, "")
    .replace(/^fl\.?\s*/i, "")
    .trim();
  const parsed = Number.parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

// สร้างห้อง
exports.create = async (req, res, next) => {
  try {
    const { roomNumber, building, floor } = req.body;

    const normalizedRoomNumber = normalizeRoomNumber(roomNumber);
    const normalizedBuilding = normalizeBuilding(building);
    if (!normalizedRoomNumber || !normalizedBuilding) {
      return res.status(400).json({ message: "Room number and building are required" });
    }

    const parsedFloor = normalizeFloor(floor);
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

    const normalizedRooms = rooms.map((room) => ({
      ...room,
      roomNumber: normalizeRoomNumber(room.roomNumber),
    }));

    res.json(normalizedRooms);
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

    const normalizedRoomNumber = normalizeRoomNumber(roomNumber);
    const normalizedBuilding = normalizeBuilding(building);
    if (!normalizedRoomNumber || !normalizedBuilding) {
      return res.status(400).json({ message: "Room number and building are required" });
    }

    const parsedFloor = normalizeFloor(floor);
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
