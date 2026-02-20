// routes/category.js
const express = require("express");
const router = express.Router();
const { authCheck, adminCheck } = require("../middlewares/authCheck");
const { create, list, update, remove, addSubComponent, removeSubComponent } = require("../controllers/category");

// สร้างหมวดหมู่ (เฉพาะ Admin)
router.post("/category", authCheck, adminCheck, create);

// ดึงข้อมูลหมวดหมู่ (User ทุกคนเข้าถึงได้)
router.get("/category", authCheck, list);

// อัพเดทหมวดหมู่ (เฉพาะ Admin)
router.put("/category/:id", authCheck, adminCheck, update);

// ลบหมวดหมู่ (เฉพาะ Admin)
router.delete("/category/:id", authCheck, adminCheck, remove);

// [NEW] เพิ่ม SubComponent
router.post("/category/:categoryId/sub", authCheck, adminCheck, addSubComponent);

// [NEW] ลบ SubComponent
router.delete("/category/sub/:id", authCheck, adminCheck, removeSubComponent);

module.exports = router;
