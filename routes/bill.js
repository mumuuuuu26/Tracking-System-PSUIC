const express = require("express");
const router = express.Router();
const { authCheck, adminCheck } = require("../middlewares/authCheck");
const {
  createBill,
  listBills,
  getBill,
  searchByPlate,
  updateBill, 
  deleteBill, 
} = require("../controllers/bill");

router.post("/bill", authCheck, adminCheck, createBill);
router.get("/bills", authCheck, adminCheck, listBills);
router.get("/bill/:id", authCheck, adminCheck, getBill);
router.get("/bills/search", authCheck, adminCheck, searchByPlate);
router.put("/bill/:id", authCheck, adminCheck, updateBill); // เพิ่ม
router.delete("/bill/:id", authCheck, adminCheck, deleteBill); // เพิ่ม

module.exports = router;
