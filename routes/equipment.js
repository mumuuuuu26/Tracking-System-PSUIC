// routes/equipment.js
const express = require("express");
const router = express.Router();
const { authCheck, adminCheck } = require("../middlewares/authCheck");
const {
  create,
  list,
  getByQRCode,
  getById,
  generateQR,
} = require("../controllers/equipment");

// Admin only
router.post("/equipment", authCheck, adminCheck, create);
router.get("/equipment", authCheck, list);
router.get("/equipment/:id/qr", authCheck, generateQR);

// Public (for QR scanning)
router.get("/equipment/qr/:qrCode", getByQRCode);
router.get("/equipment/:id", authCheck, getById);

module.exports = router;
