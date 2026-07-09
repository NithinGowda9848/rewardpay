const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please provide transaction amount'],
    },
    type: {
      type: String,
      required: true,
      enum: ['deposit', 'withdraw', 'purchase', 'reward', 'referral'],
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'failed', 'Pending', 'Approved', 'Rejected', 'Paid'],
      default: 'Pending',
    },
    description: {
      type: String,
      trim: true,
    },
    utr: {
      type: String,
      trim: true,
    },
    screenshot: {
      type: String,
      trim: true,
    },
    paymentTime: {
      type: String,
      trim: true,
    },
    adminRemark: {
      type: String,
      trim: true,
    },
    bankDetails: {
      bankName: { type: String, trim: true },
      bankUserName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifscCode: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Transaction', TransactionSchema);
