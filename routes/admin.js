//import....
const express = require('express')
const { authCheck, adminCheck } = require('../middlewares/authCheck')
const router = express.Router()

//import controller
const { getDashboardStats, getITStaff, getITStaffStats } = require('../controllers/admin')

// @ENDPOINT http://localhost:5001/api/admin/stats
router.get('/admin/stats', authCheck, adminCheck, getDashboardStats)

// @ENDPOINT http://localhost:5001/api/admin/it-staff
router.get('/admin/it-staff', authCheck, adminCheck, getITStaff)
router.get('/admin/it-staff/stats', authCheck, adminCheck, getITStaffStats)

module.exports = router