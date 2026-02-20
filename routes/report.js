const express = require("express");
const router = express.Router();
const { authCheck, adminCheck } = require("../middlewares/authCheck");

const {
    getMonthlyStats,
    getAnnualStats,
    getEquipmentStats,
    getITPerformance,
    getRoomStats
} = require("../controllers/report");

// @ENDPOINT http://localhost:5002/api/reports/monthly
router.get("/reports/monthly", authCheck, adminCheck, getMonthlyStats);

// @ENDPOINT http://localhost:5002/api/reports/annual
router.get("/reports/annual", authCheck, adminCheck, getAnnualStats);

// @ENDPOINT http://localhost:5002/api/reports/equipment
router.get("/reports/equipment", authCheck, adminCheck, getEquipmentStats);

// @ENDPOINT http://localhost:5002/api/reports/performance
router.get("/reports/performance", authCheck, adminCheck, getITPerformance);



// @ENDPOINT http://localhost:5002/api/reports/room
router.get("/reports/room", authCheck, adminCheck, getRoomStats);

module.exports = router;
