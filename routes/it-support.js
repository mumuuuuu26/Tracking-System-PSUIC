const express = require("express");
const router = express.Router();
const { authCheck, adminCheck, itCheck } = require("../middlewares/authCheck");

const {
  getStats,
  getMyTasks,
  acceptJob,

  closeJob,
  saveDraft,

  getHistory,
  getPublicSchedule, // [NEW]
  previewJob,
  rejectJob,
  syncGoogleCalendar, // [NEW]
  testGoogleSync // [NEW] DIAGNOSTIC
} = require("../controllers/it-support");

// Dashboard data
router.get("/it/job/:id/preview", authCheck, itCheck, previewJob);
router.get("/it/stats", authCheck, itCheck, getStats);
router.get("/it/tasks", authCheck, itCheck, getMyTasks);
router.get("/it/history", authCheck, itCheck, getHistory);
router.get("/it/public-schedule", authCheck, getPublicSchedule); // [NEW] Public for Auth Users
router.post("/it/google-sync", authCheck, itCheck, syncGoogleCalendar); // [NEW]
router.get("/it/test-google-sync", authCheck, testGoogleSync); // [NEW] DIAGNOSTIC

// Actions
router.put("/it/accept/:id", authCheck, itCheck, acceptJob);
router.put("/it/reject/:id", authCheck, itCheck, rejectJob);

router.put("/it/close/:id", authCheck, itCheck, closeJob);
router.put("/it/draft/:id", authCheck, itCheck, saveDraft); // [NEW] Draft mode


module.exports = router;
