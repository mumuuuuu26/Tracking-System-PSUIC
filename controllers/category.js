// controllers/category.js
const prisma = require("../config/prisma");

// สร้างหมวดหมู่ (เผื่อไว้ใช้ในอนาคต หรือให้ Admin ใช้)
exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    const category = await prisma.category.create({
      data: { name },
    });
    res.json(category);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// ดึงรายการหมวดหมู่ทั้งหมด
exports.list = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" }, // เรียงตามตัวอักษร
    });
    res.json(categories);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
