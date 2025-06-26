const mongoose = require('mongoose');

const communityQuestionSchema = new mongoose.Schema({
  // Basic Question Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 1000
  },
 
  
  // Question Author
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Product Context (optional - questions can be about specific products)
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },

  

  // Question Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'closed'],
    default: 'approved'
  },

  

  // Engagement Metrics
  totalAnswers: {
    type: Number,
    default: 0,
    min: 0
  },
  
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
communityQuestionSchema.index({ createdAt: -1 });
communityQuestionSchema.index({ author: 1, createdAt: -1 });
communityQuestionSchema.index({ product: 1, createdAt: -1 });
communityQuestionSchema.index({ status: 1 });
communityQuestionSchema.index({ title: 'text' });

// Virtual for recent answers (used in listings)
communityQuestionSchema.virtual('recentAnswers', {
  ref: 'CommunityAnswer',
  localField: '_id',
  foreignField: 'question',
  options: {
    sort: { createdAt: -1 },
    limit: 3,
    populate: {
      path: 'author',
      select: 'firstName lastName avatar'
    }
  }
});

// Virtual for answer count verification
communityQuestionSchema.virtual('answerCount').get(function() {
  return this.totalAnswers;
});




communityQuestionSchema.statics.getQuestionsWithRecentAnswers = async function(query = {}, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'lastActivityAt',
    sortOrder = -1,
    status = 'approved'
  } = options;

  const skip = (page - 1) * limit;
  
  const matchQuery = {
    status,
    ...query
  };

  const pipeline = [
    { $match: matchQuery },
    {
      $lookup: {
        from: 'communityanswers',
        let: { questionId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$question', '$$questionId'] },
              status: 'approved'
            }
          },
          { $sort: { createdAt: -1 } },
          { $limit: 3 },
          {
            $lookup: {
              from: 'users',
              localField: 'author',
              foreignField: '_id',
              as: 'author',
              pipeline: [
                {
                  $project: {
                    firstName: 1,
                    lastName: 1,
                    avatar: 1,
                    email: 1
                  }
                }
              ]
            }
          },
          {
            $unwind: {
              path: '$author',
              preserveNullAndEmptyArrays: true
            }
          }
        ],
        as: 'recentAnswers'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author',
        pipeline: [
          {
            $project: {
              firstName: 1,
              lastName: 1,
              avatar: 1,
              email: 1
            }
          }
        ]
      }
    },
    {
      $unwind: {
        path: '$author',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'product',
        pipeline: [
          {
            $project: {
              name: 1,
              slug: 1,
              logoUrl: 1
            }
          }
        ]
      }
    },
    {
      $unwind: {
        path: '$product',
        preserveNullAndEmptyArrays: true
      }
    },
    { $sort: { [sortBy]: sortOrder } },
    { $skip: skip },
    { $limit: parseInt(limit) }
  ];

  const [questions, totalCount] = await Promise.all([
    this.aggregate(pipeline),
    this.countDocuments(matchQuery)
  ]);

  return {
    questions,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(totalCount / limit),
      total: totalCount,
      limit: parseInt(limit)
    }
  };
};

module.exports = mongoose.model('CommunityQuestion', communityQuestionSchema); 