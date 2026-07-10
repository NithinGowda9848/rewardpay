const express = require('express');
const router = express.Router();
const {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
  duplicatePackage,
  bulkDeletePackages
} = require('../controllers/packageController');
const { protect, authorize } = require('../middleware/adminAuth');

router.get('/', protect, getPackages);
router.post('/', protect, authorize('Super Admin', 'Manager'), createPackage);
router.post('/bulk-delete', protect, authorize('Super Admin'), bulkDeletePackages);
router.post('/:id/duplicate', protect, authorize('Super Admin', 'Manager'), duplicatePackage);
router.put('/:id', protect, authorize('Super Admin', 'Manager'), updatePackage);
router.delete('/:id', protect, authorize('Super Admin'), deletePackage);

module.exports = router;
