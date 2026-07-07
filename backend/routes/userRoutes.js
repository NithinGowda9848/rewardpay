const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getAnnouncements, getNotifications, markNotificationRead } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect); // protect all user routes

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/announcements', getAnnouncements);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

module.exports = router;
