const express = require("express");
const router = express.Router();
const { authCheck, adminCheck } = require("../middlewares/authCheck");

const { listUsers, changeStatus, changeRole } = require("../controllers/user");

// @ENDPOINT http://localhost:5001/api/users
router.get("/users", authCheck, adminCheck, listUsers);

// @ENDPOINT http://localhost:5001/api/users/change-status
router.post("/users/change-status", authCheck, adminCheck, changeStatus);

// @ENDPOINT http://localhost:5001/api/users/change-role
router.post("/users/change-role", authCheck, adminCheck, changeRole);

module.exports = router;
