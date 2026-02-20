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

// ดึงรายการหมวดหมู่ทั้งหมดพร้อม SubComponent
exports.list = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: { subComponents: true },
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

// [NEW] เพิ่ม SubComponent ให้ Category
exports.addSubComponent = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { name } = req.body;
    
    if (!name) return res.status(400).json({ message: "SubComponent name is required" });

    const subComponent = await prisma.subComponent.create({
      data: {
        name,
        categoryId: parseInt(categoryId),
      },
    });
    res.json(subComponent);
  } catch (err) {
    next(err);
  }
};

// [NEW] ลบ SubComponent
exports.removeSubComponent = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.subComponent.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: "SubComponent deleted successfully" });
  } catch (err) {
    next(err);
  }
};
