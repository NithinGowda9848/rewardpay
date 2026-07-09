const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/adminSettingsController');
const { protect, authorize } = require('../middleware/adminAuth');

router.get('/', protect, getSettings);
router.put('/', protect, authorize('Super Admin'), updateSettings);

module.exports = router;
