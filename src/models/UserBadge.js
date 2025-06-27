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
    enum: ['requested', 'accepted', 'canceled'],
    default: 'requested',
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

module.exports = mongoose.model('UserBadge', userBadgeSchema); 