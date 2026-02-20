const express = require("express");
const router = express.Router();
const { authCheck, adminCheck } = require("../middlewares/authCheck");

const {
  listUsers,
  getUserById,
  changeStatus,
  changeRole,
  updateProfileImage,
  updateProfile,
  updateUser,
  removeUser,
  createUser
} = require("../controllers/user");

// --- List all users (Admin) ---
// @ENDPOINT GET /api/users
router.get("/users", authCheck, adminCheck, listUsers);


// @ENDPOINT POST /api/users/change-status
router.post("/users/change-status", authCheck, adminCheck, changeStatus);

// @ENDPOINT POST /api/users/change-role
router.post("/users/change-role", authCheck, adminCheck, changeRole);

// @ENDPOINT POST /api/users/update-image
router.post("/users/update-image", authCheck, updateProfileImage);

// @ENDPOINT POST /api/users/update-profile
router.post("/users/update-profile", authCheck, updateProfile);

// --- Create user (Admin) ---
// @ENDPOINT POST /api/users
router.post("/users", authCheck, adminCheck, createUser);

// ─────────────────────────────────────────────────────────────────────────────
// Parameterized routes (:id) — MUST come LAST to avoid shadowing named routes
// ─────────────────────────────────────────────────────────────────────────────
// @ENDPOINT GET /api/users/:id
router.get("/users/:id", authCheck, adminCheck, getUserById);

// @ENDPOINT PUT /api/users/:id
router.put("/users/:id", authCheck, adminCheck, updateUser);

// @ENDPOINT DELETE /api/users/:id
router.delete("/users/:id", authCheck, adminCheck, removeUser);

module.exports = router;

