const express = require("express");
const router = express.Router();
const { authCheck } = require("../middlewares/authCheck");
const {
    createTask,
    getTasks,
    updateTask,
    deleteTask,
} = require("../controllers/personalTask");

// Apply auth middleware to all routes
router.post("/personal-task", authCheck, createTask);
router.get("/personal-task", authCheck, getTasks);
router.put("/personal-task/:id", authCheck, updateTask);
router.delete("/personal-task/:id", authCheck, deleteTask);

module.exports = router;
