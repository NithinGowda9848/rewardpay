const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (exclude password)
      req.user = await User.findById(decoded.id);
      
      if (!req.user) {
        // Fallback: Check if it's an Admin
        const Admin = require('../models/Admin');
        const adminUser = await Admin.findById(decoded.id).select('-password');
        if (adminUser) {
          req.user = {
            _id: adminUser._id,
            id: adminUser._id,
            username: adminUser.username,
            email: adminUser.email,
            role: 'admin'
          };
        }
      }
      
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('Auth Error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

const admin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || process.env.NODE_ENV === 'development')) {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Not authorized, admin access required' });
  }
};

module.exports = { protect, admin };
