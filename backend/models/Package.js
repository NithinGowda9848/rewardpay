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
      required: false,
    },
    validityDays: {
      type: Number,
      required: false,
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
    category: {
      type: String,
      default: 'Solar',
    },
    hourlyProfit: {
      type: Number,
      default: 0,
    },
    validityHours: {
      type: Number,
      default: 0,
    },
    maxPurchaseLimit: {
      type: Number,
      default: 10,
    },
    vipRequirement: {
      type: String,
      default: 'Starter',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

PackageSchema.pre('save', function (next) {
  // If hourlyProfit is set but dailyEarnings is not, compute it
  if (this.hourlyProfit !== undefined && this.hourlyProfit > 0 && !this.dailyEarnings) {
    this.dailyEarnings = Number((this.hourlyProfit * 24).toFixed(2));
  } else if (this.dailyEarnings !== undefined && this.dailyEarnings > 0 && !this.hourlyProfit) {
    this.hourlyProfit = Number((this.dailyEarnings / 24).toFixed(4));
  }

  // Validity conversion
  if (this.validityHours !== undefined && this.validityHours > 0 && !this.validityDays) {
    this.validityDays = Math.ceil(this.validityHours / 24);
  } else if (this.validityDays !== undefined && this.validityDays > 0 && !this.validityHours) {
    this.validityHours = this.validityDays * 24;
  }

  // VIP Requirement mapping
  if (this.vipRequirement !== undefined && this.vipRequirement !== null) {
    const vipMatch = this.vipRequirement.match(/\d+/);
    this.vipLevel = vipMatch ? parseInt(vipMatch[0], 10) : 0;
  } else if (this.vipLevel !== undefined) {
    this.vipRequirement = this.vipLevel === 0 ? 'Starter' : `VIP ${this.vipLevel}`;
  }

  // Max copies conversion
  if (this.maxPurchaseLimit !== undefined) {
    this.maxCopies = this.maxPurchaseLimit;
  } else if (this.maxCopies !== undefined) {
    this.maxPurchaseLimit = this.maxCopies;
  }

  next();
});

module.exports = mongoose.model('Package', PackageSchema);
