const express = require('express');
const router = express.Router();
const { getTeamStats, getTeamMembers } = require('../controllers/teamController');
const { protect } = require('../middleware/auth');

router.use(protect); // protect all team routes

router.get('/stats', getTeamStats);
router.get('/members', getTeamMembers);

module.exports = router;
