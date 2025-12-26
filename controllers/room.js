// controllers/room.js
const prisma = require("../config/prisma");

// สร้างห้อง
exports.create = async (req, res) => {
  try {
    const { roomNumber, building, floor } = req.body;

    const room = await prisma.room.create({
      data: {
        roomNumber,
        building,
        floor: parseInt(floor),
      },
    });

    res.json(room);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// ดูรายการห้องทั้งหมด
exports.list = async (req, res) => {
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
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
