// controllers/category.js
const prisma = require("../config/prisma");
const { logger } = require("../utils/logger");

// สร้างหมวดหมู่ (เผื่อไว้ใช้ในอนาคต หรือให้ Admin ใช้)
exports.create = async (req, res, next) => {
  try {
    const { name } = req.body;
    const category = await prisma.category.create({
      data: { name },
    });
    res.json(category);
  } catch (err) {
    next(err);
  }
};

// ดึงรายการหมวดหมู่ทั้งหมด
exports.list = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" }, // เรียงตามตัวอักษร
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

// อัพเดทหมวดหมู่
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updated = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { name },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// ลบหมวดหมู่
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    next(err);
  }
};
