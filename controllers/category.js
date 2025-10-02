const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");

exports.create = async (req, res) => {
  try {
    const { name, customerType } = req.body;
    if (!name) return res.status(400).json({ message: "ชื่อหมวดหมู่ห้ามว่าง" });

    const cat = await prisma.category.create({
      data: {
        name,
        customerType: customerType || "retail",
      },
    });

    res.json(cat);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.list = async (req, res) => {
  try {
    const rows = await prisma.category.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, customerType } = req.body;
    const cat = await prisma.category.update({
      where: { id: Number(id) },
      data: { name, customerType: customerType || "retail" },
    });
    res.json(cat);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const cat = await prisma.category.delete({ where: { id: Number(id) } });
    res.json(cat);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};
