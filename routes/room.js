// routes/room.js
const express = require("express");
const router = express.Router();
const { authCheck, adminCheck } = require("../middlewares/authCheck");
const { create, list } = require("../controllers/room");

router.post("/room", authCheck, adminCheck, create);
router.get("/room", authCheck, list);

module.exports = router;
