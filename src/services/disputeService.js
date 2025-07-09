const Dispute = require('../models/Dispute');
const ProductReview = require('../models/ProductReview');
const Product = require('../models/Product');
const ApiError = require('../utils/apiError');
const { createNotification } = require('../services/notificationService');

/**
 * Create a new dispute on a product review
 */
const createDispute = async (reviewId, vendorId, disputeData) => {
  try {
    // Check if review exists
    const review = await ProductReview.findById(reviewId).populate('product');
    if (!review) {
      throw new ApiError('Product review not found', 'REVIEW_NOT_FOUND', 404);
    }

    // Check if vendor owns the product
    if (review.product.userId.toString() !== vendorId.toString()) {
      throw new ApiError('You can only dispute reviews for your own products', 'NOT_PRODUCT_OWNER', 403);
    }

    // Check if dispute already exists for this review by this vendor
    const existingDispute = await Dispute.findOne({ 
      review: reviewId, 
      vendor: vendorId 
    });
    if (existingDispute) {
      throw new ApiError('You have already disputed this review', 'DISPUTE_ALREADY_EXISTS', 400);
    }

    // Create the dispute
    const dispute = new Dispute({
      review: reviewId,
      vendor: vendorId,
      product: review.product._id,
      reason: disputeData.reason,
      description: disputeData.description
    });

    await dispute.save();

    // Send notification to vendor
    await createNotification({
      userId: vendorId,
      type: 'REVIEW_DISPUTE',
      title: 'Review Dispute Status Update',
      message: 'Your review dispute has been created. Click here to see the outcome and any necessary actions.',
      meta: { disputeId: dispute._id, reviewId },
      actionUrl: `/product-detail/${review.product.slug}/disputes`
    });
    // Also notify the review author (user)
    if (review.reviewer) {
      await createNotification({
        userId: review.reviewer,
        type: 'REVIEW_DISPUTE',
        title: 'Your Review is Under Dispute',
        message: 'A vendor has disputed your review. You may be contacted for more information.',
        meta: { disputeId: dispute._id, reviewId },
        actionUrl: `/product-detail/${review.product.slug}/disputes`
      });
    }

    // Populate the created dispute
    return await Dispute.findById(dispute._id)
      .populate([
        { path: 'review', select: 'title content overallRating reviewer', populate: { path: 'reviewer', select: 'firstName lastName' } },
        { path: 'product', select: 'name slug' },
        { path: 'vendor', select: 'firstName lastName email' }
      ]);

  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to create dispute', 'CREATE_FAILED', 500);
  }
};

/**
 * Get disputes for a vendor with pagination
 */
const getVendorDisputes = async (vendorId, options = {}) => {
  try {
    return await Dispute.getDisputesByVendor(vendorId, options);
  } catch (error) {
    throw new ApiError('Failed to fetch disputes', 'FETCH_FAILED', 500);
  }
};

/**
 * Get a single dispute by ID
 */
const getDisputeById = async (disputeId, vendorId) => {
  try {
    const dispute = await Dispute.findOne({ _id: disputeId, vendor: vendorId })
      .populate([
        { path: 'review', select: 'title content overallRating reviewer', populate: { path: 'reviewer', select: 'firstName lastName' } },
        { path: 'product', select: 'name slug' },
        { path: 'vendor', select: 'firstName lastName email' },
        { path: 'explanations.author', select: 'firstName lastName avatar' }
      ]);

    if (!dispute) {
      throw new ApiError('Dispute not found', 'NOT_FOUND', 404);
    }

    return dispute;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to fetch dispute', 'FETCH_FAILED', 500);
  }
};

/**
 * Update a dispute
 */
const updateDispute = async (disputeId, vendorId, updateData) => {
  try {
    const dispute = await Dispute.findOne({ _id: disputeId, vendor: vendorId });
    
    if (!dispute) {
      throw new ApiError('Dispute not found', 'NOT_FOUND', 404);
    }

    // Update allowed fields
    const allowedUpdates = ['reason', 'description', 'status'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    });

    const updatedDispute = await Dispute.findByIdAndUpdate(
      disputeId,
      updates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'review', select: 'title content overallRating reviewer', populate: { path: 'reviewer', select: 'firstName lastName' } },
      { path: 'product', select: 'name slug' },
      { path: 'vendor', select: 'firstName lastName email' }
    ]);

    // Send notification to vendor on status update
    if (updates.status) {
      await createNotification({
        userId: vendorId,
        type: 'DISPUTE_STATUS_UPDATE',
        title: 'Review Dispute Status Update',
        message: 'Your review dispute status has been updated. Click here for details.',
        meta: { disputeId, status: updates.status },
        actionUrl: `/disputes/${disputeId}`
      });
      // Also notify the review author (user)
      if (dispute.review) {
        const review = await ProductReview.findById(dispute.review);
        if (review && review.reviewer) {
          await createNotification({
            userId: review.reviewer,
            type: 'DISPUTE_STATUS_UPDATE',
            title: 'Dispute Status Update on Your Review',
            message: 'A dispute involving your review has been updated. Click here for details.',
            meta: { disputeId, status: updates.status },
            actionUrl: `/disputes/${disputeId}`
          });
        }
      }
    }

    return updatedDispute;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to update dispute', 'UPDATE_FAILED', 500);
  }
};

/**
 * Delete a dispute
 */
const deleteDispute = async (disputeId, vendorId) => {
  try {
    const dispute = await Dispute.findOne({ _id: disputeId, vendor: vendorId });
    
    if (!dispute) {
      throw new ApiError('Dispute not found', 'NOT_FOUND', 404);
    }

    await Dispute.findByIdAndDelete(disputeId);
    return { message: 'Dispute deleted successfully' };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to delete dispute', 'DELETE_FAILED', 500);
  }
};

/**
 * Add explanation to a dispute
 */
const addExplanation = async (disputeId, userId, explanation) => {
  try {
    console.log('Adding explanation - disputeId:', disputeId, 'userId:', userId, 'explanation:', explanation);
    
    const dispute = await Dispute.findById(disputeId);
    console.log('Found dispute:', dispute ? 'Yes' : 'No');
    
    if (!dispute) {
      throw new ApiError('Dispute not found', 'NOT_FOUND', 404);
    }

    // Check if user is involved in the dispute (either vendor or review author)
    const review = await ProductReview.findById(dispute.review);
    console.log('Found review:', review ? 'Yes' : 'No');
    
    const isVendor = dispute.vendor.toString() === userId.toString();
    const isReviewAuthor = review && review.reviewer.toString() === userId.toString();
    console.log('User authorization - isVendor:', isVendor, 'isReviewAuthor:', isReviewAuthor);
    
    if (!isVendor && !isReviewAuthor) {
      throw new ApiError('You are not authorized to add explanations to this dispute', 'UNAUTHORIZED', 403);
    }

    // Initialize explanations array if it doesn't exist
    if (!dispute.explanations) {
      dispute.explanations = [];
    }

    // Add the explanation
    dispute.explanations.push({
      content: explanation,
      author: userId,
      createdAt: new Date()
    });

    console.log('Saving dispute with explanation...');
    await dispute.save();
    console.log('Dispute saved successfully');

    // Populate the updated dispute
    console.log('Populating updated dispute...');
    const updatedDispute = await Dispute.findById(disputeId)
      .populate([
        { path: 'review', select: 'title content overallRating reviewer', populate: { path: 'reviewer', select: 'firstName lastName avatar companyName companySize title' } },
        { path: 'product', select: 'name slug' },
        { path: 'vendor', select: 'firstName lastName email' },
        { path: 'explanations.author', select: 'firstName lastName avatar' }
      ]);
    console.log('Dispute populated successfully');

    // Send notification to the other party
    console.log('Sending notification...');
    const otherPartyId = isVendor ? review.reviewer : dispute.vendor;
    if (otherPartyId) {
      try {
        await createNotification({
          userId: otherPartyId,
          type: 'DISPUTE_EXPLANATION',
          title: 'New Explanation Added to Dispute',
          message: 'A new explanation has been added to a dispute you are involved in.',
          meta: { disputeId },
          actionUrl: `/disputes/${disputeId}`
        });
        console.log('Notification sent successfully');
      } catch (notificationError) {
        console.error('Notification error (non-blocking):', notificationError);
        // Don't throw error for notification failure
      }
    }

    console.log('Returning updated dispute');
    return updatedDispute;
  } catch (error) {
    console.error('Error in addExplanation:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to add explanation', 'ADD_EXPLANATION_FAILED', 500);
  }
};

/**
 * Update explanation in a dispute
 */
const updateExplanation = async (disputeId, explanationId, userId, explanation) => {
  try {
    console.log('Updating explanation - disputeId:', disputeId, 'explanationId:', explanationId, 'userId:', userId);
    
    const dispute = await Dispute.findById(disputeId);
    console.log('Found dispute:', dispute ? 'Yes' : 'No');
    
    if (!dispute) {
      throw new ApiError('Dispute not found', 'NOT_FOUND', 404);
    }

    // Find the explanation to update
    const explanationIndex = dispute.explanations.findIndex(
      exp => exp._id.toString() === explanationId
    );
    
    if (explanationIndex === -1) {
      throw new ApiError('Explanation not found', 'EXPLANATION_NOT_FOUND', 404);
    }

    const existingExplanation = dispute.explanations[explanationIndex];

    // Check if user is the author of the explanation
    if (existingExplanation.author.toString() !== userId.toString()) {
      throw new ApiError('You are not authorized to update this explanation', 'UNAUTHORIZED', 403);
    }

    // Update the explanation
    dispute.explanations[explanationIndex].content = explanation;
    dispute.explanations[explanationIndex].updatedAt = new Date();

    console.log('Saving dispute with updated explanation...');
    await dispute.save();
    console.log('Dispute saved successfully');

    // Populate the updated dispute
    console.log('Populating updated dispute...');
    const updatedDispute = await Dispute.findById(disputeId)
      .populate([
        { path: 'review', select: 'title content overallRating reviewer', populate: { path: 'reviewer', select: 'firstName lastName avatar companyName companySize title' } },
        { path: 'product', select: 'name slug' },
        { path: 'vendor', select: 'firstName lastName email' },
        { path: 'explanations.author', select: 'firstName lastName avatar' }
      ]);
    console.log('Dispute populated successfully');

    // Send notification to the other party
    console.log('Sending notification...');
    const review = await ProductReview.findById(dispute.review);
    const isVendor = dispute.vendor.toString() === userId.toString();
    const otherPartyId = isVendor ? review.reviewer : dispute.vendor;
    
    if (otherPartyId) {
      try {
        await createNotification({
          userId: otherPartyId,
          type: 'DISPUTE_EXPLANATION_UPDATE',
          title: 'Explanation Updated in Dispute',
          message: 'An explanation has been updated in a dispute you are involved in.',
          meta: { disputeId },
          actionUrl: `/disputes/${disputeId}`
        });
        console.log('Notification sent successfully');
      } catch (notificationError) {
        console.error('Notification error (non-blocking):', notificationError);
        // Don't throw error for notification failure
      }
    }

    console.log('Returning updated dispute');
    return updatedDispute;
  } catch (error) {
    console.error('Error in updateExplanation:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to update explanation', 'UPDATE_EXPLANATION_FAILED', 500);
  }
};

/**
 * Get all disputes with admin filtering (for admin panel)
 */
const getAllDisputes = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const disputes = await Dispute.find(filter)
      .populate([
        { path: 'review', select: 'title content overallRating reviewer', populate: { path: 'reviewer', select: 'firstName lastName avatar companyName companySize title' } },
        { path: 'product', select: 'name slug' },
        { path: 'vendor', select: 'firstName lastName email' },
        { path: 'explanations.author', select: 'firstName lastName avatar' }
      ])
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Dispute.countDocuments(filter);

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
  } catch (error) {
    throw new ApiError('Failed to fetch disputes', 'FETCH_FAILED', 500);
  }
};

module.exports = {
  createDispute,
  getVendorDisputes,
  getAllDisputes,
  getDisputeById,
  updateDispute,
  deleteDispute,
  addExplanation,
  updateExplanation
}; 