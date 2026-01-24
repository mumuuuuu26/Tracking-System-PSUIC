const express = require("express");
const router = express.Router();
const { authCheck, adminCheck } = require("../middlewares/authCheck");
const { getPermissions, updatePermissions, resetPermissions } = require("../controllers/permission");

// @ENDPOINT /api/admin/permission/:role
router.get("/permission/:role", authCheck, adminCheck, getPermissions);
router.put("/permission/:role", authCheck, adminCheck, updatePermissions);
router.post("/permission/:role/reset", authCheck, adminCheck, resetPermissions);

module.exports = router;
