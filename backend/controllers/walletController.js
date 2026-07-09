const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { collectEarnings } = require('./authController');

// @desc    Initiate a deposit request
// @route   POST /api/wallet/deposit
// @access  Private
exports.deposit = async (req, res) => {
  try {
    const { amount, utr, screenshot } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid amount' });
    }

    if (!utr) {
      return res.status(400).json({ success: false, message: 'Please provide the transaction UTR / Reference ID' });
    }

    // Create a pending transaction
    const transaction = await Transaction.create({
      userId: req.user._id,
      amount,
      type: 'deposit',
      status: 'pending',
      description: `Deposit via UPI (UTR: ${utr})`,
      utr,
      screenshot,
    });

    // Also create a Deposit document in deposits collection for the Admin panel to read
    try {
      const mongoose = require('mongoose');
      await mongoose.connection.db.collection('deposits').insertOne({
        user: req.user._id,
        amount: Number(amount),
        utrNumber: utr,
        screenshot: screenshot,
        status: 'Pending',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (dbErr) {
      console.error('Failed to sync deposit to admin DB:', dbErr);
    }

    res.status(201).json({
      success: true,
      message: 'Deposit request created. Please scan QR or pay to UPI ID.',
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

    if (transaction.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Transaction is already processed' });
    }

    // Approve transaction
    transaction.status = 'completed';
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
    const { bankUserName, accountNumber, ifscCode } = req.body;

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
      if (!bankUserName || !accountNumber || !ifscCode) {
        return res.status(400).json({ success: false, message: 'Please provide bank account name, account number, and IFSC code' });
      }
      description = `Withdrawal to Bank: Name: ${bankUserName}, A/C: ${accountNumber}, IFSC: ${ifscCode}`;
    } else {
      return res.status(400).json({ success: false, message: 'Please provide target payout details (UPI ID or Bank Details)' });
    }

    // Gather latest balance
    await collectEarnings(req.user._id);
    const user = await User.findById(req.user._id);

    if (user.walletBalance < wdrAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Deduct balance
    user.walletBalance = Number((user.walletBalance - wdrAmount).toFixed(2));
    await user.save();

    // Create a transaction
    const transaction = await Transaction.create({
      userId: req.user._id,
      amount: wdrAmount,
      type: 'withdraw',
      status: 'pending',
      description,
    });

    // Also create a Withdrawal document in withdrawals collection for the Admin panel to read
    try {
      const mongoose = require('mongoose');
      await mongoose.connection.db.collection('withdrawals').insertOne({
        user: req.user._id,
        amount: Number(wdrAmount),
        upiId: upiId || description,
        status: 'Pending',
        requestDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (dbErr) {
      console.error('Failed to sync withdrawal to admin DB:', dbErr);
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

    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: transactions,
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

// @desc    Get all pending deposit requests (Admin only)
// @route   GET /api/wallet/admin/pending-deposits
// @access  Private/Admin
exports.getAllPendingDeposits = async (req, res) => {
  try {
    const transactions = await Transaction.find({ type: 'deposit', status: 'pending' })
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
    const txId = req.params.id;
    const transaction = await Transaction.findById(txId);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Transaction is already processed' });
    }

    // Approve transaction
    transaction.status = 'completed';
    await transaction.save();

    // Update depositor's wallet balance
    const user = await User.findById(transaction.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Depositing user not found' });
    }
    user.walletBalance = Number((user.walletBalance + transaction.amount).toFixed(2));
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Deposit verified and user wallet credited successfully!',
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
