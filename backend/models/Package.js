const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    dailyEarnings: {
      type: Number,
      required: true,
    },
    validityDays: {
      type: Number,
      required: true,
    },
    tag: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: 'FaGem',
    },
    image: {
      type: String,
      default: '',
    },
    vipLevel: {
      type: Number,
      default: 0,
    },
    maxCopies: {
      type: Number,
      default: 10,
    },
    date: {
      type: String,
      default: '2026-06-04',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Package', PackageSchema);
