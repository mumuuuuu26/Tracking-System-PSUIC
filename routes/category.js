const express = require("express");
const router = express.Router();
const { create, list, remove, update } = require("../controllers/category");
const { authCheck, adminCheck } = require("../middlewares/authCheck");

//ENDPOINT http://localhost:5001/api/category
router.post("/category", authCheck, adminCheck, create);
router.get("/category", authCheck, adminCheck, list);
router.delete("/category/:id", authCheck, adminCheck, remove);
router.put("/category/:id", authCheck, adminCheck, update);

module.exports = router;
