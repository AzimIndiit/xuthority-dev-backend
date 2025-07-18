const Dispute = require('../models/Dispute');
const ProductReview = require('../models/ProductReview');
const Product = require('../models/Product');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { createNotification } = require('../services/notificationService');
const emailService = require('../services/emailService');
const config = require('../config');

/**
 * Create a new dispute on a product review
 */
const createDispute = async (reviewId, vendorId, disputeData) => {
  try {
    // Check if review exists and is not soft-deleted
    const review = await ProductReview.findByIdActive(reviewId);
    if (!review) {
      throw new ApiError('Product review not found or has been deleted', 'REVIEW_NOT_FOUND', 404);
    }

    // Populate the product for the review
    await review.populate('product');

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
        { path: 'review', select: 'title content overallRating reviewer', populate: { path: 'reviewer', select: 'firstName lastName avatar companyName companySize title slug role title  ' } },
        { path: 'product', select: 'name slug isActive' },
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
      { path: 'product', select: 'name slug isActive' },
      { path: 'vendor', select: 'firstName lastName email' }
    ]);

    // Send notification and email on status update
    if (updates.status) {
      // Get the review to access reviewer information
      const review = dispute.review ? await ProductReview.findByIdActive(dispute.review) : null;
      
      // Get user data for emails
      const [vendorUser, reviewerUser, updaterUser] = await Promise.all([
        User.findById(vendorId).select('firstName lastName email'),
        review && review.reviewer ? User.findById(review.reviewer).select('firstName lastName email') : null,
        User.findById(vendorId).select('firstName lastName') // Assuming vendor is updating
      ]);

      const disputeUrl = `${config?.app?.frontendUrl || 'http://localhost:3001'}/product-detail/${updatedDispute.product.slug}/disputes`;
      
      // Send notification and email to vendor
      try {
        await createNotification({
          userId: vendorId,
          type: 'DISPUTE_STATUS_UPDATE',
          title: 'Review Dispute Status Update',
          message: 'Your review dispute status has been updated. Click here for details.',
          meta: { disputeId, status: updates.status },
          actionUrl: `/product-detail/${updatedDispute.product.slug}/disputes`
        });

        // Send email to vendor
        if (vendorUser && vendorUser.email) {
          const emailData = {
            userName: `${vendorUser.firstName || ''} ${vendorUser.lastName || ''}`.trim() || 'User',
            disputeId,
            productName: updatedDispute.product?.name || 'Product',
            reviewTitle: review?.title || review?.content?.substring(0, 100) + '...' || 'Review',
            oldStatus: dispute.status || 'Unknown',
            newStatus: updates.status,
            updatedBy: `${updaterUser?.firstName || ''} ${updaterUser?.lastName || ''}`.trim() || 'System',
            createdDate: dispute.createdAt ? dispute.createdAt.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'Unknown',
            disputeUrl
          };

          await emailService.sendDisputeStatusUpdateEmail(vendorUser.email, emailData);
        }
      } catch (error) {
        console.error('Error sending vendor notification/email (non-blocking):', error);
      }

      // Also notify and email the review author (user)
      if (review && review.reviewer && reviewerUser) {
        try {
          await createNotification({
            userId: review.reviewer,
            type: 'DISPUTE_STATUS_UPDATE',
            title: 'Dispute Status Update on Your Review',
            message: 'A dispute involving your review has been updated. Click here for details.',
            meta: { disputeId, status: updates.status },
            actionUrl: `/product-detail/${updatedDispute.product.slug}/disputes`
          });

          // Send email to reviewer
          if (reviewerUser.email) {
            const emailData = {
              userName: `${reviewerUser.firstName || ''} ${reviewerUser.lastName || ''}`.trim() || 'User',
              disputeId,
              productName: updatedDispute.product?.name || 'Product',
              reviewTitle: review.title || review.content?.substring(0, 100) + '...' || 'Review',
              oldStatus: dispute.status || 'Unknown',
              newStatus: updates.status,
              updatedBy: `${updaterUser?.firstName || ''} ${updaterUser?.lastName || ''}`.trim() || 'System',
              createdDate: dispute.createdAt ? dispute.createdAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Unknown',
              disputeUrl
            };

            await emailService.sendDisputeStatusUpdateEmail(reviewerUser.email, emailData);
          }
        } catch (error) {
          console.error('Error sending reviewer notification/email (non-blocking):', error);
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
    const dispute = await Dispute.findById(disputeId);
    
    if (!dispute) {
      throw new ApiError('Dispute not found', 'NOT_FOUND', 404);
    }

    // Check if review exists and is not soft-deleted
    const review = await ProductReview.findByIdActive(dispute.review);
    
    if (!review) {
      throw new ApiError('Related review not found or has been deleted', 'REVIEW_NOT_FOUND', 404);
    }
    
    const isVendor = dispute.vendor.toString() === userId.toString();
    const isReviewAuthor = review && review.reviewer.toString() === userId.toString();
    
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

    await dispute.save();

    // Populate the updated dispute
    const updatedDispute = await Dispute.findById(disputeId)
      .populate([
        { path: 'review', select: 'title content overallRating reviewer', populate: { path: 'reviewer', select: 'firstName lastName avatar companyName companySize title slug' } },
        { path: 'product', select: 'name slug' },
        { path: 'vendor', select: 'firstName lastName email' },
        { path: 'explanations.author', select: 'firstName lastName avatar' }
      ]);

    // Send notification and email to the other party
    const otherPartyId = isVendor ? review.reviewer : dispute.vendor;
    if (otherPartyId) {
      // Get user data for email (do this first)
      const [otherPartyUser, authorUser] = await Promise.all([
        User.findById(otherPartyId).select('firstName lastName email'),
        User.findById(userId).select('firstName lastName')
      ]);

      // Send notification (handle errors separately)
      try {
        await createNotification({
          userId: otherPartyId,
          type: 'DISPUTE_EXPLANATION',
          title: 'New Explanation Added to Dispute',
          message: 'A new explanation has been added to a dispute you are involved in.',
          meta: { disputeId },
          actionUrl: `/product-detail/${updatedDispute.product.slug}/disputes`
        });
      } catch (notificationError) {
        console.error('Notification error (non-blocking):', notificationError);
        // Continue to email sending even if notification fails
      }

      // Send email (handle errors separately)
      try {
        if (otherPartyUser && otherPartyUser.email) {
          const disputeUrl = `${config?.app?.frontendUrl || 'http://localhost:3001'}/profile/dispute-management`;
          
          const emailData = {
            userName: `${otherPartyUser.firstName || ''} ${otherPartyUser.lastName || ''}`.trim() || 'User',
            authorName: `${authorUser?.firstName || ''} ${authorUser?.lastName || ''}`.trim() || 'Someone',
            explanationContent: explanation,
            reviewTitle: review.title || review.content?.substring(0, 100) + '...' || 'Review',
            productName: updatedDispute.product?.name || 'Product',
            disputeId,
            disputeUrl
          };

          await emailService.sendDisputeExplanationEmail(otherPartyUser.email, emailData);
        }
      } catch (emailError) {
        console.error('Email error (non-blocking):', emailError);
        // Don't throw error for email failure
      }
    }

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

    // Check if review exists and is not soft-deleted
    const review = await ProductReview.findByIdActive(dispute.review);
    if (!review) {
      throw new ApiError('Related review not found or has been deleted', 'REVIEW_NOT_FOUND', 404);
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
        { path: 'review', select: 'title content overallRating reviewer', populate: { path: 'reviewer', select: 'firstName lastName avatar companyName companySize title slug' } },
        { path: 'product', select: 'name slug' },
        { path: 'vendor', select: 'firstName lastName email' },
        { path: 'explanations.author', select: 'firstName lastName avatar' }
      ]);
    console.log('Dispute populated successfully');

    // Send notification and email to the other party
    console.log('Sending notification and email...');
    const isVendor = dispute.vendor.toString() === userId.toString();
    const otherPartyId = isVendor ? review.reviewer : dispute.vendor;
    
    if (otherPartyId) {
      // Get user data for email
      const [otherPartyUser, authorUser] = await Promise.all([
        User.findById(otherPartyId).select('firstName lastName email'),
        User.findById(userId).select('firstName lastName')
      ]);

      // Send notification (handle errors separately)
      try {
        await createNotification({
          userId: otherPartyId,
          type: 'DISPUTE_EXPLANATION_UPDATE',
          title: 'Explanation Updated in Dispute',
          message: 'An explanation has been updated in a dispute you are involved in.',
          meta: { disputeId },
          actionUrl: `/product-detail/${updatedDispute.product.slug}/disputes`
        });
        console.log('Notification sent successfully');
      } catch (notificationError) {
        console.error('Notification error (non-blocking):', notificationError);
        // Continue to email sending even if notification fails
      }

      // Send email (handle errors separately)
      try {
        if (otherPartyUser && otherPartyUser.email) {
          const disputeUrl = `${config?.app?.frontendUrl || 'http://localhost:3001'}/product-detail/${updatedDispute.product.slug}/disputes`;
          
          const emailData = {
            userName: `${otherPartyUser.firstName || ''} ${otherPartyUser.lastName || ''}`.trim() || 'User',
            authorName: `${authorUser?.firstName || ''} ${authorUser?.lastName || ''}`.trim() || 'Someone',
            explanationContent: existingExplanation.content, // Use updated explanation content
            reviewTitle: review.title || review.content?.substring(0, 100) + '...' || 'Review',
            productName: updatedDispute.product?.name || 'Product',
            disputeId,
            disputeUrl
          };

          await emailService.sendDisputeExplanationUpdateEmail(otherPartyUser.email, emailData);
          console.log('Email sent successfully');
        }
      } catch (emailError) {
        console.error('Email error (non-blocking):', emailError);
        // Don't throw error for email failure
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
    console.log('getAllDisputes called with options:', options);
    
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      productSlug
    } = options;

    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (productSlug) {
      console.log('Looking up product with slug:', productSlug);
      const product = await Product.findOne({ slug: productSlug });
      if (!product) {
        console.log('Product not found for slug:', productSlug);
        throw new ApiError('Product not found', 'PRODUCT_NOT_FOUND', 404);
      }
      console.log('Product found:', product._id);
      filter.product = product._id;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    
    console.log('Query filter:', filter);
    console.log('Sort:', sort);
    console.log('Skip:', skip, 'Limit:', limit);

    const disputes = await Dispute.find(filter)
      .populate([
        { path: 'review', select: 'title content overallRating reviewer createdAt', populate: { path: 'reviewer', select: 'firstName lastName avatar companyName companySize title slug' } },
        { path: 'product', select: 'name slug isActive logoUrl createdAt' },
        { path: 'vendor', select: 'firstName lastName email' },
        { path: 'explanations.author', select: 'firstName lastName avatar' }
      ])
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    console.log('Found disputes count:', disputes.length);

    const total = await Dispute.countDocuments(filter);
    console.log('Total disputes count:', total);

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
    console.error('Error in getAllDisputes:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      options: options
    });
    
    // If it's already an ApiError, re-throw it
    if (error instanceof ApiError) {
      throw error;
    }
    
    // For other errors, log the original error and throw a generic one
    throw new ApiError(`Failed to fetch disputes: ${error.message}`, 'FETCH_FAILED', 500);
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