const express = require('express');
const router = express.Router();
const {
  getUsers,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getUserDetails
} = require('../controllers/adminUserController');
const { protect, authorize } = require('../middleware/adminAuth');

router.get('/', protect, getUsers);
router.get('/:id', protect, getUserDetails);
router.put('/:id', protect, updateUser);
router.patch('/:id/status', protect, toggleUserStatus);
router.delete('/:id', protect, authorize('Super Admin'), deleteUser);

module.exports = router;
