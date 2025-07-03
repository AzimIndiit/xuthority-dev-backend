const { ReviewReply, ProductReview, User } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * Create a new reply to a review
 */
const createReply = async (reviewId, replyData, userId) => {
  try {
    // Check if the review exists and is approved
    const review = await ProductReview.findById(reviewId);
    if (!review) {
      throw new ApiError('Review not found', 'REVIEW_NOT_FOUND', 404);
    }

    if (review.status !== 'approved') {
      throw new ApiError('Cannot reply to non-approved reviews', 'REVIEW_NOT_APPROVED', 400);
    }

    // Create the reply
    const reply = new ReviewReply({
      review: reviewId,
      author: userId,
      content: replyData.content
    });

    await reply.save();

    // Populate author information
    await reply.populate([
      { path: 'author', select: 'firstName lastName email profilePicture slug' },
      { path: 'review', select: 'title' }
    ]);

    return ApiResponse.success(reply, 'Reply created successfully');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error creating reply', 'REPLY_CREATE_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Get replies for a specific review
 */
const getRepliesForReview = async (reviewId, queryParams) => {
  try {
    // Check if review exists
    const review = await ProductReview.findById(reviewId);
    if (!review) {
      throw new ApiError('Review not found', 'REVIEW_NOT_FOUND', 404);
    }

    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'asc',
      status = 'approved'
    } = queryParams;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      status
    };

    const result = await ReviewReply.getRepliesForReview(reviewId, options);

    return ApiResponse.success(
      result.replies,
      'Replies retrieved successfully',
      { 
        pagination: result.pagination,
        total: result.pagination.totalItems,
        reviewInfo: {
          id: review._id,
          title: review.title,
          totalReplies: review.totalReplies
        }
      }
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error retrieving replies', 'REPLIES_FETCH_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Get single reply by ID
 */
const getReplyById = async (replyId) => {
  try {
    const reply = await ReviewReply.findById(replyId)
      .populate([
        { path: 'author', select: 'firstName lastName email profilePicture avatar slug' },
        { path: 'review', select: 'title product', populate: { path: 'product', select: 'name' } }
      ]);

    if (!reply) {
      throw new ApiError('Reply not found', 'REPLY_NOT_FOUND', 404);
    }

    return ApiResponse.success(reply, 'Reply retrieved successfully');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error retrieving reply', 'REPLY_FETCH_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Update reply (only by author)
 */
const updateReply = async (replyId, updateData, userId) => {
  try {
    const reply = await ReviewReply.findById(replyId);

    if (!reply) {
      throw new ApiError('Reply not found', 'REPLY_NOT_FOUND', 404);
    }

    // Check if user is the author of the reply
    if (reply.author.toString() !== userId) {
      throw new ApiError('You can only update your own replies', 'UNAUTHORIZED_UPDATE', 403);
    }

    // Update the reply
    Object.assign(reply, updateData);
    const updatedReply = await reply.save();

    await updatedReply.populate([
      { path: 'author', select: 'firstName lastName email profilePicture avatar slug  ' },
      { path: 'review', select: 'title' }
    ]);

    return ApiResponse.success(updatedReply, 'Reply updated successfully');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error updating reply', 'REPLY_UPDATE_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Delete reply (by author or admin)
 */
const deleteReply = async (replyId, userId, userRole) => {
  try {
    const reply = await ReviewReply.findById(replyId);

    if (!reply) {
      throw new ApiError('Reply not found', 'REPLY_NOT_FOUND', 404);
    }

    // Check if user is the author or admin
    if (reply.author.toString() !== userId && userRole !== 'admin') {
      throw new ApiError('You can only delete your own replies', 'UNAUTHORIZED_DELETE', 403);
    }

    await ReviewReply.findByIdAndDelete(replyId);

    return ApiResponse.success(null, 'Reply deleted successfully');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error deleting reply', 'REPLY_DELETE_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Vote helpful on a reply
 */
const voteHelpful = async (replyId, userId) => {
  try {
    const reply = await ReviewReply.findById(replyId);

    if (!reply) {
      throw new ApiError('Reply not found', 'REPLY_NOT_FOUND', 404);
    }

    // Check if user already voted
    const existingVote = reply.helpfulVotes.voters.find(
      voter => voter.user.toString() === userId
    );

    if (existingVote) {
      throw new ApiError('You have already voted this reply as helpful', 'ALREADY_VOTED', 409);
    }

    // Add vote
    reply.helpfulVotes.voters.push({
      user: userId,
      votedAt: new Date()
    });
    reply.helpfulVotes.count = reply.helpfulVotes.voters.length;

    await reply.save();

    return ApiResponse.success(
      { 
        helpfulCount: reply.helpfulVotes.count,
        hasVoted: true
      }, 
      'Vote added successfully'
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error adding helpful vote', 'HELPFUL_VOTE_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Remove helpful vote from a reply
 */
const removeHelpfulVote = async (replyId, userId) => {
  try {
    const reply = await ReviewReply.findById(replyId);

    if (!reply) {
      throw new ApiError('Reply not found', 'REPLY_NOT_FOUND', 404);
    }

    // Check if user has voted
    const voteIndex = reply.helpfulVotes.voters.findIndex(
      voter => voter.user.toString() === userId
    );

    if (voteIndex === -1) {
      throw new ApiError('You have not voted this reply as helpful', 'VOTE_NOT_FOUND', 404);
    }

    // Remove vote
    reply.helpfulVotes.voters.splice(voteIndex, 1);
    reply.helpfulVotes.count = reply.helpfulVotes.voters.length;

    await reply.save();

    return ApiResponse.success(
      { 
        helpfulCount: reply.helpfulVotes.count,
        hasVoted: false
      }, 
      'Vote removed successfully'
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error removing helpful vote', 'HELPFUL_VOTE_REMOVE_ERROR', 500, { originalError: error.message });
  }
};



/**
 * Get all replies (admin only) with filtering
 */
const getAllReplies = async (queryParams) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = queryParams;

    const filter = {};

    // Add status filter
    if (status) {
      filter.status = status;
    }

    // Add search functionality
    if (search) {
      filter.content = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const replies = await ReviewReply.find(filter)
      .populate([
        { path: 'author', select: 'firstName lastName email avatar slug' },
        { path: 'review', select: 'title product', populate: { path: 'product', select: 'name' } }
      ])
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ReviewReply.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };

    return ApiResponse.success(
      replies,
      'Replies retrieved successfully',
      { pagination, total }
    );
  } catch (error) {
    throw new ApiError('Error retrieving replies', 'REPLIES_FETCH_ERROR', 500, { originalError: error.message });
  }
};



module.exports = {
  createReply,
  getRepliesForReview,
  getReplyById,
  updateReply,
  deleteReply,
  voteHelpful,
  removeHelpfulVote,
  getAllReplies
}; 