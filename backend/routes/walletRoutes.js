const express = require('express');
const router = express.Router();
const { 
  deposit, 
  confirmDeposit, 
  withdraw, 
  getTransactions, 
  getBalance,
  getAllPendingDeposits,
  adminConfirmDeposit,
  adminRejectDeposit,
  adminConfirmWithdrawal,
  adminRejectWithdrawal,
  adminGetAllPending
} = require('../controllers/walletController');
const { protect, admin } = require('../middleware/auth');

router.use(protect); // protect all wallet routes

router.post('/deposit', deposit);
router.post('/deposit/confirm/:id', confirmDeposit);
router.post('/withdraw', withdraw);
router.get('/transactions', getTransactions);
router.get('/balance', getBalance);

// Admin routes
router.get('/admin/pending', admin, adminGetAllPending);
router.get('/admin/pending-deposits', admin, getAllPendingDeposits);
router.post('/admin/confirm-deposit/:id', admin, adminConfirmDeposit);
router.post('/admin/reject-deposit/:id', admin, adminRejectDeposit);
router.post('/admin/confirm-withdrawal/:id', admin, adminConfirmWithdrawal);
router.post('/admin/reject-withdrawal/:id', admin, adminRejectWithdrawal);

module.exports = router;
