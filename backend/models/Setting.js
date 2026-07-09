const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  siteName: {
    type: String,
    default: 'Rewards Pay'
  },
  siteLogo: {
    type: String,
    default: '⚡'
  },
  siteDescription: {
    type: String,
    default: 'HYIP + MLM simulation platform'
  },
  minDeposit: {
    type: Number,
    default: 100
  },
  minWithdrawal: {
    type: Number,
    default: 300
  },
  maxWithdrawal: {
    type: Number,
    default: 10000
  },
  signupBonus: {
    type: Number,
    default: 50
  },
  level1Commission: {
    type: Number,
    default: 10 // 10%
  },
  level2Commission: {
    type: Number,
    default: 5 // 5%
  },
  level3Commission: {
    type: Number,
    default: 3 // 3%
  },
  level4Commission: {
    type: Number,
    default: 2 // 2%
  },
  upiQr: {
    type: String,
    default: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=pay@rewardspay'
  },
  upiId: {
    type: String,
    default: 'pay@rewardspay'
  },
  bankDetails: {
    bankName: { type: String, default: '' },
    accountHolderName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    branchName: { type: String, default: '' }
  },
  telegramLink: {
    type: String,
    default: ''
  },
  paymentInstructions: {
    type: String,
    default: '1. Scan the QR code or pay to the UPI ID.\n2. Note down the UTR/Transaction ID.\n3. Upload screenshot proof.'
  },
  notificationSettings: {
    bannerText: { type: String, default: '' },
    popupText: { type: String, default: '' },
    showBanner: { type: Boolean, default: true },
    showPopup: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Setting', settingSchema);
