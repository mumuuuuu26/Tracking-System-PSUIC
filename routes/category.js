// routes/category.js
const express = require("express");
const router = express.Router();
const { authCheck, adminCheck } = require("../middlewares/authCheck");
const { create, list } = require("../controllers/category");

// สร้างหมวดหมู่ (เฉพาะ Admin)
router.post("/category", authCheck, adminCheck, create);

// ดึงข้อมูลหมวดหมู่ (User ทุกคนเข้าถึงได้)
router.get("/category", authCheck, list);

module.exports = router;
