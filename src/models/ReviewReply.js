const mongoose = require('mongoose');

const reviewReplySchema = new mongoose.Schema({
  // Reference to the original review
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductReview',
    required: true,
    index: true
  },

  // Author of the reply
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Reply content
  content: {
    type: String,
    required: true,
    trim: true,
    minLength: 3,
    maxLength: 2000
  },

  // Moderation status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'approved',
    index: true
  },

  // Helpful votes for replies
  helpfulVotes: {
    count: {
      type: Number,
      default: 0,
      min: 0
    },
    voters: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },


  // Reply metadata
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
reviewReplySchema.index({ review: 1, createdAt: -1 });
reviewReplySchema.index({ author: 1, createdAt: -1 });
reviewReplySchema.index({ review: 1, status: 1 });
reviewReplySchema.index({ status: 1, createdAt: -1 });



// Pre-save middleware to update timestamps
reviewReplySchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
    if (this.isModified('content')) {
      this.isEdited = true;
      this.editedAt = new Date();
    }
  }
  next();
});

// Post-save middleware to update review reply count
reviewReplySchema.post('save', async function(doc) {
  if (doc.status === 'approved') {
    await updateReviewReplyCount(doc.review);
  }
});

// Post-remove middleware to update review reply count
reviewReplySchema.post('findOneAndDelete', async function(doc) {
  if (doc && doc.status === 'approved') {
    await updateReviewReplyCount(doc.review);
  }
});

// Post-update middleware to handle status changes
reviewReplySchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    await updateReviewReplyCount(doc.review);
  }
});

// Helper function to update review reply count
async function updateReviewReplyCount(reviewId) {
  const ProductReview = mongoose.model('ProductReview');
  const ReviewReply = mongoose.model('ReviewReply');
  
  const approvedRepliesCount = await ReviewReply.countDocuments({
    review: reviewId,
    status: 'approved'
  });

  await ProductReview.findByIdAndUpdate(reviewId, {
    totalReplies: approvedRepliesCount
  });
}

// Static method to get replies for a review with pagination
reviewReplySchema.statics.getRepliesForReview = async function(reviewId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'asc',
    status = 'approved'
  } = options;

  const skip = (page - 1) * limit;
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const filter = {
    review: reviewId,
    status
  };

  const replies = await this.find(filter)
    .populate([
      { 
        path: 'author', 
        select: 'firstName lastName email  avatar' 
      }
    ])
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await this.countDocuments(filter);

  return {
    replies,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
};


module.exports = mongoose.model('ReviewReply', reviewReplySchema); 