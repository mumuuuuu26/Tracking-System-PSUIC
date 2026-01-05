const express = require("express");
const router = express.Router();
const { list, markRead, remove } = require("../controllers/notification");
const { authCheck } = require("../middlewares/authCheck");

// @ENDPOINT http://localhost:5001/api/notifications
router.get("/notifications", authCheck, list);
router.put("/notification/:id/read", authCheck, markRead);
router.delete("/notification/:id", authCheck, remove);

module.exports = router;
