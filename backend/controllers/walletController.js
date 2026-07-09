const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
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
      amount,
      type: 'deposit',
      status: 'Pending',
      description: `Deposit via UPI (UTR: ${utr})`,
      utr,
      screenshot,
      paymentTime,
    });

    // Also create a Deposit document in deposits collection for the Admin panel to read
    try {
      await Deposit.create({
        user: req.user._id,
        amount: Number(amount),
        utrNumber: utr,
        screenshot: screenshot,
        status: 'Pending',
        paymentTime,
        date: new Date()
      });
    } catch (dbErr) {
      console.error('Failed to sync deposit to admin DB:', dbErr);
    }

    res.status(201).json({
      success: true,
      message: 'Deposit Request Submitted Successfully.',
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
        amount: Number(wdrAmount),
        upiId: method === 'upi' ? upiId : undefined,
        bankName: method === 'bank' ? bankName : undefined,
        bankUserName: method === 'bank' ? bankUserName : undefined,
        accountNumber: method === 'bank' ? accountNumber : undefined,
        ifscCode: method === 'bank' ? ifscCode : undefined,
        status: 'Pending',
        requestDate: new Date()
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

// @desc    Get all pending transaction requests (Admin only)
// @route   GET /api/wallet/admin/pending
// @access  Private/Admin
exports.adminGetAllPending = async (req, res) => {
  try {
    const transactions = await Transaction.find({ status: { $in: ['Pending', 'pending'] } })
      .populate('userId', 'username email mobile name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: transactions,
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
    const txId = req.params.id;
    const { adminRemark } = req.body;
    const transaction = await Transaction.findById(txId);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.status !== 'Pending' && transaction.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Transaction is already processed' });
    }

    // Approve transaction
    transaction.status = 'Approved';
    transaction.adminRemark = adminRemark || 'Approved by Admin';
    await transaction.save();

    // Update depositor's wallet balance
    const user = await User.findById(transaction.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Depositing user not found' });
    }
    user.walletBalance = Number((user.walletBalance + transaction.amount).toFixed(2));
    await user.save();

    // Update synchronized Deposit document
    try {
      await Deposit.findOneAndUpdate(
        { utrNumber: transaction.utr },
        { status: 'Approved', adminRemark: adminRemark || 'Approved by Admin' }
      );
    } catch (dbErr) {
      console.error('Failed to update Deposit document:', dbErr);
    }

    res.status(200).json({
      success: true,
      message: 'Deposit verified and user wallet credited successfully!',
      data: transaction,
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
    const txId = req.params.id;
    const { adminRemark } = req.body;
    const transaction = await Transaction.findById(txId);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.status !== 'Pending' && transaction.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Transaction is already processed' });
    }

    // Reject transaction
    transaction.status = 'Rejected';
    transaction.adminRemark = adminRemark || 'Rejected by Admin';
    await transaction.save();

    // Update synchronized Deposit document
    try {
      await Deposit.findOneAndUpdate(
        { utrNumber: transaction.utr },
        { status: 'Rejected', adminRemark: adminRemark || 'Rejected by Admin' }
      );
    } catch (dbErr) {
      console.error('Failed to update Deposit document:', dbErr);
    }

    res.status(200).json({
      success: true,
      message: 'Deposit request rejected successfully!',
      data: transaction,
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
    const txId = req.params.id;
    const { adminRemark } = req.body;
    const transaction = await Transaction.findById(txId);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.status !== 'Pending' && transaction.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Transaction is already processed' });
    }

    // Deduct amount from wallet balance
    const user = await User.findById(transaction.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.walletBalance < transaction.amount) {
      return res.status(400).json({ success: false, message: 'User has insufficient balance to complete this withdrawal' });
    }

    user.walletBalance = Number((user.walletBalance - transaction.amount).toFixed(2));
    await user.save();

    // Approve transaction
    transaction.status = 'Paid';
    transaction.adminRemark = adminRemark || 'Approved and Paid';
    await transaction.save();

    // Update synchronized Withdrawal document
    try {
      await Withdrawal.findOneAndUpdate(
        { user: transaction.userId, amount: transaction.amount, status: 'Pending' },
        { status: 'Paid', adminRemark: adminRemark || 'Approved and Paid' }
      );
    } catch (dbErr) {
      console.error('Failed to update Withdrawal document:', dbErr);
    }

    res.status(200).json({
      success: true,
      message: 'Withdrawal approved and balance deducted!',
      data: transaction,
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
    const txId = req.params.id;
    const { adminRemark } = req.body;
    const transaction = await Transaction.findById(txId);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.status !== 'Pending' && transaction.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Transaction is already processed' });
    }

    // Reject transaction
    transaction.status = 'Rejected';
    transaction.adminRemark = adminRemark || 'Rejected by Admin';
    await transaction.save();

    // Update synchronized Withdrawal document
    try {
      await Withdrawal.findOneAndUpdate(
        { user: transaction.userId, amount: transaction.amount, status: 'Pending' },
        { status: 'Rejected', adminRemark: adminRemark || 'Rejected by Admin' }
      );
    } catch (dbErr) {
      console.error('Failed to update Withdrawal document:', dbErr);
    }

    res.status(200).json({
      success: true,
      message: 'Withdrawal request rejected successfully!',
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
