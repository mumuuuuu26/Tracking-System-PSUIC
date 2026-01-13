const express = require("express");
const router = express.Router();
const { authCheck, adminCheck, itCheck } = require("../middlewares/authCheck");

const {
  getStats,
  getMyTasks,
  getTodayAppointments,
  acceptJob,
  rejectTicket,
  closeJob,
  saveDraft,
  rescheduleAppointment,
  getSchedule,
  getHistory,
} = require("../controllers/it-support");

// Dashboard data
router.get("/it/stats", authCheck, itCheck, getStats);
router.get("/it/tasks", authCheck, itCheck, getMyTasks);
router.get("/it/schedule", authCheck, itCheck, getSchedule);
router.get("/it/history", authCheck, itCheck, getHistory);
router.get("/it/appointments/today", authCheck, itCheck, getTodayAppointments);

// Actions
router.put("/it/accept/:id", authCheck, itCheck, acceptJob);
router.put("/it/reject/:id", authCheck, itCheck, rejectTicket);
router.put("/it/close/:id", authCheck, itCheck, closeJob);
router.put("/it/draft/:id", authCheck, itCheck, saveDraft); // [NEW] Draft mode
router.post("/it/reschedule", authCheck, itCheck, rescheduleAppointment);

module.exports = router;
