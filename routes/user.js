const express = require("express");
const router = express.Router();
const { authCheck, adminCheck } = require("../middlewares/authCheck");

const { listUsers, changeStatus, changeRole, updateProfileImage, updateProfile, updateUser, removeUser, listITStaff, createUser } = require("../controllers/user");


// @ENDPOINT http://localhost:5001/api/users
router.get("/users", authCheck, adminCheck, listUsers);
router.get("/users/it-staff", authCheck, listITStaff);

// @ENDPOINT http://localhost:5001/api/users/change-status
router.post("/users/change-status", authCheck, adminCheck, changeStatus);

// @ENDPOINT http://localhost:5001/api/users/change-role
router.post("/users/change-role", authCheck, adminCheck, changeRole);

// @ENDPOINT http://localhost:5001/api/users/update-image
router.post("/users/update-image", authCheck, updateProfileImage);

// @ENDPOINT http://localhost:5001/api/users/update-profile
router.post("/users/update-profile", authCheck, updateProfile);


// @ENDPOINT http://localhost:5001/api/users/:id
router.post("/users", authCheck, adminCheck, createUser); // [NEW] Invite/Create User
router.put("/users/:id", authCheck, adminCheck, updateUser);
router.delete("/users/:id", authCheck, adminCheck, removeUser);

module.exports = router;
