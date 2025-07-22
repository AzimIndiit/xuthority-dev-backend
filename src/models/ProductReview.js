const mongoose = require('mongoose');
const keyword = require('keyword-extractor');
const natural = require('natural');

const productReviewSchema = new mongoose.Schema({
  // Basic Review Information
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Overall Rating (1-5 stars)
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    index: true
  },

  // Review Content
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxLength: 5000
  },

  // Sub-ratings for different aspects (0 = N/A, 1-7 = actual ratings)
  subRatings: {
    easeOfUse: {
      type: Number,
      min: 0,
      max: 7,
      default: 0 // 0 represents N/A
    },
    customerSupport: {
      type: Number,
      min: 0,
      max: 7,
      default: 0
    },
    features: {
      type: Number,
      min: 0,
      max: 7,
      default: 0
    },
    pricing: {
      type: Number,
      min: 0,
      max: 7,
      default: 0
    },
    technicalSupport: {
      type: Number,
      min: 0,
      max: 7,
      default: 0
    }
  },

  // Verification Status
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationType: {
      type: String,
      enum: ['company_email', 'linkedin', 'vendor_invite', 'screenshot'],
      default: null
    },
    verificationData: {
      type: mongoose.Schema.Types.Mixed, // Store verification specific data
      default: null
    },
    verifiedAt: {
      type: Date,
      default: null
    }
  },

  // Review Status & Moderation
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'approved',
    index: true
  },

  // Engagement Metrics
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

  // Reply Metrics
  totalReplies: {
    type: Number,
    default: 0,
    min: 0
  },

  

  reviewSource: {
    type: String,
  },

  // Keywords and Popular Mentions (extracted from title + content)
  keywords: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  mentions: [{
    type: String,
    lowercase: true,
    trim: true
  }],

  // Metadata for file attachments and additional review data
  metaData: {
    // File attachment information
    attachments: [{
      fileName: {
        type: String,
        trim: true,
        maxLength: 255
      },
      fileUrl: {
        type: String,
        trim: true,
        maxLength: 500
      },
      fileType: {
        type: String,
        trim: true,
        maxLength: 50
      },
      fileSize: {
        type: Number,
        min: 0
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    // Additional metadata
    reviewVersion: {
      type: String,
      default: '1.0'
    },
    sourceInfo: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    customFields: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },

  // Soft Delete Fields
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null,
    index: true
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  publishedAt: {
    type: Date,
    default: null,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
productReviewSchema.index({ product: 1, overallRating: -1 });
productReviewSchema.index({ product: 1, submittedAt: -1 });
productReviewSchema.index({ product: 1, status: 1, publishedAt: -1 });
// Partial unique index for reviewer-product combination (only applies to non-deleted reviews)
productReviewSchema.index(
  { reviewer: 1, product: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { isDeleted: false },
    name: 'reviewer_1_product_1_partial'
  }
);
productReviewSchema.index({ 'verification.isVerified': 1, status: 1 });
productReviewSchema.index({ keywords: 1 });
productReviewSchema.index({ mentions: 1 });
productReviewSchema.index({ product: 1, keywords: 1 });
productReviewSchema.index({ product: 1, mentions: 1 });
// Soft delete indexes
productReviewSchema.index({ isDeleted: 1, status: 1, publishedAt: -1 });
productReviewSchema.index({ product: 1, isDeleted: 1, status: 1 });

// Virtual for calculated average of sub-ratings
productReviewSchema.virtual('subRatingsAverage').get(function() {
  const ratings = this.subRatings;
  const validRatings = Object.values(ratings).filter(rating => rating > 0); // Exclude 0 (N/A) values
  
  if (validRatings.length === 0) return null;
  
  const sum = validRatings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / validRatings.length) * 10) / 10; // Round to 1 decimal place
});

// Virtual for reviewer display name
productReviewSchema.virtual('reviewerDisplayName').get(function() {
  if (this.reviewerInfo && this.reviewerInfo.companyName && this.reviewerInfo.jobTitle) {
    return `${this.reviewerInfo.jobTitle}, ${this.reviewerInfo.companyName}`;
  }
  return 'Verified User';
});

// Pre-save middleware to extract keywords and mentions
productReviewSchema.pre('save', function(next) {
  if (this.isModified('title') || this.isModified('content')) {
    this.extractKeywordsAndMentions();
  }
  next();
});

// Pre-save middleware to update product average rating and total reviews
productReviewSchema.post('save', async function(doc) {
  if (doc.status === 'approved' && doc.publishedAt) {
    await updateProductAggregateRatings(doc.product);
  }
});

// Pre-remove middleware
productReviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc && doc.status === 'approved') {
    await updateProductAggregateRatings(doc.product);
  }
});

// Helper function to update product aggregate ratings
async function updateProductAggregateRatings(productId) {
  const Product = mongoose.model('Product');
  const ProductReview = mongoose.model('ProductReview');
  
  const aggregateData = await ProductReview.aggregate([
    {
      $match: {
        product: productId,
        status: 'approved',
        publishedAt: { $ne: null },
        isDeleted: false // Exclude soft-deleted reviews
      }
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$overallRating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$overallRating'
        }
      }
    }
  ]);

  const result = aggregateData[0] || { avgRating: 0, totalReviews: 0, ratingDistribution: [] };
  
  // Calculate rating distribution
  const distribution = {
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0
  };
  
  result.ratingDistribution.forEach(rating => {
    distribution[rating] = (distribution[rating] || 0) + 1;
  });

  await Product.findByIdAndUpdate(productId, {
    avgRating: Math.round((result.avgRating || 0) * 10) / 10, // Round to 1 decimal, handle null
    totalReviews: result.totalReviews,
    ratingDistribution: distribution
  });
}

// Instance method to extract keywords and mentions
productReviewSchema.methods.extractKeywordsAndMentions = function() {
  const text = `${this.title} ${this.content}`.toLowerCase();
  
  // Extract keywords using keyword-extractor
  const extractedKeywords = keyword.extract(text, {
    language: 'english',
    remove_digits: true,
    return_changed_case: true,
    remove_duplicates: true,
    return_chained_words: true
  });

  // Common software/business terms to prioritize as mentions
  const businessTerms = [
    'automation', 'integration', 'workflow', 'dashboard', 'analytics', 
    'reporting', 'api', 'security', 'scalability', 'user-friendly',
    'customization', 'support', 'pricing', 'features', 'performance',
    'reliable', 'efficient', 'intuitive', 'flexible', 'robust',
    'collaboration', 'productivity', 'crm', 'erp', 'saas',
    'cloud', 'mobile', 'interface', 'deployment', 'maintenance'
  ];

  // Filter and categorize keywords
  const filteredKeywords = extractedKeywords
    .filter(word => word.length >= 3 && word.length <= 20)
    .slice(0, 15); // Limit to 15 keywords

  // Extract mentions (priority business terms + high-frequency words)
  const mentions = filteredKeywords
    .filter(word => 
      businessTerms.includes(word) || 
      (text.split(word).length - 1) >= 2 // Word appears at least twice
    )
    .slice(0, 10); // Limit to 10 mentions

  this.keywords = filteredKeywords;
  this.mentions = mentions;
};

// Static method to get popular mentions for a product
productReviewSchema.statics.getPopularMentions = async function(productId, limit = 10) {
  const pipeline = [
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        status: 'approved',
        publishedAt: { $ne: null },
        isDeleted: false
      }
    },
    {
      $unwind: '$mentions'
    },
    {
      $group: {
        _id: '$mentions',
        count: { $sum: 1 },
        avgRating: { $avg: '$overallRating' }
      }
    },
    {
      $match: {
        count: { $gte: 2 } // Only mentions that appear at least twice
      }
    },
    {
      $sort: { count: -1, avgRating: -1 }
    },
    {
      $limit: limit
    },
    {
      $project: {
        mention: '$_id',
        count: 1,
        avgRating: { $round: ['$avgRating', 1] },
        _id: 0
      }
    }
  ];

  return await this.aggregate(pipeline);
};

// Static methods
productReviewSchema.statics.getReviewStats = async function(productId) {
  return await this.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        status: 'approved',
        publishedAt: { $ne: null },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$overallRating' },
        totalReviews: { $sum: 1 },
        // Average sub-ratings (only for ratings > 0 to exclude N/A values)
        avgEaseOfUse: { 
          $avg: { 
            $cond: [{ $gt: ['$subRatings.easeOfUse', 0] }, '$subRatings.easeOfUse', null] 
          }
        },
        avgCustomerSupport: { 
          $avg: { 
            $cond: [{ $gt: ['$subRatings.customerSupport', 0] }, '$subRatings.customerSupport', null] 
          }
        },
        avgFeatures: { 
          $avg: { 
            $cond: [{ $gt: ['$subRatings.features', 0] }, '$subRatings.features', null] 
          }
        },
        avgPricing: { 
          $avg: { 
            $cond: [{ $gt: ['$subRatings.pricing', 0] }, '$subRatings.pricing', null] 
          }
        },
        avgTechnicalSupport: { 
          $avg: { 
            $cond: [{ $gt: ['$subRatings.technicalSupport', 0] }, '$subRatings.technicalSupport', null] 
          }
        },
        ratingDistribution: {
          $push: '$overallRating'
        }
      }
    },
    {
      $project: {
        _id: 0,
        avgRating: 1,
        totalReviews: 1,
        avgSubRatings: {
          easeOfUse: '$avgEaseOfUse',
          customerSupport: '$avgCustomerSupport',
          features: '$avgFeatures',
          pricing: '$avgPricing',
          technicalSupport: '$avgTechnicalSupport'
        },
        ratingDistribution: 1
      }
    }
  ]);
};

// Static methods for soft delete handling
productReviewSchema.statics.findActive = function(filter = {}) {
  return this.find({ ...filter, isDeleted: false });
};

productReviewSchema.statics.findActiveWithPopulate = function(filter = {}, populateOptions = []) {
  let query = this.find({ ...filter, isDeleted: false });
  if (populateOptions.length > 0) {
    query = query.populate(populateOptions);
  }
  return query;
};

productReviewSchema.statics.countActive = function(filter = {}) {
  return this.countDocuments({ ...filter, isDeleted: false });
};

productReviewSchema.statics.findByIdActive = function(id) {
  return this.findOne({ _id: id, isDeleted: false });
};

// Instance method for soft delete
productReviewSchema.methods.softDelete = async function(deletedByUserId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedByUserId;
  
  // Save the review first
  await this.save();
  
  // Update product statistics only if the review was approved and published
  if (this.status === 'approved' && this.publishedAt) {
    await updateProductAggregateRatings(this.product);
  }
  
  return this;
};

// Instance method to restore soft deleted review
productReviewSchema.methods.restore = async function() {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = null;
  
  // Save the review first
  await this.save();
  
  // Update product statistics only if the review is approved and published
  if (this.status === 'approved' && this.publishedAt) {
    await updateProductAggregateRatings(this.product);
  }
  
  return this;
};

module.exports = mongoose.model('ProductReview', productReviewSchema); 