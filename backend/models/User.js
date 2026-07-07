const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    mobile: {
      type: String,
      unique: true,
      sparse: true,
      required: false,
      trim: true,
    },
    isMobileVerified: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: false, // Optional for Google OAuth users
      minlength: 6,
      select: false, // Don't return password by default
    },
    walletBalance: {
      type: Number,
      default: 0.0,
    },
    totalEarnings: {
      type: Number,
      default: 0.0,
    },
    todayEarnings: {
      type: Number,
      default: 0.0,
    },
    referralCode: {
      type: String,
      unique: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Backfill username if missing (for legacy records compatibility)
UserSchema.pre('save', async function (next) {
  if (!this.username) {
    let base = (this.email ? this.email.split('@')[0] : this.name ? this.name.replace(/\s+/g, '') : 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!base) base = 'user';
    
    let checkUsername = base;
    let count = 1;
    let exists = true;
    while (exists) {
      const User = mongoose.model('User');
      const dupe = await User.findOne({ username: checkUsername });
      if (!dupe || dupe._id.equals(this._id)) {
        exists = false;
      } else {
        checkUsername = `${base}${count}`;
        count++;
      }
    }
    this.username = checkUsername;
  }
  next();
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (this.password && !this.isModified('password')) {
    return next();
  }
  if (!this.password) {
    return next(); // Google OAuth users don't have passwords to hash
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
