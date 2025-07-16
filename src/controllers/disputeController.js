const disputeService = require('../services/disputeService');
const ApiResponse = require('../utils/apiResponse');

/**
 * Create a new dispute
 * POST /api/v1/disputes
 */
const createDispute = async (req, res, next) => {
  try {
    const { reviewId, reason, description } = req.body;
    const vendorId = req.user.id;

    const dispute = await disputeService.createDispute(reviewId, vendorId, {
      reason,
      description
    });

    // Update vendor's totalDisputes count if user is a vendor
    if (req.user.role === 'vendor') {
      const { User } = require('../models');
      await User.findByIdAndUpdate(
        vendorId,
        { $inc: { totalDisputes: 1 } },
        { new: true }
      );
    }

    return res.status(201).json(
      ApiResponse.success(
        dispute,
        'Dispute created successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get vendor's disputes with pagination
 * GET /api/v1/disputes
 */
const getVendorDisputes = async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      productSlug
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      sortBy,
      sortOrder,
      productSlug
    };

    const result = await disputeService.getVendorDisputes(vendorId, options);

    return res.json(
      ApiResponse.success(
        result.disputes,
        'Disputes retrieved successfully',
        result.pagination
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all disputes (Admin only)
 * GET /api/v1/disputes/all
 */
const getAllDisputes = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      productSlug
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      sortBy,
      sortOrder,
      productSlug
    };

    const result = await disputeService.getAllDisputes(options);

    return res.json(
      ApiResponse.success(
        result.disputes,
        'All disputes retrieved successfully',
        result.pagination
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get dispute by ID
 * GET /api/v1/disputes/:id
 */
const getDisputeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const dispute = await disputeService.getDisputeById(id, vendorId);

    return res.json(
      ApiResponse.success(
        dispute,
        'Dispute retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update dispute
 * PUT /api/v1/disputes/:id
 */
const updateDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;
    const updateData = req.body;

    const dispute = await disputeService.updateDispute(id, vendorId, updateData);

    return res.json(
      ApiResponse.success(
        dispute,
        'Dispute updated successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete dispute
 * DELETE /api/v1/disputes/:id
 */
const deleteDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const result = await disputeService.deleteDispute(id, vendorId);

    // Decrement vendor's totalDisputes count if user is a vendor
    if (req.user.role === 'vendor') {
      const { User } = require('../models');
      await User.findByIdAndUpdate(
        vendorId,
        { $inc: { totalDisputes: -1 } },
        { new: true }
      );
    }

    return res.json(
      ApiResponse.success(
        null,
        result.message
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Add explanation to dispute
 * POST /api/v1/disputes/:id/explanation
 */
const addExplanation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { explanation } = req.body;
    const userId = req.user.id;

    const dispute = await disputeService.addExplanation(id, userId, explanation);

    return res.json(
      ApiResponse.success(
        dispute,
        'Explanation added successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update explanation in dispute
 * PUT /api/v1/disputes/:id/explanation/:explanationId
 */
const updateExplanation = async (req, res, next) => {
  try {
    const { id, explanationId } = req.params;
    const { explanation } = req.body;
    const userId = req.user.id;

    const dispute = await disputeService.updateExplanation(id, explanationId, userId, explanation);

    return res.json(
      ApiResponse.success(
        dispute,
        'Explanation updated successfully'
      )
    );
  } catch (error) {
    next(error);
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