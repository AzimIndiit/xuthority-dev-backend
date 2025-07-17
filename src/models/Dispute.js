const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductReview',
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'false-or-misleading-information',
      'spam-or-fake-review',
      'inappropriate-content',
      'conflict-of-interest',
      'other'
    ]
  },
  description: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 2000,
    trim: true
  },
  explanations: [{
    content: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 2000,
      trim: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'resolved'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
disputeSchema.index({ vendor: 1, status: 1 });
disputeSchema.index({ review: 1, vendor: 1 }, { unique: true }); // One dispute per vendor per review

// Virtual for populated data
disputeSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Static methods
disputeSchema.statics.getDisputesByVendor = async function(vendorId, options = {}) {
  const {
    page = 1,
    limit = 10,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const filter = { vendor: vendorId };
  if (status) {
    filter.status = status;
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (page - 1) * limit;

  const disputes = await this.find(filter)
    .populate([
      { path: 'review', select: 'title content overallRating reviewer', populate: { path: 'reviewer', select: 'firstName lastName avatar slug title companyName companySize isVerified' } },
      { path: 'product', select: 'name slug isActive logoUrl createdAt' },
      { path: 'explanations.author', select: 'firstName lastName avatar' }
    ])
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await this.countDocuments(filter);

  return {
    disputes,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    }
  };
};

module.exports = mongoose.model('Dispute', disputeSchema);