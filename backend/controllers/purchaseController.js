const mongoose = require('mongoose');
const User = require('../models/User');
const Package = require('../models/Package');
const UserPackage = require('../models/UserPackage');
const Transaction = require('../models/Transaction');
const { collectEarnings } = require('./authController');

// Helper to find a referrer by ObjectId or by referral code string
const findReferrer = async (referrerId) => {
  if (!referrerId) return null;
  if (mongoose.Types.ObjectId.isValid(referrerId)) {
    const user = await User.findById(referrerId);
    if (user) return user;
  }
  return User.findOne({ referralCode: referrerId });
};

// @desc    Get list of available packages
// @route   GET /api/purchase/packages
// @access  Private
exports.getPackages = async (req, res) => {
  try {
    const packages = await Package.find({});
    res.status(200).json({
      success: true,
      data: packages,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Buy an investment package
// @route   POST /api/purchase/buy
// @access  Private
exports.buyPackage = async (req, res) => {
  try {
    const { packageId } = req.body;

    if (!packageId) {
      return res.status(400).json({ success: false, message: 'Please provide a package ID' });
    }

    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    // Refresh earnings first to get precise balance
    await collectEarnings(req.user._id);
    const user = await User.findById(req.user._id);

    if (user.walletBalance < pkg.price) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance. Please deposit funds.' });
    }

    // Deduct price from buyer
    user.walletBalance = Number((user.walletBalance - pkg.price).toFixed(2));
    await user.save();

    // Create user active package record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + pkg.validityDays);

    const userPkg = await UserPackage.create({
      userId: user._id,
      packageId: pkg._id,
      name: pkg.name,
      price: pkg.price,
      dailyEarnings: pkg.dailyEarnings,
      validityDays: pkg.validityDays,
      expiresAt,
      lastCollectedAt: new Date(),
    });

    // Create purchase transaction log
    const purchaseTx = await Transaction.create({
      userId: user._id,
      amount: pkg.price,
      type: 'purchase',
      status: 'completed',
      description: `Purchased Package: ${pkg.name}`,
    });

    // Process referral commission (Level 1: 10%, Level 2: 5%, Level 3: 3%, Level 4: 2%)
    const commissionRates = [0.10, 0.05, 0.03, 0.02];
    let currentReferrerId = user.referredBy;

    for (let level = 1; level <= 4; level++) {
      if (!currentReferrerId) break;

      const referrer = await findReferrer(currentReferrerId);
      if (!referrer) break;

      const rate = commissionRates[level - 1];
      const commissionAmount = Number((pkg.price * rate).toFixed(2));

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
          description: `Level ${level} referral commission from ${user.name}'s purchase of ${pkg.name}`,
        });
      }

      currentReferrerId = referrer.referredBy;
    }

    res.status(201).json({
      success: true,
      message: `Successfully purchased ${pkg.name}!`,
      data: {
        activePlan: userPkg,
        transaction: purchaseTx,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's active investments/packages
// @route   GET /api/purchase/active
// @access  Private
exports.getActiveInvestments = async (req, res) => {
  try {
    // Refresh user's earnings to ensure active plans' collection dates are updated
    await collectEarnings(req.user._id);

    const activeInvestments = await UserPackage.find({
      userId: req.user._id,
      expiresAt: { $gt: new Date() },
    }).populate('packageId', 'image').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: activeInvestments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
