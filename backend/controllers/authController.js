const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const UserPackage = require('../models/UserPackage');
const Transaction = require('../models/Transaction');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Helper to generate unique referral code
const generateReferralCode = (name) => {
  const firstName = name ? name.trim().split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, '') : 'user';
  let digits = '';
  for (let i = 0; i < 3; i++) {
    digits += Math.floor(Math.random() * 10);
  }
  return (firstName || 'user').toLowerCase() + digits;
};

// Helper to find a referrer by ObjectId or by referral code string
const findReferrer = async (referrerId) => {
  if (!referrerId) return null;
  if (mongoose.Types.ObjectId.isValid(referrerId)) {
    const user = await User.findById(referrerId);
    if (user) return user;
  }
  // Fallback: treat as a referral code string
  return User.findOne({ referralCode: referrerId });
};

// Helper to dynamically collect earnings for active packages
const collectEarnings = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const activePackages = await UserPackage.find({
      userId: userId,
      expiresAt: { $gt: new Date() },
    });

    if (activePackages.length === 0) return;

    let totalEarned = 0;
    const now = new Date();
    const savePromises = [];

    for (let userPkg of activePackages) {
      const lastCollected = new Date(userPkg.lastCollectedAt);
      const diffMs = now - lastCollected;

      if (diffMs >= 60000) { // Collect every 60 seconds (1 minute) instead of every second to reduce database load
        // Calculate earnings per ms based on dailyEarnings
        const dailyRate = userPkg.dailyEarnings;
        const msPerDay = 24 * 60 * 60 * 1000;
        const earned = (diffMs * dailyRate) / msPerDay;

        if (earned > 0.0001) {
          totalEarned += earned;
          userPkg.lastCollectedAt = now;
          savePromises.push(userPkg.save());
        }
      }
    }

    if (totalEarned > 0) {
      if (savePromises.length > 0) {
        await Promise.all(savePromises);
      }
      user.walletBalance = Number((user.walletBalance + totalEarned).toFixed(4));
      user.totalEarnings = Number((user.totalEarnings + totalEarned).toFixed(4));
      user.todayEarnings = Number((user.todayEarnings + totalEarned).toFixed(4));
      await user.save();

      // Log reward transaction
      await Transaction.create({
        userId,
        amount: Number(totalEarned.toFixed(4)),
        type: 'reward',
        status: 'completed',
        description: `Simulated rewards from active plans`,
      });
    }
  } catch (err) {
    console.error('Error collecting earnings:', err.message);
  }
};



// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, mobile, password, referralCode, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both username and password' });
    }

    if (!mobile) {
      return res.status(400).json({ success: false, message: 'Please provide a mobile number' });
    }

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    // Check if user already exists
    const usernameExists = await User.findOne({ username: username.toLowerCase() });
    if (usernameExists) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'An account already exists with this email address' });
    }

    if (mobile) {
      const mobileExists = await User.findOne({ mobile });
      if (mobileExists) {
        return res.status(400).json({ success: false, message: 'An account already exists with this mobile number' });
      }
    }

    // Process referral if provided
    let referredByUser = null;
    if (referralCode) {
      referredByUser = await User.findOne({
        $or: [
          { referralCode: referralCode.trim() },
          { referralCode: referralCode.trim().toLowerCase() }
        ]
      });
      if (!referredByUser) {
        return res.status(400).json({ success: false, message: 'Invalid referral code' });
      }
    }

    // Generate unique referral code for the new user
    let uniqueReferralCode;
    let codeExists = true;
    while (codeExists) {
      uniqueReferralCode = generateReferralCode(username);
      const codeCheck = await User.findOne({ referralCode: uniqueReferralCode });
      if (!codeCheck) codeExists = false;
    }

    // Give new user sign-up bonus of ₹50.00
    const welcomeBonus = 50.0;

    // Create user
    const user = await User.create({
      username: username.toLowerCase(),
      name: username, // Set display name to username initially
      mobile: mobile,
      email: email.toLowerCase(),
      isMobileVerified: true,
      password,
      referralCode: uniqueReferralCode,
      referredBy: referredByUser ? referredByUser._id : null,
      walletBalance: welcomeBonus, // initial balance
    });

    // Create signup bonus transaction
    await Transaction.create({
      userId: user._id,
      amount: welcomeBonus,
      type: 'reward',
      status: 'completed',
      description: 'Signup welcome bonus',
    });

    // Process referral registration commission for 4 levels when members sign up (add the app)
    let currentReferrerId = referredByUser ? referredByUser._id : null;
    const commissionRates = [0.10, 0.05, 0.03, 0.02];

    for (let level = 1; level <= 4; level++) {
      if (!currentReferrerId) break;

      const referrer = await findReferrer(currentReferrerId);
      if (!referrer) break;

      const rate = commissionRates[level - 1];
      const commissionAmount = Number((welcomeBonus * rate).toFixed(2));

      if (commissionAmount > 0) {
        referrer.walletBalance = Number((referrer.walletBalance + commissionAmount).toFixed(2));
        referrer.totalEarnings = Number((referrer.totalEarnings + commissionAmount).toFixed(2));
        referrer.todayEarnings = Number((referrer.todayEarnings + commissionAmount).toFixed(2));
        await referrer.save();

        // Create transaction log for referrer
        await Transaction.create({
          userId: referrer._id,
          amount: commissionAmount,
          type: 'referral',
          status: 'completed',
          description: `Level ${level} referral signup commission from ${username}`,
        });
      }

      currentReferrerId = referrer.referredBy;
    }

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        walletBalance: user.walletBalance,
        referralCode: user.referralCode,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    // Try user login first
    const user = await User.findOne({ 
      $or: [
        { username: username.toLowerCase() },
        { mobile: username }
      ]
    }).select('+password');

    if (user && (await user.matchPassword(password))) {
      await collectEarnings(user._id);
      const updatedUser = await User.findById(user._id);
      
      console.log(`User logged in: ${updatedUser.username}`);

      return res.status(200).json({
        success: true,
        token: generateToken(updatedUser._id),
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          name: updatedUser.name,
          email: updatedUser.email,
          mobile: updatedUser.mobile,
          walletBalance: updatedUser.walletBalance,
          referralCode: updatedUser.referralCode,
          role: updatedUser.role,
        },
      });
    }

    // Try admin login
    const admin = await Admin.findOne({ username });
    if (admin && (await admin.comparePassword(password))) {
      await AuditLog.create({
        admin: admin.username,
        role: admin.role,
        action: 'Login',
        details: 'Admin logged in successfully via unified portal',
        ipAddress: req.ip
      });

      console.log(`Admin logged in: ${admin.username}`);

      return res.status(200).json({
        success: true,
        token: generateToken(admin._id),
        user: {
          id: admin._id,
          username: admin.username,
          name: admin.username,
          email: admin.email,
          avatar: admin.avatar,
          role: admin.role,
        },
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        avatar: admin.avatar,
        token: generateToken(admin._id)
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid username or password' });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Google auth login/register
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res) => {
  try {
    const { credential, referralCode } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential token is required' });
    }

    let payload;
    // Verify Google ID token
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.warn('Google validation failed, checking for sandbox simulation:', verifyErr.message);
      // For easy local development and debugging: if credential is a mock token, decode it manually
      if (credential.startsWith('mock_google_token_')) {
        const parts = credential.split('_');
        const email = parts[3] || 'mockuser@gmail.com';
        const name = parts.slice(4).join(' ') || 'Mock Google User';
        payload = {
          email,
          name,
          sub: 'mock_' + Date.now(),
        };
      } else {
        return res.status(401).json({ success: false, message: 'Invalid Google authentication token' });
      }
    }

    const { email, name } = payload;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account must share an email address' });
    }

    // Find user by email
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Register user
      // Set username based on email prefix or name
      let baseUsername = (email.split('@')[0] || name.replace(/\s+/g, '')).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!baseUsername) baseUsername = 'googleuser';

      let username = baseUsername;
      let usernameExists = true;
      let counter = 1;
      while (usernameExists) {
        const check = await User.findOne({ username });
        if (!check) {
          usernameExists = false;
        } else {
          username = `${baseUsername}${counter}`;
          counter++;
        }
      }

      // Generate unique referral code
      let uniqueReferralCode;
      let codeExists = true;
      while (codeExists) {
        uniqueReferralCode = generateReferralCode(name || username);
        const codeCheck = await User.findOne({ referralCode: uniqueReferralCode });
        if (!codeCheck) codeExists = false;
      }

      let referredByUser = null;
      if (referralCode) {
        referredByUser = await User.findOne({
          $or: [
            { referralCode: referralCode.trim() },
            { referralCode: referralCode.trim().toLowerCase() }
          ]
        });
      }

      const welcomeBonus = 50.0;

      // Create new user (password is optional for Google users)
      user = await User.create({
        username,
        name: name || username,
        email: email.toLowerCase(),
        referralCode: uniqueReferralCode,
        referredBy: referredByUser ? referredByUser._id : null,
        walletBalance: welcomeBonus,
      });

      // Log signup bonus
      await Transaction.create({
        userId: user._id,
        amount: welcomeBonus,
        type: 'reward',
        status: 'completed',
        description: 'Signup welcome bonus via Google',
      });

      // Process referral registration commission for 4 levels
      let currentReferrerId = referredByUser ? referredByUser._id : null;
      const commissionRates = [0.10, 0.05, 0.03, 0.02];
      for (let level = 1; level <= 4; level++) {
        if (!currentReferrerId) break;
        const referrer = await findReferrer(currentReferrerId);
        if (!referrer) break;
        const rate = commissionRates[level - 1];
        const commissionAmount = Number((welcomeBonus * rate).toFixed(2));
        if (commissionAmount > 0) {
          referrer.walletBalance = Number((referrer.walletBalance + commissionAmount).toFixed(2));
          referrer.totalEarnings = Number((referrer.totalEarnings + commissionAmount).toFixed(2));
          referrer.todayEarnings = Number((referrer.todayEarnings + commissionAmount).toFixed(2));
          await referrer.save();
          await Transaction.create({
            userId: referrer._id,
            amount: commissionAmount,
            type: 'referral',
            status: 'completed',
            description: `Level ${level} referral signup commission from Google user ${username}`,
          });
        }
        currentReferrerId = referrer.referredBy;
      }
    } else {
      // If user exists, collect dynamic earnings
      await collectEarnings(user._id);
      user = await User.findById(user._id);
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        walletBalance: user.walletBalance,
        referralCode: user.referralCode,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get user profile session
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // Collect earnings first, to ensure they get latest data on page load/poll
    await collectEarnings(req.user._id);

    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('getMe Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset password (forgot password)
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { username, newPassword } = req.body;

    const user = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { mobile: username }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this username or mobile number' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful! Please login with your new password.'
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export helper for other controllers
exports.collectEarnings = collectEarnings;

exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password');
    if (admin) {
      res.json(admin);
    } else {
      res.status(404).json({ message: 'Admin not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAdminProfile = async (req, res) => {
  const { username, email, avatar } = req.body;

  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    admin.username = username || admin.username;
    admin.email = email || admin.email;
    admin.avatar = avatar || admin.avatar;

    const updatedAdmin = await admin.save();

    await AuditLog.create({
      admin: admin.username,
      role: admin.role,
      action: 'Update Profile',
      details: 'Admin profile details updated',
      ipAddress: req.ip
    });

    res.json({
      _id: updatedAdmin._id,
      username: updatedAdmin.username,
      email: updatedAdmin.email,
      role: updatedAdmin.role,
      avatar: updatedAdmin.avatar
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAdminPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Please specify current and new password' });
  }

  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    admin.password = newPassword;
    await admin.save();

    await AuditLog.create({
      admin: admin.username,
      role: admin.role,
      action: 'Change Password',
      details: 'Admin updated password securely',
      ipAddress: req.ip
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
