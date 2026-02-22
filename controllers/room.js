// controllers/room.js
const prisma = require("../config/prisma");
const { saveImage, deleteImageByUrl } = require("../utils/uploadImage");

const isBase64Image = (value) => typeof value === "string" && value.trim().startsWith("data:image/");

const normalizeRoomImageInput = async (imageUrl) => {
  if (typeof imageUrl === "undefined") return undefined;
  if (imageUrl === null) return null;
  if (typeof imageUrl !== "string") return null;

  const normalized = imageUrl.trim();
  if (!normalized) return null;

  if (isBase64Image(normalized)) {
    return saveImage(normalized, { scope: "room-image" });
  }

  return normalized;
};

// สร้างห้อง
exports.create = async (req, res, next) => {
  try {
    const { roomNumber, building, floor, imageUrl } = req.body;
    if (typeof imageUrl !== "undefined" && imageUrl !== null && typeof imageUrl !== "string") {
      return res.status(400).json({ message: "Invalid room image payload" });
    }

    const parsedFloor = Number.parseInt(floor, 10);
    if (!Number.isFinite(parsedFloor)) {
      return res.status(400).json({ message: "Invalid floor value" });
    }

    const normalizedImageUrl = await normalizeRoomImageInput(imageUrl);
    if (isBase64Image(imageUrl) && !normalizedImageUrl) {
      return res.status(400).json({ message: "Invalid room image data" });
    }

    const room = await prisma.room.create({
      data: {
        roomNumber,
        building,
        floor: parsedFloor,
        imageUrl: normalizedImageUrl ?? null,
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
    if (typeof imageUrl !== "undefined" && imageUrl !== null && typeof imageUrl !== "string") {
      return res.status(400).json({ message: "Invalid room image payload" });
    }

    const parsedFloor = Number.parseInt(floor, 10);
    if (!Number.isFinite(parsedFloor)) {
      return res.status(400).json({ message: "Invalid floor value" });
    }

    const roomId = Number.parseInt(id, 10);
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
      select: { imageUrl: true },
    });
    if (!existingRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    const normalizedImageUrl = await normalizeRoomImageInput(imageUrl);
    if (isBase64Image(imageUrl) && !normalizedImageUrl) {
      return res.status(400).json({ message: "Invalid room image data" });
    }

    const data = {
      roomNumber,
      building,
      floor: parsedFloor,
    };

    if (typeof normalizedImageUrl !== "undefined") {
      data.imageUrl = normalizedImageUrl;
    }

    const updated = await prisma.room.update({
      where: { id: roomId },
      data,
    });

    if (
      existingRoom.imageUrl &&
      existingRoom.imageUrl !== updated.imageUrl &&
      existingRoom.imageUrl.startsWith("/uploads/")
    ) {
      deleteImageByUrl(existingRoom.imageUrl);
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// ลบห้อง
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const roomId = Number.parseInt(id, 10);

    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
      select: { imageUrl: true },
    });
    if (!existingRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    await prisma.room.delete({
      where: { id: roomId },
    });

    if (existingRoom.imageUrl?.startsWith("/uploads/")) {
      deleteImageByUrl(existingRoom.imageUrl);
    }

    res.json({ message: "Room deleted successfully" });
  } catch (err) {
    next(err);
  }
};
