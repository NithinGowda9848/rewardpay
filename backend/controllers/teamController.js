const User = require('../models/User');
const UserPackage = require('../models/UserPackage');
const Transaction = require('../models/Transaction');

// Helper: build a query filter that matches referredBy as either an ObjectId or a referralCode string
const buildReferredByFilter = (userIds, referralCodes) => {
  const conditions = [];
  if (userIds.length > 0) conditions.push({ referredBy: { $in: userIds } });
  if (referralCodes.length > 0) conditions.push({ referredBy: { $in: referralCodes } });
  if (conditions.length === 0) return null;
  return { $or: conditions };
};

// @desc    Get team/referral stats
// @route   GET /api/team/stats
// @access  Private
exports.getTeamStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const userReferralCode = req.user.referralCode;

    // Find Level 1 referrals (referred by this user's _id OR referralCode)
    const lvl1Filter = buildReferredByFilter([userId], userReferralCode ? [userReferralCode] : []);
    const lvl1Users = lvl1Filter ? await User.find(lvl1Filter) : [];
    const lvl1Ids = lvl1Users.map((u) => u._id);
    const lvl1Codes = lvl1Users.map((u) => u.referralCode).filter(Boolean);

    // Find Level 2 referrals
    const lvl2Filter = buildReferredByFilter(lvl1Ids, lvl1Codes);
    const lvl2Users = lvl2Filter ? await User.find(lvl2Filter) : [];
    const lvl2Ids = lvl2Users.map((u) => u._id);
    const lvl2Codes = lvl2Users.map((u) => u.referralCode).filter(Boolean);

    // Find Level 3 referrals
    const lvl3Filter = buildReferredByFilter(lvl2Ids, lvl2Codes);
    const lvl3Users = lvl3Filter ? await User.find(lvl3Filter) : [];
    const lvl3Ids = lvl3Users.map((u) => u._id);
    const lvl3Codes = lvl3Users.map((u) => u.referralCode).filter(Boolean);

    // Find Level 4 referrals
    const lvl4Filter = buildReferredByFilter(lvl3Ids, lvl3Codes);
    const lvl4Users = lvl4Filter ? await User.find(lvl4Filter) : [];
    const lvl4Ids = lvl4Users.map((u) => u._id);

    // Get active purchases for team investment calculations (all levels)
    const allTeamIds = [...lvl1Ids, ...lvl2Ids, ...lvl3Ids, ...lvl4Ids];
    const activePurchases = allTeamIds.length > 0 ? await UserPackage.find({
      userId: { $in: allTeamIds },
    }) : [];

    const activeReferralIds = [...new Set(activePurchases.map((p) => p.userId.toString()))];

    // Sum referral commissions earned by user
    const commissions = await Transaction.find({
      userId: userId,
      type: 'referral',
    });
    const totalCommissions = commissions.reduce((sum, tx) => sum + tx.amount, 0);

    let level1Earnings = 0;
    let level2Earnings = 0;
    let level3Earnings = 0;
    let level4Earnings = 0;

    commissions.forEach((tx) => {
      if (tx.description && tx.description.includes('Level 1')) {
        level1Earnings += tx.amount;
      } else if (tx.description && tx.description.includes('Level 2')) {
        level2Earnings += tx.amount;
      } else if (tx.description && tx.description.includes('Level 3')) {
        level3Earnings += tx.amount;
      } else if (tx.description && tx.description.includes('Level 4')) {
        level4Earnings += tx.amount;
      } else {
        level1Earnings += tx.amount;
      }
    });

    const teamInvestment = activePurchases.reduce((sum, pkg) => sum + pkg.price, 0);

    res.status(200).json({
      success: true,
      data: {
        referralCode: req.user.referralCode,
        teamSize: allTeamIds.length,
        activeReferrals: activeReferralIds.length,
        totalCommissions: Number(totalCommissions.toFixed(2)),
        teamInvestment: Number(teamInvestment.toFixed(2)),
        level1Members: lvl1Ids.length,
        level2Members: lvl2Ids.length,
        level3Members: lvl3Ids.length,
        level4Members: lvl4Ids.length,
        level1Earnings: Number(level1Earnings.toFixed(2)),
        level2Earnings: Number(level2Earnings.toFixed(2)),
        level3Earnings: Number(level3Earnings.toFixed(2)),
        level4Earnings: Number(level4Earnings.toFixed(2)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get referred team members list
// @route   GET /api/team/members
// @access  Private
exports.getTeamMembers = async (req, res) => {
  try {
    const userId = req.user._id;
    const userReferralCode = req.user.referralCode;

    // Find referred users (matching either ObjectId or referralCode)
    const filter = buildReferredByFilter([userId], userReferralCode ? [userReferralCode] : []);
    const referrals = filter
      ? await User.find(filter)
          .select('name email createdAt walletBalance')
          .sort({ createdAt: -1 })
      : [];

    const referralList = [];

    for (let ref of referrals) {
      // Check if they have active packages
      const hasActive = await UserPackage.exists({
        userId: ref._id,
        expiresAt: { $gt: new Date() },
      });

      referralList.push({
        id: ref._id,
        name: ref.name,
        email: ref.email,
        createdAt: ref.createdAt,
        status: hasActive ? 'active' : 'inactive',
      });
    }

    res.status(200).json({
      success: true,
      data: referralList,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
