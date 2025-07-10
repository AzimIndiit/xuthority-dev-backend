const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  otp: {
    type: String,
    required: true,
    length: 6
  },
  type: {
    type: String,
    enum: ['review_verification', 'password_reset', 'email_verification'],
    default: 'review_verification'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  
}, {
  timestamps: true
});

// Index for efficient queries
otpSchema.index({ email: 1, type: 1, expiresAt: 1 });
otpSchema.index({ email: 1, type: 1, isVerified: 1 });

// Auto-delete from collection using TTL index
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);