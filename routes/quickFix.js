const express = require("express");
const router = express.Router();
const { list, create, update, remove } = require("../controllers/quickFix");
const { authCheck, itCheck } = require("../middlewares/authCheck");

// Public (User can view)
router.get("/quick-fix", authCheck, list);

// IT Support only
router.post("/quick-fix", authCheck, itCheck, create);
router.put("/quick-fix/:id", authCheck, itCheck, update);
router.delete("/quick-fix/:id", authCheck, itCheck, remove);

module.exports = router;
