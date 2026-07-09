const Deposit = require('../models/Deposit');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const getDeposits = async (req, res) => {
  const { status } = req.query;

  try {
    let query = {};
    if (status && status !== 'All') {
      query.status = status;
    }

    const deposits = await Deposit.find(query)
      .populate('user', 'name email mobile')
      .sort({ createdAt: -1 });

    res.json(deposits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveDeposit = async (req, res) => {
  const { id } = req.params;

  try {
    const deposit = await Deposit.findById(id).populate('user');
    if (!deposit) return res.status(404).json({ message: 'Deposit not found' });
    if (deposit.status !== 'Pending') {
      return res.status(400).json({ message: `Deposit already ${deposit.status.toLowerCase()}` });
    }

    // 1. Approve deposit status
    deposit.status = 'Approved';
    await deposit.save();

    // 2. Increase user's walletBalance
    const user = deposit.user;
    if (!user) {
      return res.status(404).json({ message: 'User associated with this deposit not found' });
    }
    user.walletBalance = Number((user.walletBalance + deposit.amount).toFixed(2));
    await user.save();

    // 3. Update corresponding transaction in transactions collection (created by user app), or create new if not found
    const existingTx = await Transaction.collection.findOne({ 
      utr: deposit.utrNumber, 
      type: { $in: ['Deposit', 'deposit'] } 
    });
    if (existingTx) {
      await Transaction.collection.updateOne(
        { _id: existingTx._id },
        { $set: { status: 'Approved', adminRemark: 'Approved by Admin' } }
      );
    } else {
      const txId = `TXD${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
      await Transaction.create({
        transactionId: txId,
        userId: user._id,
        amount: deposit.amount,
        type: 'deposit',
        status: 'Approved',
        description: `Deposit of ₹${deposit.amount} via UTR: ${deposit.utrNumber} approved by admin`
      });
    }

    // 4. Generate Notification
    await Notification.create({
      userId: user._id,
      title: 'Deposit Approved',
      message: `Your deposit request of ₹${deposit.amount} has been approved.`,
      type: 'Success'
    });

    // 5. Audit log
    await AuditLog.create({
      admin: req.admin.username,
      role: req.admin.role,
      action: 'Approve Deposit',
      details: `Approved ₹${deposit.amount} deposit for ${user.email}`,
      ipAddress: req.ip
    });

    // Emit real-time updates
    if (req.io) {
      req.io.emit('deposit_change');
      req.io.emit('dashboard_update');
    }

    res.json({ message: 'Deposit approved successfully', deposit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectDeposit = async (req, res) => {
  const { id } = req.params;
  const { adminRemark } = req.body;

  try {
    const deposit = await Deposit.findById(id).populate('user');
    if (!deposit) return res.status(404).json({ message: 'Deposit not found' });
    if (deposit.status !== 'Pending') {
      return res.status(400).json({ message: `Deposit already ${deposit.status.toLowerCase()}` });
    }

    deposit.status = 'Rejected';
    deposit.adminRemark = adminRemark || 'Rejected by Admin';
    await deposit.save();

    // Update corresponding transaction in transactions collection (created by user app)
    await Transaction.collection.updateOne(
      { 
        utr: deposit.utrNumber, 
        type: { $in: ['Deposit', 'deposit'] }, 
        status: { $in: ['Pending', 'pending'] } 
      },
      { $set: { status: 'Rejected', adminRemark: adminRemark || 'Rejected by Admin' } }
    );

    // Notification
    await Notification.create({
      userId: deposit.user?._id,
      title: 'Deposit Rejected',
      message: `Your deposit request of ₹${deposit.amount} has been rejected by admin. Reason: ${adminRemark || 'N/A'}`,
      type: 'Error'
    });

    // Audit log
    await AuditLog.create({
      admin: req.admin.username,
      role: req.admin.role,
      action: 'Reject Deposit',
      details: `Rejected ₹${deposit.amount} deposit for ${deposit.user?.email}. Reason: ${adminRemark || 'N/A'}`,
      ipAddress: req.ip
    });

    // Emit real-time updates
    if (req.io) {
      req.io.emit('deposit_change');
      req.io.emit('dashboard_update');
    }

    res.json({ message: 'Deposit rejected successfully', deposit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDeposits,
  approveDeposit,
  rejectDeposit
};
