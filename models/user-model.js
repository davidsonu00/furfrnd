const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  cart: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  orders: {
    type: Array,
    default: []
  },
  contact: {
    type: Number
  },
  picture: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifyOtp: {
    type: String
  },
  verifyOtpExpiry: {
    type: Date
  },
  resetOtp: {
    type: String
  },
  resetOtpExpiry: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('user', userSchema);