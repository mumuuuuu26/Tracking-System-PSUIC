const express = require("express");
const router = express.Router();
const { authCheck, itCheck } = require("../middlewares/authCheck");
const { createAppointment, getAvailableSlots } = require("../controllers/appointment");

// @ENDPOINT http://localhost:5001/api/appointment/create
router.post("/appointment/create", authCheck, createAppointment);

// @ENDPOINT http://localhost:5001/api/appointment/slots
// Public or User accessible to see when IT is busy
router.get("/appointment/slots", authCheck, getAvailableSlots);

module.exports = router;
