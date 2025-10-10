//inport ...
const express = require("express");
const router = express.Router();
//import controller
const { authCheck, adminCheck } = require("../middlewares/authCheck");
const {

  searchMyBills,
} = require("../controllers/user");

router.get("/users", authCheck, adminCheck,);

router.get("/user/my-bills", authCheck, searchMyBills);

module.exports = router;
