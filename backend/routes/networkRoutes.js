const express = require('express');
const router = express.Router();
const { getNetworkStats, getNetworkTree } = require('../controllers/networkController');
const { protect } = require('../middleware/adminAuth');

router.get('/stats', protect, getNetworkStats);
router.get('/tree/:userId', protect, getNetworkTree);

module.exports = router;
