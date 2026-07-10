const express = require('express');
const router = express.Router();
const {
  getVips,
  createVip,
  updateVip,
  deleteVip
} = require('../controllers/vipController');
const { protect, authorize } = require('../middleware/adminAuth');

router.get('/', protect, getVips);
router.post('/', protect, authorize('Super Admin', 'Manager'), createVip);
router.put('/:id', protect, authorize('Super Admin', 'Manager'), updateVip);
router.delete('/:id', protect, authorize('Super Admin'), deleteVip);

module.exports = router;
