const express = require("express");
const router = express.Router();
const { authCheck, itCheck } = require("../middlewares/authCheck");
const { createAppointment, getAvailableSlots, requestReschedule, respondReschedule, getITAvailability } = require("../controllers/appointment");

// @ENDPOINT http://localhost:5001/api/appointment/create
router.post("/appointment/create", authCheck, createAppointment);

// Reschedule Routes
router.post('/reschedule-request', authCheck, requestReschedule);
router.post('/reschedule-respond', authCheck, respondReschedule);

// @ENDPOINT http://localhost:5001/api/appointment/slots
// Public or User accessible to see when IT is busy
router.get("/appointment/slots", authCheck, getAvailableSlots);

// @ENDPOINT http://localhost:5001/api/appointment/availability
router.get("/appointment/availability", authCheck, getITAvailability); // Used destructured getITAvailability

module.exports = router;
