const User = require('../models/User');
const UserPackage = require('../models/UserPackage');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');

const getUsers = async (req, res) => {
  const { search, status, vip } = req.query;

  try {
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { referralCode: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (vip && vip !== 'All') {
      query.vipLevel = vip;
    }

    const users = await User.find(query).sort({ joinDate: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, mobile, vipLevel, walletBalance, password } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name || user.name;
    user.email = email || user.email;
    user.mobile = mobile || user.mobile;
    user.vipLevel = vipLevel || user.vipLevel;

    // When admin sets a new password, store it as plainPassword too
    if (password && password !== user.plainPassword) {
      user.password = password;
      user.plainPassword = password;
    }

    if (walletBalance !== undefined) {
      user.walletBalance = walletBalance;
    }

    const updatedUser = await user.save();

    await AuditLog.create({
      admin: req.admin.username,
      role: req.admin.role,
      action: 'Update User',
      details: `Updated user info for ${user.email}`,
      ipAddress: req.ip
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Active' or 'Blocked'

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.status = status;
    await user.save();

    await AuditLog.create({
      admin: req.admin.username,
      role: req.admin.role,
      action: status === 'Blocked' ? 'Block User' : 'Activate User',
      details: `${status === 'Blocked' ? 'Blocked' : 'Activated'} user: ${user.email}`,
      ipAddress: req.ip
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await User.findByIdAndDelete(id);

    await AuditLog.create({
      admin: req.admin.username,
      role: req.admin.role,
      action: 'Delete User',
      details: `Deleted user: ${user.email}`,
      ipAddress: req.ip
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 1. Investment History
    const investments = await UserPackage.find({ user: id })
      .populate('package')
      .sort({ purchaseDate: -1 });

    // 2. Transaction History
    const transactions = await Transaction.find({ user: id })
      .sort({ date: -1 });

    // 3. Referral Team (up to Level 3)
    // Level 1
    const level1 = await User.find({ referredBy: user.referralCode }).select('name email mobile vipLevel joinDate referralCode walletBalance bonusWallet commissionWallet rewardWallet transferWallet totalEarnings');
    const level1Codes = level1.map(u => u.referralCode);

    // Level 2
    let level2 = [];
    if (level1Codes.length > 0) {
      level2 = await User.find({ referredBy: { $in: level1Codes } }).select('name email mobile vipLevel joinDate referralCode walletBalance bonusWallet commissionWallet rewardWallet transferWallet totalEarnings');
    }
    const level2Codes = level2.map(u => u.referralCode);

    // Level 3
    let level3 = [];
    if (level2Codes.length > 0) {
      level3 = await User.find({ referredBy: { $in: level2Codes } }).select('name email mobile vipLevel joinDate referralCode walletBalance bonusWallet commissionWallet rewardWallet transferWallet totalEarnings');
    }

    res.json({
      personalInfo: user,
      investments,
      transactions,
      referralTeam: {
        level1,
        level2,
        level3
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getUserDetails
};
