//import....
const express = require('express')
const { authCheck, adminCheck } = require('../middlewares/authCheck')
const router = express.Router()

//import controller
const { getDashboardStats } = require('../controllers/admin')

// @ENDPOINT http://localhost:5002/api/admin/stats
router.get('/admin/stats', authCheck, adminCheck, getDashboardStats)

// Routes removed

module.exports = router