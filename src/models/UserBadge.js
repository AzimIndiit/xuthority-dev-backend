const mongoose = require('mongoose');

const userBadgeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  badgeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge',
    required: true,
    index: true
  },
  reason: { type: String, trim: true },
  status: {
    type: String,
    enum: ['requested', 'approved', 'rejected', 'canceled'],
    default: 'requested',
    index: true
  },
  // Approval fields
  approvedAt: {
    type: Date,
    index: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  // Rejection fields
  rejectedAt: {
    type: Date,
    index: true
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });
userBadgeSchema.index({ status: 1, createdAt: -1 });
userBadgeSchema.index({ userId: 1, status: 1 });

// Virtual field for request date (alias for createdAt)
userBadgeSchema.virtual('requestedAt').get(function() {
  return this.createdAt;
});

module.exports = mongoose.model('UserBadge', userBadgeSchema); 