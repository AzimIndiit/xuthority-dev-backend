const disputeService = require('../services/disputeService');
const ApiResponse = require('../utils/apiResponse');
const { HTTP_STATUS, DISPUTE_MESSAGES } = require('../utils/constants');

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

    return ApiResponse.success(
      res,
      dispute,
      DISPUTE_MESSAGES.CREATED_SUCCESSFULLY,
      HTTP_STATUS.CREATED
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
      sortOrder = 'desc'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      sortBy,
      sortOrder
    };

    const result = await disputeService.getVendorDisputes(vendorId, options);

    return ApiResponse.success(
      res,
      result.disputes,
      'Disputes retrieved successfully',
      HTTP_STATUS.OK,
      result.pagination
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
      sortOrder = 'desc'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      sortBy,
      sortOrder
    };

    const result = await disputeService.getAllDisputes(options);

    return ApiResponse.success(
      res,
      result.disputes,
      'All disputes retrieved successfully',
      HTTP_STATUS.OK,
      result.pagination
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

    return ApiResponse.success(
      res,
      dispute,
      'Dispute retrieved successfully',
      HTTP_STATUS.OK
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

    return ApiResponse.success(
      res,
      dispute,
      DISPUTE_MESSAGES.UPDATED_SUCCESSFULLY,
      HTTP_STATUS.OK
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

    return ApiResponse.success(
      res,
      null,
      result.message,
      HTTP_STATUS.OK
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
  deleteDispute
}; 