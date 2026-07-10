const express = require('express');
const router = express.Router();
const {
  getNotifications,
  createNotification,
  markAllRead,
  markOneRead,
  deleteNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/adminAuth');

router.get('/', protect, getNotifications);
router.post('/', protect, createNotification);
router.patch('/mark-read', protect, markAllRead);
router.patch('/:id/read', protect, markOneRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
