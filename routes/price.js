const express = require("express");
const { authCheck, adminCheck } = require("../middlewares/authCheck");
const {
  getToday,
  getRange,
  refreshFromSource,
  upsertManual,
} = require("../controllers/price");

const router = express.Router();

// public
router.get("/palm-prices/today", getToday);
router.get("/palm-prices", getRange);

// admin only
router.post("/palm-prices/refresh", authCheck, adminCheck, refreshFromSource);
router.post("/palm-prices", authCheck, adminCheck, upsertManual);

module.exports = router;
