const express = require("express");
const router = express.Router();
const { list, create, update, remove, read } = require("../controllers/quickFix");
const { authCheck, adminCheck, itCheck } = require("../middlewares/authCheck");

// Public (or authenticated User)
router.get("/quick-fix", list);
router.get("/quick-fix/:id", read);

// Admin / IT only
router.post("/quick-fix", authCheck, adminCheck, create);
router.put("/quick-fix/:id", authCheck, adminCheck, update);
router.delete("/quick-fix/:id", authCheck, adminCheck, remove);

module.exports = router;
