const mongoose = require('mongoose');

const communityAnswerSchema = new mongoose.Schema({
  // Answer Content
  content: {
    type: String,
    required: true,
    trim: true,
    maxLength: 10000
  },

  // Question Reference
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityQuestion',
    required: true,
    index: true
  },

  // Answer Author
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Answer Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'edited'],
    default: 'approved',
    index: true
  },

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
communityAnswerSchema.index({ question: 1, createdAt: -1 });
communityAnswerSchema.index({ author: 1, createdAt: -1 });
communityAnswerSchema.index({ status: 1, createdAt: -1 });
communityAnswerSchema.index({ question: 1, status: 1, createdAt: -1 });

// Pre-save middleware to update question's totalAnswers and lastActivity
communityAnswerSchema.post('save', async function(doc) {
  if (doc.status === 'approved') {
    await updateQuestionMetrics(doc.question);
  }
});

// Pre-remove middleware
communityAnswerSchema.post('findOneAndDelete', async function(doc) {
  if (doc && doc.status === 'approved') {
    await updateQuestionMetrics(doc.question);
  }
});

// Helper function to update question metrics
async function updateQuestionMetrics(questionId) {
  const CommunityQuestion = mongoose.model('CommunityQuestion');
  const CommunityAnswer = mongoose.model('CommunityAnswer');
  
  const [answerCount, lastAnswer] = await Promise.all([
    CommunityAnswer.countDocuments({ 
      question: questionId, 
      status: 'approved' 
    }),
    CommunityAnswer.findOne({ 
      question: questionId, 
      status: 'approved' 
    }).sort({ createdAt: -1 }).select('author createdAt')
  ]);

  const updateData = {
    totalAnswers: answerCount
  };

  if (lastAnswer) {
    updateData.lastActivityAt = lastAnswer.createdAt;
    updateData.lastActivityBy = lastAnswer.author;
  }

  await CommunityQuestion.findByIdAndUpdate(questionId, updateData);
}

module.exports = mongoose.model('CommunityAnswer', communityAnswerSchema);