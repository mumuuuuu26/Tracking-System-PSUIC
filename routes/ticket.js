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
  history
} = require("../controllers/ticket");

// @ENDPOINT http://localhost:5002/api/ticket

//สร้างใบแจ้งซ่อม
router.post("/ticket", authCheck, create);

//ดูประวัติแจ้งซ่อมของตัวเอง
router.get("/ticket", authCheck, list);

//ดูใบแจ้งซ่อม "ทั้งหมด" (Admin + IT Support)
router.get("/ticket/all", authCheck, itCheck, listAll);

// ดูประวัติแจ้งซ่อม (History) พร้อม Filter Category
router.get("/ticket/history", authCheck, history);

// [BUG FIX] ดูประวัติซ่อมของอุปกรณ์ — ต้องอยู่ก่อน /ticket/:id เสมอ
// มิฉะนั้น Express จะตีความ "equipment" เป็น :id แล้วผ่านค่า NaN ไปยัง DB
router.get("/ticket/equipment/:id", authCheck, listByEquipment);

//ดูรายละเอียด Ticket ตาม ID
router.get("/ticket/:id", authCheck, read);

//อัปเดตสถานะ Ticket (admin + it_support)
router.put("/ticket/:id", authCheck, itCheck, update);

//ลบ Ticket
router.delete("/ticket/:id", authCheck, adminCheck, remove);



module.exports = router;
