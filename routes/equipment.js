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
  update,
  remove,
  bulkRemove,
} = require("../controllers/equipment");

// Admin only
router.post("/equipment", authCheck, adminCheck, create);
router.get("/equipment", authCheck, list);

// [BUG FIX] Named routes MUST come before parameterized (:id) routes to prevent shadowing.
// /equipment/qr/:qrCode must be declared before /equipment/:id and /equipment/:id/qr
router.get("/equipment/qr/:qrCode", getByQRCode); // Public QR lookup for printed equipment labels
router.get("/equipment/:id/qr", authCheck, generateQR);
router.delete("/equipment/bulk-delete", authCheck, adminCheck, bulkRemove);
router.get("/equipment/:id", authCheck, getById);
router.put("/equipment/:id", authCheck, adminCheck, update);
router.delete("/equipment/:id", authCheck, adminCheck, remove);

module.exports = router;
