// routes/room.js
const express = require("express");
const router = express.Router();
const { authCheck, adminCheck } = require("../middlewares/authCheck");
const { create, list, update, remove } = require("../controllers/room");

router.post("/room", authCheck, adminCheck, create);
router.get("/room", authCheck, list);
router.put("/room/:id", authCheck, adminCheck, update);
router.delete("/room/:id", authCheck, adminCheck, remove);

module.exports = router;
