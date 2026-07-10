const express = require('express');
const router = express.Router();
const { getTransactions } = require('../controllers/adminTransactionController');
const { protect } = require('../middleware/adminAuth');

router.get('/', protect, getTransactions);

module.exports = router;
