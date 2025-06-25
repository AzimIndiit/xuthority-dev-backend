const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure a user can only follow another user once
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Index for efficient lookups
followSchema.index({ follower: 1 });
followSchema.index({ following: 1 });

module.exports = mongoose.model('Follow', followSchema); 