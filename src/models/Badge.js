const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    maxlength: 100
  },
  icon: { 
    type: String, 
    required: true, 
    trim: true,
    default: ''
  },
  colorCode: { 
    type: String, 
    required: true, 
    trim: true,
    default: '#3B82F6'
  },
  description: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 500
  },
  criteria: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true
  },
  // Count of users who have earned this badge
  earnedBy: {
    type: Number,
    default: 0,
    min: 0
  },
  // Admin who created the badge
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  },
  // Admin who last updated the badge  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
badgeSchema.index({ title: 1 });
badgeSchema.index({ status: 1 });
badgeSchema.index({ createdAt: -1 });
badgeSchema.index({ earnedBy: -1 });

// Virtual for user badge requests count
badgeSchema.virtual('requestsCount', {
  ref: 'UserBadge',
  localField: '_id',
  foreignField: 'badgeId',
  count: true,
  match: { status: 'requested' }
});

// Method to increment earned count
badgeSchema.methods.incrementEarnedBy = async function() {
  this.earnedBy += 1;
  return this.save();
};

// Method to decrement earned count
badgeSchema.methods.decrementEarnedBy = async function() {
  if (this.earnedBy > 0) {
    this.earnedBy -= 1;
    return this.save();
  }
  return this;
};

// Static method to get active badges
badgeSchema.statics.getActiveBadges = function() {
  return this.find({ status: 'active' }).sort({ createdAt: -1 });
};

// Static method to search badges
badgeSchema.statics.searchBadges = function(searchTerm) {
  const searchRegex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { title: { $regex: searchRegex } },
      { description: { $regex: searchRegex } }
    ]
  });
};

module.exports = mongoose.model('Badge', badgeSchema); 