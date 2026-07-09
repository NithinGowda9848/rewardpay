const express = require('express');
const router = express.Router();
const { getWithdrawals, approveWithdrawal, rejectWithdrawal, getDbStatus } = require('../controllers/adminWithdrawalController');
const { protect, authorize } = require('../middleware/adminAuth');

router.get('/db-status', protect, getDbStatus);
router.get('/', protect, getWithdrawals);

router.route('/:id/approve')
  .post(protect, authorize('Super Admin', 'Manager'), approveWithdrawal)
  .patch(protect, authorize('Super Admin', 'Manager'), approveWithdrawal);

router.route('/:id/reject')
  .post(protect, authorize('Super Admin', 'Manager'), rejectWithdrawal)
  .patch(protect, authorize('Super Admin', 'Manager'), rejectWithdrawal);

module.exports = router;
