const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');

const getWithdrawals = async (req, res) => {
  const { status } = req.query;

  try {
    let query = {};
    if (status && status !== 'All') {
      query.status = status;
    }

    const withdrawals = await Withdrawal.find(query)
      .populate('user', 'name email mobile')
      .populate('userId', 'name email mobile')
      .sort({ createdAt: -1 });

    const formattedWithdrawals = withdrawals.map(w => {
      const obj = w.toObject ? w.toObject() : w;
      const userDetails = obj.user || obj.userId;
      obj.user = userDetails;
      obj.userId = userDetails;
      return obj;
    });

    res.json(formattedWithdrawals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveWithdrawal = async (req, res) => {
  const { id } = req.params;

  try {
    const withdrawal = await Withdrawal.findById(id).populate('user').populate('userId');
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });
    if (withdrawal.status !== 'Pending') {
      return res.status(400).json({ message: `Withdrawal already ${withdrawal.status.toLowerCase()}` });
    }

    const user = withdrawal.user || withdrawal.userId;
    if (!user) {
      return res.status(404).json({ message: 'User associated with this withdrawal not found' });
    }

    if (user.walletBalance < withdrawal.amount) {
      return res.status(400).json({ message: 'Insufficient user wallet balance to verify this withdrawal' });
    }

    // Deduct user wallet balance on approval
    user.walletBalance = Number((user.walletBalance - withdrawal.amount).toFixed(2));
    await user.save();

    // 1. Approve status
    withdrawal.status = 'Approved';
    await withdrawal.save();

    // 2. Update corresponding transaction in transactions collection (created by user app), or create fallback
    const existingTx = await Transaction.collection.findOne({
      userId: user._id,
      type: { $in: ['withdraw', 'Withdrawal'] },
      status: { $in: ['Pending', 'pending'] },
      amount: withdrawal.amount
    });
    if (existingTx) {
      await Transaction.collection.updateOne(
        { _id: existingTx._id },
        { $set: { status: 'Paid', adminRemark: 'Approved and Paid' } }
      );
    } else {
      // Fallback: create a new transaction if not found
      const txId = `TXW${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
      await Transaction.create({
        transactionId: txId,
        userId: user._id,
        amount: withdrawal.amount,
        type: 'withdraw',
        status: 'Paid',
        description: `Withdrawal of ₹${withdrawal.amount} to UPI: ${withdrawal.upiId} approved by admin`
      });
    }

    // 4. Send notification
    await Notification.create({
      userId: user._id,
      title: 'Withdrawal Disbursed',
      message: `Your withdrawal request of ₹${withdrawal.amount} has been approved and processed.`,
      type: 'Success'
    });

    // 5. Audit log
    await AuditLog.create({
      admin: req.admin.username,
      role: req.admin.role,
      action: 'Approve Withdrawal',
      details: `Approved ₹${withdrawal.amount} withdrawal for ${user.email}`,
      ipAddress: req.ip
    });

    // Emit real-time updates
    if (req.io) {
      req.io.emit('withdrawal_change');
      req.io.emit('dashboard_update');
    }

    res.json({ message: 'Withdrawal approved successfully', withdrawal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectWithdrawal = async (req, res) => {
  const { id } = req.params;
  const { adminRemark } = req.body;

  try {
    const withdrawal = await Withdrawal.findById(id).populate('user').populate('userId');
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });
    if (withdrawal.status !== 'Pending') {
      return res.status(400).json({ message: `Withdrawal already ${withdrawal.status.toLowerCase()}` });
    }

    // Reject status
    withdrawal.status = 'Rejected';
    withdrawal.adminRemark = adminRemark || 'Rejected by Admin';
    await withdrawal.save();

    const user = withdrawal.user || withdrawal.userId;
    if (user) {
      if (withdrawal.isReserved) {
        user.walletBalance = Number((user.walletBalance + withdrawal.amount).toFixed(2));
        await user.save();
      }
    }

    // Update corresponding transaction in transactions collection (created by user app)
    await Transaction.collection.updateOne(
      { 
        userId: user?._id, 
        type: { $in: ['withdraw', 'Withdrawal'] }, 
        status: { $in: ['Pending', 'pending'] }, 
        amount: withdrawal.amount 
      },
      { $set: { status: 'Rejected', adminRemark: adminRemark || 'Rejected by Admin' } }
    );

    // Send notification
    await Notification.create({
      userId: user?._id,
      title: 'Withdrawal Rejected',
      message: `Your withdrawal request of ₹${withdrawal.amount} was rejected by admin. Reason: ${adminRemark || 'N/A'}`,
      type: 'Error'
    });

    // Audit log
    await AuditLog.create({
      admin: req.admin.username,
      role: req.admin.role,
      action: 'Reject Withdrawal',
      details: `Rejected ₹${withdrawal.amount} withdrawal for ${user?.email || 'N/A'}. Reason: ${adminRemark || 'N/A'}`,
      ipAddress: req.ip
    });

    // Emit real-time updates
    if (req.io) {
      req.io.emit('withdrawal_change');
      req.io.emit('dashboard_update');
    }

    res.json({ message: 'Withdrawal rejected successfully', withdrawal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDbStatus = async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    res.json({
      connected: isConnected,
      database: mongoose.connection.name || 'Rewards Pay DB',
      host: mongoose.connection.host || 'MongoDB Host',
      readyState: mongoose.connection.readyState
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getDbStatus
};
