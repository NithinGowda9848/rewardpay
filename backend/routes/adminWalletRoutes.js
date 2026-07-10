const express = require('express');
const router = express.Router();
const { getWallets, adjustUserWallet } = require('../controllers/adminWalletController');
const { protect, authorize } = require('../middleware/adminAuth');

router.get('/', protect, getWallets);
router.post('/:id/adjust', protect, authorize('Super Admin', 'Manager'), adjustUserWallet);

module.exports = router;
