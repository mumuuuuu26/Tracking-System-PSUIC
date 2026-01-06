const express = require("express");
const router = express.Router();

// นำเข้า Middleware
const { authCheck, adminCheck, itCheck } = require("../middlewares/authCheck");

const {
  create,
  list,
  read,
  update,
  remove,
  listAll,
  listByEquipment,
  submitFeedback,
} = require("../controllers/ticket");

// @ENDPOINT http://localhost:5001/api/ticket

//สร้างใบแจ้งซ่อม
router.post("/ticket", authCheck, create);

//ดูประวัติแจ้งซ่อมของตัวเอง
router.get("/ticket", authCheck, list);

//ดูใบแจ้งซ่อม "ทั้งหมด" (Admin + IT Support)
router.get("/ticket/all", authCheck, itCheck, listAll);

//ดูรายละเอียด Ticket ตาม ID
router.get("/ticket/:id", authCheck, read);

//อัปเดตสถานะ Ticket
router.put("/ticket/:id", authCheck, adminCheck, update);

//ลบ Ticket
router.delete("/ticket/:id", authCheck, adminCheck, remove);

//ดูประวัติซ่อมของอุปกรณ์ (สำหรับ User/Scan QR)
router.get("/ticket/equipment/:id", authCheck, listByEquipment);

//ให้คะแนนความพึงพอใจ
router.post("/ticket/:id/feedback", authCheck, submitFeedback);

module.exports = router;
