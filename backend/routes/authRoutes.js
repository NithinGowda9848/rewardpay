const express = require('express');
const router = express.Router();
const { register, login, googleAuth, getMe, resetPassword, getAdminProfile, updateAdminProfile, updateAdminPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { protect: protectAdmin } = require('../middleware/adminAuth');
const { check } = require('express-validator');
const { validate } = require('../middleware/validate');

router.post('/register', [
  check('username', 'Username is required, min 4 max 20 chars').isLength({ min: 4, max: 20 }).isAlphanumeric(),
  check('mobile', 'Valid mobile number is required').isLength({ min: 10, max: 10 }).isNumeric(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 8 or more characters, including uppercase, lowercase, number, and special character')
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
], validate, register);

router.post('/login', [
  check('username', 'Username or mobile is required').notEmpty(),
  check('password', 'Password is required').exists()
], validate, login);

router.post('/reset-password', [
  check('username', 'Username or mobile number is required').notEmpty(),
  check('newPassword', 'Please enter a password with 8 or more characters, including uppercase, lowercase, number, and special character')
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
], validate, resetPassword);

router.post('/google', googleAuth);
router.get('/me', protect, getMe);

// Admin Profile routes
router.get('/profile', protectAdmin, getAdminProfile);
router.put('/profile', protectAdmin, updateAdminProfile);
router.put('/change-password', protectAdmin, updateAdminPassword);

module.exports = router;
