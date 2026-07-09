const express = require('express');
const router = express.Router();
const { getDashboardStats, getSystemLogs } = require('../controllers/adminDashboardController');
const { protect } = require('../middleware/adminAuth');

router.get('/', protect, getDashboardStats);
router.get('/stats', protect, getDashboardStats);
router.get('/logs', protect, getSystemLogs);

module.exports = router;
