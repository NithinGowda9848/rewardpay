const express = require('express');
const router = express.Router();
const { getDeposits, approveDeposit, rejectDeposit } = require('../controllers/adminDepositController');
const { protect, authorize } = require('../middleware/adminAuth');

router.get('/', protect, getDeposits);
router.route('/:id/approve')
  .post(protect, authorize('Super Admin', 'Manager'), approveDeposit)
  .patch(protect, authorize('Super Admin', 'Manager'), approveDeposit);

router.route('/:id/reject')
  .post(protect, authorize('Super Admin', 'Manager'), rejectDeposit)
  .patch(protect, authorize('Super Admin', 'Manager'), rejectDeposit);

module.exports = router;
