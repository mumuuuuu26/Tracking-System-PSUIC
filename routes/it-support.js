const express = require("express");
const router = express.Router();
const { authCheck, itCheck } = require("../middlewares/authCheck"); // เดี๋ยวเราต้องไปเพิ่ม itCheck กันครับ

// Import Controller
const {
  getMyTasks,
  acceptJob,
  closeJob,
} = require("../controllers/it-support");

// @ENDPOINT http://localhost:5001/api/it

//ดูงานที่ได้รับมอบหมาย (My Tasks)
router.get("/it/tasks", authCheck, getMyTasks);

//กดรับงาน (เปลี่ยนสถานะเป็น In Progress)
router.put("/it/accept/:id", authCheck, acceptJob);

//ปิดงาน (เปลี่ยนสถานะเป็น Fixed + อัปรูปหลังซ่อม)
router.put("/it/close/:id", authCheck, closeJob);

module.exports = router;
