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
      enum: ['deposit', 'withdraw', 'purchase', 'reward', 'referral', 'Deposit', 'Withdrawal', 'Investment', 'Reward', 'Referral Commission'],
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'failed', 'Pending', 'Approved', 'Rejected', 'Paid', 'Completed', 'Failed'],
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
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
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

TransactionSchema.pre('save', function (next) {
  if (!this.transactionId) {
    const prefix = this.type ? this.type.substring(0, 3).toUpperCase() : 'TX';
    this.transactionId = `${prefix}${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
  }
  next();
});

module.exports = mongoose.model('Transaction', TransactionSchema);
