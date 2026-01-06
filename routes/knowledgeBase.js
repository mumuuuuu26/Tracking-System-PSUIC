const express = require("express");
const router = express.Router();
const { authCheck, itCheck } = require("../middlewares/authCheck");

const {
    listKB,
    readKB,
    createKB,
    updateKB,
    removeKB,
    voteHelpful
} = require("../controllers/knowledgeBase");

// Public access (authenticated users)
router.get("/kb", authCheck, listKB);
router.get("/kb/:id", authCheck, readKB);
router.put("/kb/:id/vote", authCheck, voteHelpful);

// IT Support / Admin only
router.post("/kb", authCheck, itCheck, createKB);
router.put("/kb/:id", authCheck, itCheck, updateKB);
router.delete("/kb/:id", authCheck, itCheck, removeKB);

module.exports = router;
