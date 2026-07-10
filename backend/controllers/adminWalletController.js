const User = require('../models/User');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');

exports.getWallets = async (req, res) => {
  const { search, status } = req.query;

  try {
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { referralCode: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const users = await User.find(query)
      .select('name email referralCode walletBalance bonusWallet commissionWallet rewardWallet transferWallet totalEarnings status')
      .sort({ joinDate: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.adjustUserWallet = async (req, res) => {
  const { id } = req.params;
  const { walletType, action, amount, description } = req.body;

  // Validate fields
  if (!walletType || !action || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ message: 'Invalid adjustment parameters' });
  }

  const validWallets = ['walletBalance', 'bonusWallet', 'commissionWallet', 'rewardWallet', 'transferWallet'];
  if (!validWallets.includes(walletType)) {
    return res.status(400).json({ message: 'Invalid wallet type specified' });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const adjustmentAmount = action === 'add' ? amount : -amount;

    // Check if deduction leaves a negative balance
    if (user[walletType] + adjustmentAmount < 0) {
      return res.status(400).json({ message: `Insufficient balance in ${walletType}` });
    }

    user[walletType] = Number((user[walletType] + adjustmentAmount).toFixed(2));

    // Adjust total earnings if adding money to total earnings related wallets
    if (action === 'add' && (walletType === 'walletBalance' || walletType === 'commissionWallet' || walletType === 'rewardWallet')) {
      user.totalEarnings = Number((user.totalEarnings + amount).toFixed(2));
    }

    await user.save();

    // Create Transaction Log
    const txId = `TXA${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
    await Transaction.create({
      transactionId: txId,
      userId: user._id,
      amount: Math.abs(adjustmentAmount),
      type: adjustmentAmount >= 0 ? 'reward' : 'withdraw',
      status: 'Completed',
      description: description || `Admin wallet adjustment: ${action} ₹${amount} on ${walletType}`
    });

    // Create Audit Log
    await AuditLog.create({
      admin: req.admin.username,
      role: req.admin.role,
      action: 'Wallet Adjustment',
      details: `${action === 'add' ? 'Added' : 'Deducted'} ₹${amount} on ${walletType} for user ${user.email}`,
      ipAddress: req.ip
    });

    res.json({
      message: 'Wallet balance adjusted successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
