const express = require('express');
const router = express.Router();
const { 
  deposit, 
  confirmDeposit, 
  withdraw, 
  getTransactions, 
  getBalance,
  getAllPendingDeposits,
  adminConfirmDeposit
} = require('../controllers/walletController');
const { protect, admin } = require('../middleware/auth');

router.use(protect); // protect all wallet routes

router.post('/deposit', deposit);
router.post('/deposit/confirm/:id', confirmDeposit);
router.post('/withdraw', withdraw);
router.get('/transactions', getTransactions);
router.get('/balance', getBalance);

// Admin routes
router.get('/admin/pending-deposits', admin, getAllPendingDeposits);
router.post('/admin/confirm-deposit/:id', admin, adminConfirmDeposit);

module.exports = router;
