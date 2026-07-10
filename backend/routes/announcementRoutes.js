const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/adminAuth');

router.get('/', protect, getAnnouncements);
router.post('/', protect, authorize('Super Admin', 'Manager'), createAnnouncement);
router.put('/:id', protect, authorize('Super Admin', 'Manager'), updateAnnouncement);
router.delete('/:id', protect, authorize('Super Admin'), deleteAnnouncement);

module.exports = router;
