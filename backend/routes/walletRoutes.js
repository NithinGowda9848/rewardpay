const express = require('express');
const router = express.Router();
const { deposit, confirmDeposit, withdraw, getTransactions, getBalance } = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

router.use(protect); // protect all wallet routes

router.post('/deposit', deposit);
router.post('/deposit/confirm/:id', confirmDeposit);
router.post('/withdraw', withdraw);
router.get('/transactions', getTransactions);
router.get('/balance', getBalance);

module.exports = router;
