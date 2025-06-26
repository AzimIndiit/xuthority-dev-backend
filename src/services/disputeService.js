const Dispute = require('../models/Dispute');
const ProductReview = require('../models/ProductReview');
const Product = require('../models/Product');
const ApiError = require('../utils/apiError');
const { DISPUTE_MESSAGES } = require('../utils/constants');

/**
 * Create a new dispute on a product review
 */
const createDispute = async (reviewId, vendorId, disputeData) => {
  try {
    // Check if review exists
    const review = await ProductReview.findById(reviewId).populate('product');
    if (!review) {
      throw new ApiError(DISPUTE_MESSAGES.REVIEW_NOT_FOUND, 'REVIEW_NOT_FOUND', 404);
    }

    // Check if vendor owns the product
    if (review.product.userId.toString() !== vendorId.toString()) {
      throw new ApiError(DISPUTE_MESSAGES.NOT_PRODUCT_OWNER, 'NOT_PRODUCT_OWNER', 403);
    }

    // Check if dispute already exists for this review by this vendor
    const existingDispute = await Dispute.findOne({ 
      review: reviewId, 
      vendor: vendorId 
    });
    if (existingDispute) {
      throw new ApiError(DISPUTE_MESSAGES.DISPUTE_ALREADY_EXISTS, 'DISPUTE_ALREADY_EXISTS', 400);
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
    throw new ApiError(DISPUTE_MESSAGES.CREATE_FAILED, 'CREATE_FAILED', 500);
  }
};

/**
 * Get disputes for a vendor with pagination
 */
const getVendorDisputes = async (vendorId, options = {}) => {
  try {
    return await Dispute.getDisputesByVendor(vendorId, options);
  } catch (error) {
    throw new ApiError(DISPUTE_MESSAGES.FETCH_FAILED, 'FETCH_FAILED', 500);
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
        { path: 'vendor', select: 'firstName lastName email' }
      ]);

    if (!dispute) {
      throw new ApiError(DISPUTE_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404);
    }

    return dispute;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(DISPUTE_MESSAGES.FETCH_FAILED, 'FETCH_FAILED', 500);
  }
};

/**
 * Update a dispute
 */
const updateDispute = async (disputeId, vendorId, updateData) => {
  try {
    const dispute = await Dispute.findOne({ _id: disputeId, vendor: vendorId });
    
    if (!dispute) {
      throw new ApiError(DISPUTE_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404);
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

    return updatedDispute;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(DISPUTE_MESSAGES.UPDATE_FAILED, 'UPDATE_FAILED', 500);
  }
};

/**
 * Delete a dispute
 */
const deleteDispute = async (disputeId, vendorId) => {
  try {
    const dispute = await Dispute.findOne({ _id: disputeId, vendor: vendorId });
    
    if (!dispute) {
      throw new ApiError(DISPUTE_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404);
    }

    await Dispute.findByIdAndDelete(disputeId);
    return { message: DISPUTE_MESSAGES.DELETED_SUCCESSFULLY };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(DISPUTE_MESSAGES.DELETE_FAILED, 'DELETE_FAILED', 500);
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
        { path: 'review', select: 'title content overallRating reviewer', populate: { path: 'reviewer', select: 'firstName lastName' } },
        { path: 'product', select: 'name slug' },
        { path: 'vendor', select: 'firstName lastName email' }
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
    throw new ApiError(DISPUTE_MESSAGES.FETCH_FAILED, 'FETCH_FAILED', 500);
  }
};

module.exports = {
  createDispute,
  getVendorDisputes,
  getDisputeById,
  updateDispute,
  deleteDispute,
  getAllDisputes
}; 