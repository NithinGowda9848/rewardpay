const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { collectEarnings } = require('./authController');

// @desc    Initiate a deposit request
// @route   POST /api/wallet/deposit
// @access  Private
exports.deposit = async (req, res) => {
  try {
    const { amount, utr, screenshot, paymentTime } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid amount' });
    }

    if (!utr) {
      return res.status(400).json({ success: false, message: 'Please provide the transaction UTR / Reference ID' });
    }

    // Create a pending transaction
    const transaction = await Transaction.create({
      userId: req.user._id,
      user: req.user._id,
      amount,
      type: 'deposit',
      status: 'Pending',
      description: `Deposit via UPI (UTR: ${utr})`,
      utr,
      screenshot: screenshot || undefined,
      paymentTime: paymentTime || undefined,
    });

    // Also create a Deposit document in deposits collection for the Admin panel to read
    try {
      await Deposit.create({
        user: req.user._id,
        userId: req.user._id,
        username: req.user.username,
        amount: Number(amount),
        utrNumber: utr,
        'UTR Number': utr,
        paymentMethod: 'UPI',
        screenshot: screenshot || undefined,
        status: 'Pending',
        paymentTime,
        date: new Date()
      });
    } catch (dbErr) {
      console.error('Failed to sync deposit to admin DB:', dbErr);
    }

    // Emit Socket.IO updates for live update on database change
    if (req.io) {
      req.io.emit('deposit_change');
      req.io.emit('dashboard_update');
    }

    res.status(201).json({
      success: true,
      message: 'Deposit Request Submitted Successfully',
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Simulate and approve a pending deposit (for demonstration)
// @route   POST /api/wallet/deposit/confirm/:id
// @access  Private
exports.confirmDeposit = async (req, res) => {
  try {
    const txId = req.params.id;
    const transaction = await Transaction.findOne({ _id: txId, userId: req.user._id });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.status !== 'Pending' && transaction.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Transaction is already processed' });
    }

    // Approve transaction
    transaction.status = 'Approved';
    await transaction.save();

    // Update user balance
    const user = await User.findById(req.user._id);
    user.walletBalance = Number((user.walletBalance + transaction.amount).toFixed(2));
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Deposit verified and credited to wallet!',
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Request a withdrawal
// @route   POST /api/wallet/withdraw
// @access  Private
exports.withdraw = async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    const upiId = req.body.upiId || req.body.upi;
    const { bankName, bankUserName, accountNumber, ifscCode } = req.body;

    const wdrAmount = parseFloat(amount);
    if (isNaN(wdrAmount) || wdrAmount < 300) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is ₹300' });
    }

    // Determine target payout description
    let description = '';
    const method = paymentMethod || (upiId ? 'upi' : 'bank');

    if (method === 'upi') {
      if (!upiId) {
        return res.status(400).json({ success: false, message: 'Please provide target UPI ID' });
      }
      description = `Withdrawal to UPI: ${upiId}`;
    } else if (method === 'bank') {
      if (!bankName || !bankUserName || !accountNumber || !ifscCode) {
        return res.status(400).json({ success: false, message: 'Please provide all bank details (bank name, holder name, account number, and IFSC)' });
      }
      description = `Withdrawal to Bank: ${bankName} - Name: ${bankUserName}, A/C: ${accountNumber}, IFSC: ${ifscCode}`;
    } else {
      return res.status(400).json({ success: false, message: 'Please provide target payout details (UPI ID or Bank Details)' });
    }

    // Gather latest balance
    await collectEarnings(req.user._id);
    const user = await User.findById(req.user._id);

    if (user.walletBalance < wdrAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Create a transaction (Status is Pending, balance NOT deducted yet per instructions)
    const transaction = await Transaction.create({
      userId: req.user._id,
      user: req.user._id,
      amount: wdrAmount,
      type: 'withdraw',
      status: 'Pending',
      description,
      bankDetails: method === 'bank' ? { bankName, bankUserName, accountNumber, ifscCode } : undefined,
    });

    // Also create a Withdrawal document in withdrawals collection for the Admin panel to read
    try {
      await Withdrawal.create({
        user: req.user._id,
        userId: req.user._id,
        username: req.user.username,
        amount: Number(wdrAmount),
        upiId: method === 'upi' ? upiId : undefined,
        bankName: method === 'bank' ? bankName : undefined,
        bankUserName: method === 'bank' ? bankUserName : undefined,
        accountNumber: method === 'bank' ? accountNumber : undefined,
        ifscCode: method === 'bank' ? ifscCode : undefined,
        withdrawMethod: method,
        'UPI ID or Bank Details': method === 'upi' ? upiId : `Bank Name: ${bankName}, Holder: ${bankUserName}, A/C: ${accountNumber}, IFSC: ${ifscCode}`,
        status: 'Pending',
        requestDate: new Date()
      });
    } catch (dbErr) {
      console.error('Failed to sync withdrawal to admin DB:', dbErr);
    }

    // Emit Socket.IO updates for live update on database change
    if (req.io) {
      req.io.emit('withdrawal_change');
      req.io.emit('dashboard_update');
    }

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully and is pending approval!',
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user transactions history
// @route   GET /api/wallet/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    // Refresh earnings to show latest reward transactions if any
    await collectEarnings(req.user._id);

    const [deposits, withdrawals] = await Promise.all([
      Deposit.find({ $or: [{ user: req.user._id }, { userId: req.user._id }] }),
      Withdrawal.find({ $or: [{ user: req.user._id }, { userId: req.user._id }] })
    ]);

    const formattedDeposits = deposits.map(d => ({
      _id: d._id,
      amount: d.amount,
      status: d.status,
      utr: d.utrNumber,
      paymentTime: d.paymentTime,
      adminRemark: d.adminRemark,
      screenshot: d.screenshot,
      type: 'Deposit',
      flow: 'in',
      description: `Deposit via UPI (UTR: ${d.utrNumber})`,
      createdAt: d.createdAt,
    }));

    const formattedWithdrawals = withdrawals.map(w => {
      let description = '';
      if (w.withdrawMethod === 'upi') {
        description = `Withdrawal to UPI: ${w.upiId}`;
      } else {
        description = `Withdrawal to Bank: ${w.bankName} - Name: ${w.bankUserName}, A/C: ${w.accountNumber}, IFSC: ${w.ifscCode}`;
      }
      return {
        _id: w._id,
        amount: w.amount,
        status: w.status,
        adminRemark: w.adminRemark,
        type: 'Withdrawal',
        flow: 'out',
        description,
        createdAt: w.createdAt,
      };
    });

    const combined = [...formattedDeposits, ...formattedWithdrawals].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({
      success: true,
      data: combined,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get wallet balance
// @route   GET /api/wallet/balance
// @access  Private
exports.getBalance = async (req, res) => {
  try {
    await collectEarnings(req.user._id);
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        walletBalance: user.walletBalance,
        totalEarnings: user.totalEarnings,
        todayEarnings: user.todayEarnings,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all pending transaction requests (Admin only)
// @route   GET /api/wallet/admin/pending
// @access  Private/Admin
exports.adminGetAllPending = async (req, res) => {
  try {
    const [pendingDeposits, pendingWithdrawals] = await Promise.all([
      Deposit.find({ status: 'Pending' })
        .populate('user', 'username email mobile name')
        .populate('userId', 'username email mobile name')
        .sort({ createdAt: -1 }),
      Withdrawal.find({ status: 'Pending' })
        .populate('user', 'username email mobile name')
        .populate('userId', 'username email mobile name')
        .sort({ createdAt: -1 })
    ]);

    // Map deposits to match transaction shape expected by UI
    const mappedDeposits = pendingDeposits.map(d => {
      const userObj = d.user || d.userId;
      return {
        _id: d._id,
        userId: userObj,
        amount: d.amount,
        type: 'deposit',
        status: d.status,
        description: `Deposit via UPI (UTR: ${d.utrNumber})`,
        utr: d.utrNumber,
        screenshot: d.screenshot,
        paymentTime: d.paymentTime,
        adminRemark: d.adminRemark,
        createdAt: d.createdAt
      };
    });

    // Map withdrawals to match transaction shape expected by UI
    const mappedWithdrawals = pendingWithdrawals.map(w => {
      let description = '';
      if (w.withdrawMethod === 'upi') {
        description = `Withdrawal to UPI: ${w.upiId}`;
      } else {
        description = `Withdrawal to Bank: ${w.bankName} - Name: ${w.bankUserName}, A/C: ${w.accountNumber}, IFSC: ${w.ifscCode}`;
      }
      const userObj = w.user || w.userId;
      return {
        _id: w._id,
        userId: userObj,
        amount: w.amount,
        type: 'withdraw',
        status: w.status,
        description,
        bankDetails: w.withdrawMethod === 'bank' ? {
          bankName: w.bankName,
          bankUserName: w.bankUserName,
          accountNumber: w.accountNumber,
          ifscCode: w.ifscCode
        } : undefined,
        upiId: w.upiId,
        adminRemark: w.adminRemark,
        createdAt: w.createdAt
      };
    });

    // Combine and sort by createdAt descending
    const combined = [...mappedDeposits, ...mappedWithdrawals].sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json({
      success: true,
      data: combined,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all pending deposit requests (Admin only)
// @route   GET /api/wallet/admin/pending-deposits
// @access  Private/Admin
exports.getAllPendingDeposits = async (req, res) => {
  try {
    const transactions = await Transaction.find({ type: 'deposit', status: { $in: ['Pending', 'pending'] } })
      .populate('userId', 'username email mobile')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve/Confirm a pending deposit (Admin only)
// @route   POST /api/wallet/admin/confirm-deposit/:id
// @access  Private/Admin
exports.adminConfirmDeposit = async (req, res) => {
  try {
    const id = req.params.id;
    const { adminRemark } = req.body;

    let deposit = await Deposit.findById(id).populate('user').populate('userId');
    let transaction;

    if (deposit) {
      // Find or create transaction by UTR number
      transaction = await Transaction.findOne({ utr: deposit.utrNumber });
      if (!transaction) {
        const txId = `TXD${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
        const userObj = deposit.user || deposit.userId;
        transaction = await Transaction.create({
          transactionId: txId,
          userId: userObj._id,
          user: userObj._id,
          amount: deposit.amount,
          type: 'deposit',
          status: 'Pending',
          description: `Deposit via UPI (UTR: ${deposit.utrNumber})`,
          utr: deposit.utrNumber,
          screenshot: deposit.screenshot,
          paymentTime: deposit.paymentTime,
        });
      }
    } else {
      // Fallback: look up by Transaction ID
      transaction = await Transaction.findById(id);
      if (transaction) {
        deposit = await Deposit.findOne({ utrNumber: transaction.utr }).populate('user').populate('userId');
      }
    }

    if (!deposit && !transaction) {
      return res.status(404).json({ success: false, message: 'Deposit request not found' });
    }

    const currentStatus = deposit ? deposit.status : transaction.status;
    if (currentStatus !== 'Pending' && currentStatus !== 'pending') {
      return res.status(400).json({ success: false, message: `Deposit request is already ${currentStatus.toLowerCase()}` });
    }

    // Approve Deposit collection document
    if (deposit) {
      deposit.status = 'Approved';
      deposit.adminRemark = adminRemark || 'Approved by Admin';
      await deposit.save();
    }

    // Approve Transaction collection document
    if (transaction) {
      transaction.status = 'Approved';
      transaction.adminRemark = adminRemark || 'Approved by Admin';
      await transaction.save();
    }

    // Update depositor's wallet balance
    const userObj = deposit ? (deposit.user || deposit.userId) : await User.findById(transaction.userId);
    if (!userObj) {
      return res.status(404).json({ success: false, message: 'Depositing user not found' });
    }
    const depositAmount = deposit ? deposit.amount : transaction.amount;
    userObj.walletBalance = Number((userObj.walletBalance + depositAmount).toFixed(2));
    await userObj.save();

    // Generate Notification
    try {
      await Notification.create({
        userId: userObj._id,
        title: 'Deposit Approved',
        message: `Your deposit request of ₹${depositAmount} has been approved.`,
        type: 'Success'
      });
    } catch (notifErr) {
      console.error('Failed to create notification on confirm deposit:', notifErr.message);
    }

    // Create Audit Log
    try {
      await AuditLog.create({
        admin: req.admin ? req.admin.username : (req.user ? req.user.username : 'Admin'),
        role: req.admin ? req.admin.role : (req.user ? (req.user.role === 'admin' ? 'Super Admin' : req.user.role) : 'Admin'),
        action: 'Approve Deposit',
        details: `Approved ₹${depositAmount} deposit for ${userObj.email || userObj.username}`,
        ipAddress: req.ip
      });
    } catch (auditErr) {
      console.error('Failed to create audit log on confirm deposit:', auditErr.message);
    }

    // Emit Socket.IO updates
    if (req.io) {
      req.io.emit('deposit_change');
      req.io.emit('dashboard_update');
      req.io.emit('user_change', { documentKey: { _id: userObj._id } });
    }

    res.status(200).json({
      success: true,
      message: 'Deposit verified and user wallet credited successfully!',
      data: deposit || transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject a pending deposit (Admin only)
// @route   POST /api/wallet/admin/reject-deposit/:id
// @access  Private/Admin
exports.adminRejectDeposit = async (req, res) => {
  try {
    const id = req.params.id;
    const { adminRemark } = req.body;

    let deposit = await Deposit.findById(id);
    let transaction;

    if (deposit) {
      transaction = await Transaction.findOne({ utr: deposit.utrNumber });
    } else {
      transaction = await Transaction.findById(id);
      if (transaction) {
        deposit = await Deposit.findOne({ utrNumber: transaction.utr });
      }
    }

    if (!deposit && !transaction) {
      return res.status(404).json({ success: false, message: 'Deposit request not found' });
    }

    const currentStatus = deposit ? deposit.status : transaction.status;
    if (currentStatus !== 'Pending' && currentStatus !== 'pending') {
      return res.status(400).json({ success: false, message: `Deposit request is already ${currentStatus.toLowerCase()}` });
    }

    if (deposit) {
      deposit.status = 'Rejected';
      deposit.adminRemark = adminRemark || 'Rejected by Admin';
      await deposit.save();
    }

    if (transaction) {
      transaction.status = 'Rejected';
      transaction.adminRemark = adminRemark || 'Rejected by Admin';
      await transaction.save();
    }

    const userObj = deposit ? (deposit.user || deposit.userId) : (transaction ? await User.findById(transaction.userId) : null);
    const depositAmount = deposit ? deposit.amount : (transaction ? transaction.amount : 0);

    if (userObj) {
      // Generate Notification
      try {
        await Notification.create({
          userId: userObj._id,
          title: 'Deposit Rejected',
          message: `Your deposit request of ₹${depositAmount} has been rejected by admin. Reason: ${adminRemark || 'N/A'}`,
          type: 'Error'
        });
      } catch (notifErr) {
        console.error('Failed to create notification on reject deposit:', notifErr.message);
      }
    }

    // Create Audit Log
    try {
      await AuditLog.create({
        admin: req.admin ? req.admin.username : (req.user ? req.user.username : 'Admin'),
        role: req.admin ? req.admin.role : (req.user ? (req.user.role === 'admin' ? 'Super Admin' : req.user.role) : 'Admin'),
        action: 'Reject Deposit',
        details: `Rejected ₹${depositAmount} deposit for ${userObj ? (userObj.email || userObj.username) : 'unknown user'}. Reason: ${adminRemark || 'N/A'}`,
        ipAddress: req.ip
      });
    } catch (auditErr) {
      console.error('Failed to create audit log on reject deposit:', auditErr.message);
    }

    // Emit Socket.IO updates
    if (req.io) {
      req.io.emit('deposit_change');
      req.io.emit('dashboard_update');
      if (userObj) {
        req.io.emit('user_change', { documentKey: { _id: userObj._id } });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Deposit request rejected successfully!',
      data: deposit || transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve/Pay a pending withdrawal (Admin only)
// @route   POST /api/wallet/admin/confirm-withdrawal/:id
// @access  Private/Admin
exports.adminConfirmWithdrawal = async (req, res) => {
  try {
    const id = req.params.id;
    const { adminRemark } = req.body;

    let withdrawal = await Withdrawal.findById(id).populate('user').populate('userId');
    let transaction;

    if (withdrawal) {
      const userObj = withdrawal.user || withdrawal.userId;
      transaction = await Transaction.findOne({
        userId: userObj._id,
        type: { $in: ['withdraw', 'Withdrawal'] },
        status: { $in: ['Pending', 'pending'] },
        amount: withdrawal.amount
      });
      if (!transaction) {
        const txId = `TXW${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
        let description = '';
        if (withdrawal.withdrawMethod === 'upi') {
          description = `Withdrawal to UPI: ${withdrawal.upiId}`;
        } else {
          description = `Withdrawal to Bank: ${withdrawal.bankName} - Name: ${withdrawal.bankUserName}, A/C: ${withdrawal.accountNumber}, IFSC: ${withdrawal.ifscCode}`;
        }
        transaction = await Transaction.create({
          transactionId: txId,
          userId: userObj._id,
          user: userObj._id,
          amount: withdrawal.amount,
          type: 'withdraw',
          status: 'Pending',
          description,
        });
      }
    } else {
      transaction = await Transaction.findById(id);
      if (transaction) {
        withdrawal = await Withdrawal.findOne({
          user: transaction.userId,
          amount: transaction.amount,
          status: 'Pending'
        }).populate('user').populate('userId');
      }
    }

    if (!withdrawal && !transaction) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }

    const currentStatus = withdrawal ? withdrawal.status : transaction.status;
    if (currentStatus !== 'Pending' && currentStatus !== 'pending') {
      return res.status(400).json({ success: false, message: `Withdrawal request is already ${currentStatus.toLowerCase()}` });
    }

    const userObj = withdrawal ? (withdrawal.user || withdrawal.userId) : await User.findById(transaction.userId);
    if (!userObj) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const wdrAmount = withdrawal ? withdrawal.amount : transaction.amount;
    if (userObj.walletBalance < wdrAmount) {
      return res.status(400).json({ success: false, message: 'User has insufficient balance to complete this withdrawal' });
    }

    // Deduct from wallet balance
    userObj.walletBalance = Number((userObj.walletBalance - wdrAmount).toFixed(2));
    await userObj.save();

    if (withdrawal) {
      withdrawal.status = 'Paid';
      withdrawal.adminRemark = adminRemark || 'Approved and Paid';
      await withdrawal.save();
    }

    if (transaction) {
      transaction.status = 'Paid';
      transaction.adminRemark = adminRemark || 'Approved and Paid';
      await transaction.save();
    }

    // Generate Notification
    try {
      await Notification.create({
        userId: userObj._id,
        title: 'Withdrawal Disbursed',
        message: `Your withdrawal request of ₹${wdrAmount} has been approved and processed.`,
        type: 'Success'
      });
    } catch (notifErr) {
      console.error('Failed to create notification on confirm withdrawal:', notifErr.message);
    }

    // Create Audit Log
    try {
      await AuditLog.create({
        admin: req.admin ? req.admin.username : (req.user ? req.user.username : 'Admin'),
        role: req.admin ? req.admin.role : (req.user ? (req.user.role === 'admin' ? 'Super Admin' : req.user.role) : 'Admin'),
        action: 'Approve Withdrawal',
        details: `Approved ₹${wdrAmount} withdrawal for ${userObj.email || userObj.username}`,
        ipAddress: req.ip
      });
    } catch (auditErr) {
      console.error('Failed to create audit log on confirm withdrawal:', auditErr.message);
    }

    // Emit Socket.IO updates
    if (req.io) {
      req.io.emit('withdrawal_change');
      req.io.emit('dashboard_update');
      req.io.emit('user_change', { documentKey: { _id: userObj._id } });
    }

    res.status(200).json({
      success: true,
      message: 'Withdrawal approved and balance deducted!',
      data: withdrawal || transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject a pending withdrawal (Admin only)
// @route   POST /api/wallet/admin/reject-withdrawal/:id
// @access  Private/Admin
exports.adminRejectWithdrawal = async (req, res) => {
  try {
    const id = req.params.id;
    const { adminRemark } = req.body;

    let withdrawal = await Withdrawal.findById(id).populate('user').populate('userId');
    let transaction;

    if (withdrawal) {
      const userObj = withdrawal.user || withdrawal.userId;
      transaction = await Transaction.findOne({
        userId: userObj?._id,
        type: { $in: ['withdraw', 'Withdrawal'] },
        status: { $in: ['Pending', 'pending'] },
        amount: withdrawal.amount
      });
    } else {
      transaction = await Transaction.findById(id);
      if (transaction) {
        withdrawal = await Withdrawal.findOne({
          user: transaction.userId,
          amount: transaction.amount,
          status: 'Pending'
        }).populate('user').populate('userId');
      }
    }

    if (!withdrawal && !transaction) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }

    const currentStatus = withdrawal ? withdrawal.status : transaction.status;
    if (currentStatus !== 'Pending' && currentStatus !== 'pending') {
      return res.status(400).json({ success: false, message: `Withdrawal request is already ${currentStatus.toLowerCase()}` });
    }

    if (withdrawal) {
      withdrawal.status = 'Rejected';
      withdrawal.adminRemark = adminRemark || 'Rejected by Admin';
      await withdrawal.save();
    }

    if (transaction) {
      transaction.status = 'Rejected';
      transaction.adminRemark = adminRemark || 'Rejected by Admin';
      await transaction.save();
    }

    const userObj = withdrawal ? (withdrawal.user || withdrawal.userId) : (transaction ? await User.findById(transaction.userId) : null);
    const wdrAmount = withdrawal ? withdrawal.amount : (transaction ? transaction.amount : 0);

    if (userObj) {
      // Generate Notification
      try {
        await Notification.create({
          userId: userObj._id,
          title: 'Withdrawal Rejected',
          message: `Your withdrawal request of ₹${wdrAmount} has been rejected by admin. Reason: ${adminRemark || 'N/A'}`,
          type: 'Error'
        });
      } catch (notifErr) {
        console.error('Failed to create notification on reject withdrawal:', notifErr.message);
      }
    }

    // Create Audit Log
    try {
      await AuditLog.create({
        admin: req.admin ? req.admin.username : (req.user ? req.user.username : 'Admin'),
        role: req.admin ? req.admin.role : (req.user ? (req.user.role === 'admin' ? 'Super Admin' : req.user.role) : 'Admin'),
        action: 'Reject Withdrawal',
        details: `Rejected ₹${wdrAmount} withdrawal for ${userObj ? (userObj.email || userObj.username) : 'unknown user'}. Reason: ${adminRemark || 'N/A'}`,
        ipAddress: req.ip
      });
    } catch (auditErr) {
      console.error('Failed to create audit log on reject withdrawal:', auditErr.message);
    }

    // Emit Socket.IO updates
    if (req.io) {
      req.io.emit('withdrawal_change');
      req.io.emit('dashboard_update');
      if (userObj) {
        req.io.emit('user_change', { documentKey: { _id: userObj._id } });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Withdrawal request rejected successfully!',
      data: withdrawal || transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user deposits directly from Deposits collection
// @route   GET /api/wallet/deposits
// @access  Private
exports.getUserDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find({
      $or: [{ user: req.user._id }, { userId: req.user._id }]
    }).sort({ createdAt: -1 });
    const formattedDeposits = deposits.map(d => ({
      _id: d._id,
      amount: d.amount,
      status: d.status,
      utr: d.utrNumber,
      paymentTime: d.paymentTime,
      adminRemark: d.adminRemark,
      screenshot: d.screenshot,
      type: 'deposit',
      flow: 'in',
      description: `Deposit via UPI (UTR: ${d.utrNumber})`,
      createdAt: d.createdAt,
    }));
    res.status(200).json({
      success: true,
      data: formattedDeposits,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user withdrawals directly from Withdrawals collection
// @route   GET /api/wallet/withdrawals
// @access  Private
exports.getUserWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({
      $or: [{ user: req.user._id }, { userId: req.user._id }]
    }).sort({ createdAt: -1 });
    const formattedWithdrawals = withdrawals.map(w => {
      let description = '';
      if (w.withdrawMethod === 'upi') {
        description = `Withdrawal to UPI: ${w.upiId}`;
      } else {
        description = `Withdrawal to Bank: ${w.bankName} - Name: ${w.bankUserName}, A/C: ${w.accountNumber}, IFSC: ${w.ifscCode}`;
      }
      return {
        _id: w._id,
        amount: w.amount,
        status: w.status,
        adminRemark: w.adminRemark,
        type: 'withdraw',
        flow: 'out',
        description,
        createdAt: w.createdAt,
      };
    });
    res.status(200).json({
      success: true,
      data: formattedWithdrawals,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
