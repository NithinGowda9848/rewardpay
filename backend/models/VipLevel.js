const mongoose = require('mongoose');

const vipLevelSchema = new mongoose.Schema({
  levelName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  requiredEarnings: {
    type: Number,
    required: true,
    min: 0
  },
  requiredInvestment: {
    type: Number,
    required: true,
    min: 0
  },
  benefits: {
    type: [String],
    default: []
  },
  commissionRate: {
    type: Number, // Percentage value (e.g. 5 for 5%)
    required: true,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('VipLevel', vipLevelSchema);
