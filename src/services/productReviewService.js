const ProductReview = require('../models/ProductReview');
const Product = require('../models/Product');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { createNotification } = require('../services/notificationService');
const { updateProductAggregateRatings } = require('../utils/productRatingHelpers');
const { notifyAdminsNewReview, createAdminNotification } = require('../services/adminNotificationService');
const emailService = require('./emailService');

/**
 * Create a new product review
 */
const createProductReview = async (reviewData, userId) => {
  try {
    // Check if product exists
    const product = await Product.findById(reviewData.product);
    if (!product) {
      throw new ApiError('Product not found', 'PRODUCT_NOT_FOUND', 404);
    }

    // Check if user already reviewed this product (excluding soft-deleted)
    const existingReview = await ProductReview.findOne({
      product: reviewData.product,
      reviewer: userId,
      isDeleted: false
    });

    if (existingReview) {
      throw new ApiError('You have already reviewed this product', 'REVIEW_ALREADY_EXISTS', 409);
    }

    // Create review with reviewer as current user
    const review = new ProductReview({
      ...reviewData,
      reviewer: userId,
      publishedAt: new Date(),
      status: 'pending' // Auto-approve for now, can be changed based on requirements
    });

    await review.save();

    // Send notification to vendor
    await createNotification({
      userId: product.userId,
      type: 'PRODUCT_REVIEW',
      title: "You've Got a New Review!",
      message: 'A user has left a review on your product. Check it out and respond to engage with your customers.',
      meta: { productId: product._id, reviewId: review._id },
      actionUrl: `/product-detail/${product.slug}`
    });

    // Populate the review before returning
    await review.populate([
      { path: 'reviewer', select: 'name email' },
      { path: 'product', select: 'name slug' }
    ]);

    // Send notification to admins
    const reviewer = await User.findById(userId).select('name');
    await notifyAdminsNewReview(review, product, reviewer);

    return ApiResponse.success(review, 'Product review created successfully');
  } catch (error) {
    // Re-throw ApiError instances as they are
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle MongoDB duplicate key error specifically
    if (error.code === 11000) {
      // This is a duplicate key error from the database unique index
      throw new ApiError('You have already reviewed this product', 'REVIEW_ALREADY_EXISTS', 409);
    }
    
    // Handle other MongoDB/Mongoose errors
    if (error.name === 'ValidationError') {
      throw new ApiError('Review validation failed', 'VALIDATION_ERROR', 400, { 
        errors: Object.values(error.errors).map(e => ({ field: e.path, message: e.message }))
      });
    }
    
    console.error('Unexpected error creating product review:', error);
    throw new ApiError('Error creating product review', 'REVIEW_CREATE_ERROR', 500, { 
      originalError: error.message,
      stack: error.stack 
    });
  }
};

/**
 * Get all product reviews with pagination and filtering
 */
const getAllProductReviews = async (queryParams) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      overallRating,
      isVerified,
      sortBy = 'publishedAt',
      sortOrder = 'desc',
      minRating,
      maxRating,
      mention,
      keywords,
      dateFrom,
      dateTo
    } = queryParams;

    let filter = {};
    if (status === 'all') {
      filter.status = { $in: ['pending', 'approved', 'dispute'] };
    } else {
      filter.status = status || 'approved';
    }
    // Add rating filters
    if (overallRating) {
      if (Array.isArray(overallRating)) {
        filter.overallRating = { $in: overallRating.map(rating => parseInt(rating)) };
      } else {
        filter.overallRating = parseInt(overallRating);
      }
    }

    // Add rating range filters
    if (minRating || maxRating) {
      filter.overallRating = {};
      if (minRating) filter.overallRating.$gte = parseInt(minRating);
      if (maxRating) filter.overallRating.$lte = parseInt(maxRating);
    }

    // Add verification filter
    if (isVerified !== undefined) {
      filter['verification.isVerified'] = isVerified === 'true';
    }

    // Don't add search to filter here if we need to search populated fields
    // We'll handle it differently below

    // Add mention filtering
    if (mention) {
      if (Array.isArray(mention)) {
        filter.mentions = { $in: mention.map(m => m.toLowerCase()) };
      } else {
        filter.mentions = mention.toLowerCase();
      }
    }

    // Add keyword filtering
    if (keywords) {
      if (Array.isArray(keywords)) {
        filter.keywords = { $in: keywords.map(k => k.toLowerCase()) };
      } else {
        filter.keywords = keywords.toLowerCase();
      }
    }

    // Add date filtering
    if (dateFrom || dateTo) {
      // Determine which date field to filter on based on sortBy
      const dateField = sortBy === 'publishedAt' ? 'publishedAt' : 
                       sortBy === 'submittedAt' ? 'submittedAt' : 
                       sortBy === 'updatedAt' ? 'updatedAt' : 
                       'submittedAt'; // Default to submittedAt
      
      filter[dateField] = {};
      
      if (dateFrom) {
        const startDate = new Date(dateFrom);
        startDate.setHours(0, 0, 0, 0); // Set to start of day
        filter[dateField].$gte = startDate;
      }
      
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999); // Set to end of day
        filter[dateField].$lte = endDate;
      }
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // If search is provided, use aggregation pipeline for better performance
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      
      // Build aggregation pipeline
      const pipeline = [
        // Match base filter
        {
          $match: {
            ...filter,
            isDeleted: false
          }
        },
        // Lookup reviewer information
        {
          $lookup: {
            from: 'users',
            localField: 'reviewer',
            foreignField: '_id',
            as: 'reviewerData'
          }
        },
        {
          $unwind: {
            path: '$reviewerData',
            preserveNullAndEmptyArrays: true
          }
        },
        // Lookup product information
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productData'
          }
        },
        {
          $unwind: {
            path: '$productData',
            preserveNullAndEmptyArrays: true
          }
        },
        // Lookup vendor (product owner) information
        {
          $lookup: {
            from: 'users',
            localField: 'productData.userId',
            foreignField: '_id',
            as: 'vendorData'
          }
        },
        {
          $unwind: {
            path: '$vendorData',
            preserveNullAndEmptyArrays: true
          }
        },
        // Apply search filter
        {
          $match: {
            $or: [
              // Search in review title and content
              { title: searchRegex },
              { content: searchRegex },
              // Search in reviewer fields
              { 'reviewerData.firstName': searchRegex },
              { 'reviewerData.lastName': searchRegex },
              { 'reviewerData.name': searchRegex },
              { 'reviewerData.email': searchRegex },
              // Search in product name
              { 'productData.name': searchRegex },
              // Search in vendor fields
              { 'vendorData.firstName': searchRegex },
              { 'vendorData.lastName': searchRegex },
              { 'vendorData.email': searchRegex }
            ]
          }
        },
        // Project the fields we need
        {
          $project: {
            _id: 1,
            product: {
              _id: '$productData._id',
              name: '$productData.name',
              slug: '$productData.slug',
              avgRating: '$productData.avgRating',
              totalReviews: '$productData.totalReviews',
              brandColors: '$productData.brandColors',
              logoUrl: '$productData.logoUrl',
              userId: {
                _id: '$vendorData._id',
                firstName: '$vendorData.firstName',
                lastName: '$vendorData.lastName',
                avatar: '$vendorData.avatar',
                slug: '$vendorData.slug',
                email: '$vendorData.email'
              }
            },
            reviewer: {
              _id: '$reviewerData._id',
              name: '$reviewerData.name',
              email: '$reviewerData.email',
              avatar: '$reviewerData.avatar',
              firstName: '$reviewerData.firstName',
              lastName: '$reviewerData.lastName',
              title: '$reviewerData.title',
              companyName: '$reviewerData.companyName',
              companySize: '$reviewerData.companySize',
              industry: '$reviewerData.industry',
              slug: '$reviewerData.slug',
              isVerified: '$reviewerData.isVerified'
            },
            overallRating: 1,
            title: 1,
            content: 1,
            subRatings: 1,
            verification: 1,
            status: 1,
            helpfulVotes: 1,
            totalReplies: 1,
            keywords: 1,
            mentions: 1,
            metaData: 1,
            publishedAt: 1,
            submittedAt: 1,
            createdAt: 1,
            updatedAt: 1
          }
        },
        // Sort
        { $sort: sortOptions },
        // Get total count before pagination
        {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [{ $skip: skip }, { $limit: parseInt(limit) }]
          }
        }
      ];

      const result = await ProductReview.aggregate(pipeline);
      
      const reviews = result[0]?.data || [];
      const total = result[0]?.metadata[0]?.total || 0;

      const pagination = {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      };

      return ApiResponse.success(
        reviews,
        'Product reviews retrieved successfully',
        { pagination, total }
      );
    }

    // Normal flow without search - use the existing method
    const reviews = await ProductReview.findActiveWithPopulate(filter, [
      { path: 'reviewer', select: 'name email avatar firstName lastName title companyName companySize industry slug isVerified' },
      { 
        path: 'product', 
        select: 'name slug avgRating totalReviews brandColors userId logoUrl',
        populate: {
          path: 'userId',
          select: 'firstName lastName avatar slug email'
        }
      }
    ])
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ProductReview.countActive(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };

    return ApiResponse.success(
      reviews,
      'Product reviews retrieved successfully',
      { pagination, total }
    );
  } catch (error) {
    throw new ApiError('Error retrieving product reviews', 'REVIEWS_FETCH_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Get reviews for a specific product
 */
const getProductReviews = async (productId, queryParams) => {
  try {
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError('Product not found', 'PRODUCT_NOT_FOUND', 404);
    }

    const {
      page = 1,
      limit = 10,
      search,
      overallRating,
      isVerified,
      sortBy = 'publishedAt',
      sortOrder = 'desc',
      mention,
      keywords,
      dateFrom,
      dateTo
    } = queryParams;

    const filter = {
      product: productId,
      status: 'approved',
      publishedAt: { $ne: null }
    };

    // Add search functionality
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Add rating filters
    if (overallRating) {
      if (Array.isArray(overallRating)) {
        filter.overallRating = { $in: overallRating.map(rating => parseInt(rating)) };
      } else {
        filter.overallRating = parseInt(overallRating);
      }
    }

    // Add verification filter
    if (isVerified !== undefined) {
      filter['verification.isVerified'] = isVerified === 'true';
    }

    // Add mention filtering
    if (mention) {
      if (Array.isArray(mention)) {
        filter.mentions = { $in: mention.map(m => m.toLowerCase()) };
      } else {
        filter.mentions = mention.toLowerCase();
      }
    }

    // Add keyword filtering
    if (keywords) {
      if (Array.isArray(keywords)) {
        filter.keywords = { $in: keywords.map(k => k.toLowerCase()) };
      } else {
        filter.keywords = keywords.toLowerCase();
      }
    }

    // Add date filtering
    if (dateFrom || dateTo) {
      // Determine which date field to filter on based on sortBy
      const dateField = sortBy === 'publishedAt' ? 'publishedAt' : 
                       sortBy === 'submittedAt' ? 'submittedAt' : 
                       sortBy === 'updatedAt' ? 'updatedAt' : 
                       'submittedAt'; // Default to submittedAt
      
      filter[dateField] = {};
      
      if (dateFrom) {
        const startDate = new Date(dateFrom);
        startDate.setHours(0, 0, 0, 0); // Set to start of day
        filter[dateField].$gte = startDate;
      }
      
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999); // Set to end of day
        filter[dateField].$lte = endDate;
      }
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const reviews = await ProductReview.findActiveWithPopulate(filter, [
      { path: 'reviewer', select: 'name email avatar firstName lastName title companyName companySize industry slug isVerified' },
      { 
        path: 'product', 
        select: 'name slug avgRating totalReviews brandColors userId logoUrl',
        populate: {
          path: 'userId',
          select: 'firstName lastName avatar slug email'
        }
      }
    ])
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ProductReview.countActive(filter);

    // Get rating distribution for this product
    const ratingStats = await ProductReview.aggregate([
      {
        $match: {
          product: product._id,
          status: 'approved',
          publishedAt: { $ne: null },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: '$overallRating',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]);

    const ratingDistribution = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    };

    ratingStats.forEach(stat => {
      ratingDistribution[stat._id] = stat.count;
    });

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };

    return ApiResponse.success(
      reviews,
      'Product reviews retrieved successfully',
      { 
        pagination, 
        total, 
        productInfo: {
          id: product._id,
          name: product.name,
          avgRating: product.avgRating,
          totalReviews: product.totalReviews,
          ratingDistribution
        }
      }
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error retrieving product reviews', 'PRODUCT_REVIEWS_FETCH_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Get single review by ID
 */
const getProductReviewById = async (reviewId) => {
  try {
    const review = await ProductReview.findByIdActive(reviewId)
      .populate([
        { 
          path: 'reviewer', 
          select: 'name email avatar firstName lastName title companyName companySize industry slug isVerified',
          populate: {
            path: 'industry',
            select: 'name slug'
          }
        },
        { 
          path: 'product', 
          select: 'name slug avgRating totalReviews brandColors userId logoUrl',
          populate: {
            path: 'userId',
            select: 'firstName lastName avatar slug email industry',
            populate: {
              path: 'industry',
              select: 'name slug'
            }
          }
        }
      ]);

    if (!review) {
      throw new ApiError('Product review not found', 'REVIEW_NOT_FOUND', 404);
    }

    return ApiResponse.success(review, 'Product review retrieved successfully');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error retrieving product review', 'REVIEW_FETCH_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Update product review (only by review owner)
 */
const updateProductReview = async (reviewId, updateData, userId) => {
  try {
    const review = await ProductReview.findByIdActive(reviewId);

    if (!review) {
      throw new ApiError('Product review not found', 'REVIEW_NOT_FOUND', 404);
    }

    // Check if user is the owner of the review
    if (review.reviewer.toString() !== userId) {
      throw new ApiError('You can only update your own reviews', 'UNAUTHORIZED_UPDATE', 403);
    }

    // Get product details for notifications
    const product = await Product.findById(review.product);
    if (!product) {
      throw new ApiError('Product not found', 'PRODUCT_NOT_FOUND', 404);
    }

    // Don't allow changing product or reviewer
    delete updateData.product;
    delete updateData.reviewer;

    // Update the review object and save to trigger middleware
    Object.assign(review, updateData);
    review.status = 'pending';
    const updatedReview = await review.save();

    // Send notification to vendor about review update
    await createNotification({
      userId: product.userId,
      type: 'PRODUCT_REVIEW',
      title: "Review Updated!",
      message: `A user has updated their review on ${product.name}. The review is pending approval.`,
      meta: { productId: product._id, reviewId: review._id },
      actionUrl: `/product-detail/${product.slug}`
    });

    // Send notification to admins about review update
    const reviewer = await User.findById(userId).select('name');
    await createAdminNotification({
      type: 'PRODUCT_REVIEW',
      title: 'Review Updated - Pending Approval',
      message: `${reviewer.name || 'A user'} has updated their review for ${product.name || 'a product'}. The review is now pending approval.`,
      meta: { 
        reviewId: review._id.toString(), 
        productId: product._id.toString(),
        reviewerId: reviewer._id.toString(),
        reviewerName: reviewer.name || 'Unknown',
        productName: product.name || 'Unknown',
        status: 'pending'
      },
      actionUrl: 'reviews'
    });

    await updatedReview.populate([
      { path: 'reviewer', select: 'name email avatar slug' },
      { path: 'product', select: 'name slug' }
    ]);

    return ApiResponse.success(updatedReview, 'Product review updated successfully');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error updating product review', 'REVIEW_UPDATE_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Delete product review
 */
const deleteProductReview = async (reviewId, userId, userRole) => {
  try {
    const review = await ProductReview.findByIdActive(reviewId)
      .populate([
        { path: 'reviewer', select: 'name email firstName lastName' },
        { path: 'product', select: 'name slug' }
      ]);

    if (!review) {
      throw new ApiError('Product review not found', 'REVIEW_NOT_FOUND', 404);
    }

    // Check if user is the owner of the review or admin
    if (review.reviewer._id.toString() !== userId && userRole !== 'admin') {
      throw new ApiError('You can only delete your own reviews', 'UNAUTHORIZED_DELETE', 403);
    }

    // Determine who deleted the review
    const deletedBy = review.reviewer._id.toString() === userId ? 'self' : 'admin';

    // Send email notification to the reviewer
    try {
      const emailParams = {
        email: review.reviewer.email,
        userName: review.reviewer.firstName || review.reviewer.name || 'User',
        productName: review.product.name,
        rating: review.overallRating,
        reviewTitle: review.title,
        reviewId: review._id.toString(),
        productSlug: review.product.slug,
        deletedBy
      };

      await emailService.sendReviewDeletedEmail(emailParams);
    } catch (emailError) {
      // Log error but don't fail the deletion operation
      console.error('Failed to send review deletion email:', emailError);
    }

    // Send in-app notification to the reviewer
    try {
      const notificationMessage = deletedBy === 'self' 
        ? `Your review for ${review.product.name} has been successfully removed.`
        : `Your review for ${review.product.name} has been removed by an administrator. If you have questions, please contact support.`;

      await createNotification({
        userId: review.reviewer._id,
        type: 'REVIEW_DELETED',
        title: 'Review Removed',
        message: notificationMessage,
        meta: { 
          productId: review.product._id, 
          reviewId: review._id,
          productSlug: review.product.slug,
          deletedBy
        },
        actionUrl: `/products/${review.product.slug}`
      });
    } catch (notificationError) {
      // Log error but don't fail the deletion operation
      console.error('Failed to send review deletion notification:', notificationError);
    }

    // Soft delete the review
    await review.softDelete(userId);

    return ApiResponse.success(null, 'Product review deleted successfully');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error deleting product review', 'REVIEW_DELETE_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Vote helpful on a review
 */
const voteHelpful = async (reviewId, userId) => {
  try {
    const review = await ProductReview.findById(reviewId);

    if (!review) {
      throw new ApiError('Product review not found', 'REVIEW_NOT_FOUND', 404);
    }

    // Check if user already voted
    const existingVote = review.helpfulVotes.voters.find(
      voter => voter.user.toString() === userId
    );

    if (existingVote) {
      throw new ApiError('You have already voted this review as helpful', 'ALREADY_VOTED', 409);
    }

    // Add vote
    review.helpfulVotes.voters.push({
      user: userId,
      votedAt: new Date()
    });
    review.helpfulVotes.count = review.helpfulVotes.voters.length;

    await review.save();

    return ApiResponse.success(
      { 
        helpfulCount: review.helpfulVotes.count,
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
 * Remove helpful vote from a review
 */
const removeHelpfulVote = async (reviewId, userId) => {
  try {
    const review = await ProductReview.findById(reviewId);

    if (!review) {
      throw new ApiError('Product review not found', 'REVIEW_NOT_FOUND', 404);
    }

    // Check if user has voted
    const voteIndex = review.helpfulVotes.voters.findIndex(
      voter => voter.user.toString() === userId
    );

    if (voteIndex === -1) {
      throw new ApiError('You have not voted this review as helpful', 'VOTE_NOT_FOUND', 404);
    }

    // Remove vote
    review.helpfulVotes.voters.splice(voteIndex, 1);
    review.helpfulVotes.count = review.helpfulVotes.voters.length;

    await review.save();

    return ApiResponse.success(
      { 
        helpfulCount: review.helpfulVotes.count,
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
 * Moderate review (admin only)
 */
const moderateReview = async (reviewId, moderationData) => {
  try {
    const review = await ProductReview.findByIdActive(reviewId);

    if (!review) {
      throw new ApiError('Product review not found', 'REVIEW_NOT_FOUND', 404);
    }

        const { status, moderationNote } = moderationData;

    // Track previous status and inclusion state BEFORE making changes
    const previousStatus = review.status;
    const wasPreviouslyIncluded = previousStatus === 'approved' && review.publishedAt && !review.isDeleted;

    // Update review status
    review.status = status;

    // Set published date if approving
    if (status === 'approved' && !review.publishedAt) {
      review.publishedAt = new Date();
    }

    // Add moderation note if provided
    if (moderationNote) {
      review.moderationNote = moderationNote;
    }

    await review.save();

    // Check if inclusion status changed
    const isCurrentlyIncluded = review.status === 'approved' && review.publishedAt && !review.isDeleted;

    // Update product statistics if inclusion status changed
    // This handles cases like: approved → pending, pending → approved, etc.
    if (isCurrentlyIncluded !== wasPreviouslyIncluded) {
      await updateProductAggregateRatings(review.product);
      console.log(`Product stats updated for review ${review._id}: ${previousStatus} → ${status} (included: ${wasPreviouslyIncluded} → ${isCurrentlyIncluded})`);
    }

    await review.populate([
      { path: 'reviewer', select: 'name email avatar slug firstName lastName' },
      { path: 'product', select: 'name slug' }
    ]);

    // Send notifications to the reviewer
    try {
      // Send in-app notification
      if (status === 'approved') {
        console.log(`Creating REVIEW_APPROVED notification for user ${review.reviewer._id}`);
        const notification = await createNotification({
          userId: review.reviewer._id,
          type: 'REVIEW_APPROVED',
          title: 'Your Review Has Been Approved!',
          message: `Great news! Your review for ${review.product.name} has been approved and is now live. Thank you for contributing to our community!`,
          meta: { 
            productId: review.product._id, 
            reviewId: review._id,
            productSlug: review.product.slug 
          },
          actionUrl: `/profile/my-reviews`
        });
        console.log(`Notification created successfully:`, notification._id);
      } else if (status === 'rejected') {
        await createNotification({
          userId: review.reviewer._id,
          type: 'REVIEW_REJECTED',
          title: 'Your Review Needs Revision',
          message: `Your review for ${review.product.name} needs some updates before it can be published. ${moderationNote ? 'Reason: ' + moderationNote : 'Please check our community guidelines and resubmit.'}`,
          meta: { 
            productId: review.product._id, 
            reviewId: review._id,
            productSlug: review.product.slug,
            moderationNote: moderationNote 
          },
          actionUrl: `/profile/my-reviews`
        });
      } else if (status === 'flagged') {
        await createNotification({
          userId: review.reviewer._id,
          type: 'REVIEW_FLAGGED',
          title: 'Your Review Has Been Flagged',
          message: `Your review for ${review.product.name} has been flagged for further review. ${moderationNote ? 'Reason: ' + moderationNote : 'Our team will review it and get back to you soon.'}`,
          meta: { 
            productId: review.product._id, 
            reviewId: review._id,
            productSlug: review.product.slug,
            moderationNote: moderationNote 
          },
          actionUrl: `/profile/my-reviews`
        });
      }
    } catch (notificationError) {
      // Log error but don't fail the moderation operation
      console.error('Failed to send moderation notification:', notificationError);
    }

    // Send email notification to the reviewer
    try {
      const emailParams = {
        email: review.reviewer.email,
        userName: review.reviewer.firstName || review.reviewer.name || 'User',
        productName: review.product.name,
        rating: review.overallRating,
        reviewTitle: review.title,
        reviewId: review._id.toString(),
        productSlug: review.product.slug
      };

      if (status === 'approved') {
        emailParams.publishedDate = review.publishedAt;
        await emailService.sendReviewApprovedEmail(emailParams);
      } else if (status === 'rejected') {
        emailParams.moderationNote = moderationNote;
        await emailService.sendReviewRejectedEmail(emailParams);
      }
    } catch (emailError) {
      // Log error but don't fail the moderation operation
      console.error('Failed to send moderation email:', emailError);
    }

    return ApiResponse.success(review, 'Review moderated successfully');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error moderating review', 'REVIEW_MODERATION_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Get review statistics for a product (including popular mentions)
 */
const getProductReviewStats = async (productId) => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError('Product not found', 'PRODUCT_NOT_FOUND', 404);
    }

    // Get basic stats and popular mentions in parallel
    const [stats, popularMentions] = await Promise.all([
      ProductReview.getReviewStats(productId),
      ProductReview.getPopularMentions(productId, 8)
    ]);
    
    const result = {
      ...(stats[0] || {}),
      popularMentions: popularMentions || []
    };
    
    return ApiResponse.success(result, 'Review statistics retrieved successfully');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error retrieving review statistics', 'REVIEW_STATS_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Get current user's review for a specific product
 */
const getUserReviewForProduct = async (productId, userId) => {
  try {
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError('Product not found', 'PRODUCT_NOT_FOUND', 404);
    }

    // Find user's review for this product
    const reviews = await ProductReview.findActive({
      product: productId,
      reviewer: userId
    }).populate([
      { path: 'reviewer', select: 'name email avatar slug ' },
      { path: 'product', select: 'name, slug, brandColors' }
    ]).limit(1);
    
    const review = reviews[0];

    if (!review) {
      return ApiResponse.success(null, 'No review found for this product');
    }

    return ApiResponse.success(review, 'User review retrieved successfully');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error retrieving user review', 'USER_REVIEW_FETCH_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Restore a soft-deleted review (admin only)
 */
const restoreProductReview = async (reviewId) => {
  try {
    const review = await ProductReview.findOne({ _id: reviewId, isDeleted: true });

    if (!review) {
      throw new ApiError('Deleted review not found', 'REVIEW_NOT_FOUND', 404);
    }

    // Restore the review
    await review.restore();

    await review.populate([
      { path: 'reviewer', select: 'name email avatar slug' },
      { path: 'product', select: 'name slug' }
    ]);

    return ApiResponse.success(review, 'Product review restored successfully');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error restoring product review', 'REVIEW_RESTORE_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Get soft-deleted reviews (admin only)
 */
const getDeletedProductReviews = async (queryParams) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'deletedAt',
      sortOrder = 'desc'
    } = queryParams;

    const filter = { isDeleted: true };

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const reviews = await ProductReview.find(filter)
      .populate([
        { path: 'reviewer', select: 'name email avatar slug' },
        { path: 'product', select: 'name slug' },
        { path: 'deletedBy', select: 'name email' }
      ])
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ProductReview.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };

    return ApiResponse.success(
      reviews,
      'Deleted reviews retrieved successfully',
      { pagination, total }
    );
  } catch (error) {
    throw new ApiError('Error retrieving deleted reviews', 'DELETED_REVIEWS_FETCH_ERROR', 500, { originalError: error.message });
  }
};

module.exports = {
  createProductReview,
  getAllProductReviews,
  getProductReviews,
  getProductReviewById,
  updateProductReview,
  deleteProductReview,
  restoreProductReview,
  getDeletedProductReviews,
  voteHelpful,
  removeHelpfulVote,
  moderateReview,
  getProductReviewStats,
  getUserReviewForProduct
}; 