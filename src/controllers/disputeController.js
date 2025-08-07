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
      productSlug,
      reviewId,
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      sortBy,
      sortOrder,
      productSlug,
      review:reviewId
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
 * @openapi
 * /disputes/{id}:
 *   put:
 *     tags:
 *       - Disputes
 *     summary: Update dispute
 *     description: |
 *       Update dispute information including status. 
 *       **Important**: When dispute status is changed to 'resolved', the associated product review will be automatically published (status set to 'approved' and publishedAt timestamp set).
 *       This triggers notifications and emails to both the reviewer and vendor.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: MongoDB ObjectId of the dispute
 *         example: 60d21b4667d0d8992e610c85
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: [false-or-misleading-information, spam-or-fake-review, inappropriate-content, conflict-of-interest, other]
 *                 description: Reason for the dispute
 *                 example: false-or-misleading-information
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *                 description: Detailed description of the dispute
 *                 example: This review contains false information about our product features
 *               status:
 *                 type: string
 *                 enum: [active, resolved]
 *                 description: |
 *                   Dispute status. When set to 'resolved', the associated review will be automatically published.
 *                 example: resolved
 *     responses:
 *       200:
 *         description: Dispute updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: Dispute ID
 *                       example: 60d21b4667d0d8992e610c85
 *                     review:
 *                       type: object
 *                       description: Associated review details
 *                     vendor:
 *                       type: object
 *                       description: Vendor details
 *                     product:
 *                       type: object
 *                       description: Product details
 *                     reason:
 *                       type: string
 *                       example: false-or-misleading-information
 *                     description:
 *                       type: string
 *                       example: This review contains false information
 *                     status:
 *                       type: string
 *                       enum: [active, resolved]
 *                       example: resolved
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: Dispute updated successfully
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Dispute not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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