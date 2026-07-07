const express = require('express');
const router = express.Router();
const { getPackages, buyPackage, getActiveInvestments } = require('../controllers/purchaseController');
const { protect } = require('../middleware/auth');

router.use(protect); // protect all purchase routes

router.get('/packages', getPackages);
router.post('/buy', buyPackage);
router.get('/active', getActiveInvestments);

module.exports = router;
