const User = require('../models/User');
const Transaction = require('../models/Transaction');
const UserPackage = require('../models/UserPackage');

// Helper: build a query filter that matches referredBy as either an ObjectId or a referralCode string
const buildReferredByFilter = (userIds, referralCodes) => {
  const conditions = [];
  if (userIds.length > 0) conditions.push({ referredBy: { $in: userIds } });
  if (referralCodes.length > 0) conditions.push({ referredBy: { $in: referralCodes } });
  if (conditions.length === 0) return null;
  return { $or: conditions };
};

exports.getNetworkStats = async (req, res) => {
  try {
    const totalReferrals = await User.countDocuments({ referredBy: { $ne: null } });

    // Aggregate MLM Commission
    const commissionStats = await Transaction.aggregate([
      { $match: { type: { $in: ['referral', 'Referral Commission'] }, status: { $in: ['completed', 'Completed'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalReferralBonuses = commissionStats[0]?.total || 0;

    // Active MLM Members (Members with at least 1 active investment plan)
    const activePackages = await UserPackage.find({ expiresAt: { $gt: new Date() } }).distinct('userId');
    const activeMembersCount = activePackages.length;

    res.json({
      totalReferrals,
      totalReferralBonuses,
      activeMembersCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNetworkTree = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const selectFields = 'name email referralCode vipLevel walletBalance bonusWallet commissionWallet rewardWallet transferWallet totalEarnings status';

    // Build tree root
    const tree = {
      id: user._id,
      name: user.name,
      email: user.email,
      referralCode: user.referralCode,
      vipLevel: user.vipLevel,
      walletBalance: user.walletBalance,
      totalEarnings: user.totalEarnings,
      status: user.status,
      children: []
    };

    // L1 (referred by L0)
    const l1Filter = buildReferredByFilter([user._id], user.referralCode ? [user.referralCode] : []);
    const l1List = l1Filter ? await User.find(l1Filter).select(selectFields) : [];
    
    const l1Nodes = [];
    let l2CountAcc = 0;
    let l3CountAcc = 0;

    for (const l1User of l1List) {
      // L2 (referred by L1)
      const l2Filter = buildReferredByFilter([l1User._id], l1User.referralCode ? [l1User.referralCode] : []);
      const l2List = l2Filter ? await User.find(l2Filter).select(selectFields) : [];
      l2CountAcc += l2List.length;

      const l2Nodes = [];
      for (const l2User of l2List) {
        // L3 (referred by L2)
        const l3Filter = buildReferredByFilter([l2User._id], l2User.referralCode ? [l2User.referralCode] : []);
        const l3List = l3Filter ? await User.find(l3Filter).select(selectFields) : [];
        l3CountAcc += l3List.length;

        l2Nodes.push({
          id: l2User._id,
          name: l2User.name,
          email: l2User.email,
          referralCode: l2User.referralCode,
          vipLevel: l2User.vipLevel,
          walletBalance: l2User.walletBalance,
          totalEarnings: l2User.totalEarnings,
          status: l2User.status,
          children: l3List.map(l3User => ({
            id: l3User._id,
            name: l3User.name,
            email: l3User.email,
            referralCode: l3User.referralCode,
            vipLevel: l3User.vipLevel,
            walletBalance: l3User.walletBalance,
            totalEarnings: l3User.totalEarnings,
            status: l3User.status,
            children: []
          }))
        });
      }

      l1Nodes.push({
        id: l1User._id,
        name: l1User.name,
        email: l1User.email,
        referralCode: l1User.referralCode,
        vipLevel: l1User.vipLevel,
        walletBalance: l1User.walletBalance,
        totalEarnings: l1User.totalEarnings,
        status: l1User.status,
        children: l2Nodes
      });
    }

    tree.children = l1Nodes;

    res.json({
      tree,
      summary: {
        level1: l1List.length,
        level2: l2CountAcc,
        level3: l3CountAcc,
        total: l1List.length + l2CountAcc + l3CountAcc
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
