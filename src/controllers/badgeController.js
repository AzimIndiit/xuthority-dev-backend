const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const badgeService = require('../services/badgeService');

// Get all badges (public, with user flags if authenticated)
exports.getAllBadges = async (req, res, next) => {
  try {
    const badges = await Badge.find({ status: 'active' });
    let userBadgesMap = {};
    if (req.user) {
      console.log('Current user in getAllBadges:', req.user);
      console.log('User ID:', req.user._id);
      const userBadges = await UserBadge.find({ userId: req.user._id });
      console.log('Found userBadges:', userBadges);
      console.log('UserBadges count:', userBadges.length);
      userBadgesMap = userBadges.reduce((acc, ub) => {
        console.log(`Mapping badge ${ub.badgeId} to status ${ub.status}`);
        acc[ub.badgeId.toString()] = ub.status;
        return acc;
      }, {});
      console.log('UserBadgesMap:', userBadgesMap);
    }
    const result = badges.map(badge => {
      const status = userBadgesMap[badge._id.toString()];
      const requested = status === 'requested';
      const approved = status === 'accepted';
      console.log(`Badge ${badge._id}: status=${status}, requested=${requested}, approved=${approved}`);
      return {
        ...badge.toObject(),
        requested,
        approved
      };
    });
    return res.json(ApiResponse.success(result, 'Badges retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

// Get badge by ID (public)
exports.getBadgeById = async (req, res, next) => {
  try {
    const badge = await Badge.findById(req.params.id);
    if (!badge) return next(new ApiError('Badge not found', 'NOT_FOUND', 404));
    return res.json(ApiResponse.success(badge, 'Badge retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

// Create badge (admin only)
exports.createBadge = async (req, res, next) => {
  try {
    const badge = await Badge.create(req.body);
    return res.status(201).json(ApiResponse.success(badge, 'Badge created successfully'));
  } catch (err) {
    next(err);
  }
};

// Update badge (admin only)
exports.updateBadge = async (req, res, next) => {
  try {
    const badge = await Badge.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!badge) return next(new ApiError('Badge not found', 'NOT_FOUND', 404));
    return res.json(ApiResponse.success(badge, 'Badge updated successfully'));
  } catch (err) {
    next(err);
  }
};

// Delete badge (admin only)
exports.deleteBadge = async (req, res, next) => {
  try {
    const badge = await Badge.findByIdAndDelete(req.params.id);
    if (!badge) return next(new ApiError('Badge not found', 'NOT_FOUND', 404));
    return res.json(ApiResponse.success(null, 'Badge deleted successfully'));
  } catch (err) {
    next(err);
  }
};

// ADMIN ROUTES - Admin Badge Management

/**
 * @openapi
 * /admin/badges:
 *   get:
 *     tags:
 *       - Admin Badge Management
 *     summary: Get all badges with admin filtering
 *     description: Retrieve all badges with pagination, search, and status filtering for admin
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of badges per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for badge title or description
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, all]
 *           default: all
 *         description: Filter by badge status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, title, earnedBy, status]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Badges retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing admin token
 */
exports.getAdminBadges = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || '',
      status: req.query.status || 'all',
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await badgeService.getAdminBadges(options);

    return res.json(ApiResponse.success(
      { 
        badges: result.badges,
        pagination: result.pagination
      },
      'Badges retrieved successfully'
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /admin/badges/{id}:
 *   get:
 *     tags:
 *       - Admin Badge Management  
 *     summary: Get badge by ID for admin
 *     description: Retrieve detailed badge information for admin with stats
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Badge ID
 *     responses:
 *       200:
 *         description: Badge retrieved successfully
 *       404:
 *         description: Badge not found
 */
exports.getAdminBadgeById = async (req, res, next) => {
  try {
    const badge = await badgeService.getAdminBadgeById(req.params.id);
    return res.json(ApiResponse.success(badge, 'Badge retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /admin/badges:
 *   post:
 *     tags:
 *       - Admin Badge Management
 *     summary: Create new badge
 *     description: Create a new badge (admin only)
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *                 description: Badge title
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Badge description
 *               icon:
 *                 type: string
 *                 description: Badge icon (emoji or URL)
 *               colorCode:
 *                 type: string
 *                 description: Badge color code
 *               criteria:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Badge criteria
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *     responses:
 *       201:
 *         description: Badge created successfully
 *       400:
 *         description: Validation error or badge already exists
 */
exports.createAdminBadge = async (req, res, next) => {
  try {
    const badge = await badgeService.createBadge(req.body, req.user.id);
    return res.status(201).json(ApiResponse.success(badge, 'Badge created successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /admin/badges/{id}:
 *   patch:
 *     tags:
 *       - Admin Badge Management
 *     summary: Update badge
 *     description: Update badge information (admin only)
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Badge ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               icon:
 *                 type: string
 *               colorCode:
 *                 type: string
 *               criteria:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Badge updated successfully
 *       404:
 *         description: Badge not found
 */
exports.updateAdminBadge = async (req, res, next) => {
  try {
    const badge = await badgeService.updateBadge(req.params.id, req.body, req.user.id);
    return res.json(ApiResponse.success(badge, 'Badge updated successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /admin/badges/{id}/status:
 *   patch:
 *     tags:
 *       - Admin Badge Management
 *     summary: Update badge status
 *     description: Update badge status (active/inactive)
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Badge ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: New badge status
 *     responses:
 *       200:
 *         description: Badge status updated successfully
 *       404:
 *         description: Badge not found
 */
exports.updateAdminBadgeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const badge = await badgeService.updateBadgeStatus(req.params.id, status, req.user.id);
    return res.json(ApiResponse.success(badge, `Badge ${status === 'active' ? 'activated' : 'deactivated'} successfully`));
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /admin/badges/{id}:
 *   delete:
 *     tags:
 *       - Admin Badge Management
 *     summary: Delete badge
 *     description: Delete badge (admin only) - only if not awarded to any users
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Badge ID
 *     responses:
 *       200:
 *         description: Badge deleted successfully
 *       400:
 *         description: Badge cannot be deleted (in use by users)
 *       404:
 *         description: Badge not found
 */
exports.deleteAdminBadge = async (req, res, next) => {
  try {
    const result = await badgeService.deleteBadge(req.params.id);
    return res.json(ApiResponse.success(null, result.message));
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /admin/badge-requests:
 *   get:
 *     tags:
 *       - Admin Badge Management
 *     summary: Get badge requests
 *     description: Get all badge requests with pagination and filtering
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in badge title or user name/email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [requested, approved, rejected, all]
 *           default: all
 *         description: Filter by request status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [requestedAt, approvedAt, rejectedAt]
 *           default: requestedAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Badge requests retrieved successfully
 */
exports.getAdminBadgeRequests = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || '',
      status: req.query.status || 'all',
      sortBy: req.query.sortBy || 'requestedAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await badgeService.getBadgeRequests(options);

    return res.json(ApiResponse.success(
      {
        badgeRequests: result.badgeRequests,
        pagination: result.pagination
      },
      'Badge requests retrieved successfully'
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /admin/badge-requests/{id}/approve:
 *   patch:
 *     tags:
 *       - Admin Badge Management
 *     summary: Approve badge request
 *     description: Approve a pending badge request
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Badge request ID
 *     responses:
 *       200:
 *         description: Badge request approved successfully
 *       404:
 *         description: Badge request not found
 *       400:
 *         description: Invalid request status
 */
exports.approveAdminBadgeRequest = async (req, res, next) => {
  try {
    const request = await badgeService.approveBadgeRequest(req.params.id, req.user.id);
    return res.json(ApiResponse.success(request, 'Badge request approved successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /admin/badge-requests/{id}/reject:
 *   patch:
 *     tags:
 *       - Admin Badge Management
 *     summary: Reject badge request
 *     description: Reject a pending badge request with optional reason
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Badge request ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 description: Reason for rejection
 *     responses:
 *       200:
 *         description: Badge request rejected successfully
 *       404:
 *         description: Badge request not found
 *       400:
 *         description: Invalid request status
 */
exports.rejectAdminBadgeRequest = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const request = await badgeService.rejectBadgeRequest(req.params.id, reason, req.user.id);
    return res.json(ApiResponse.success(request, 'Badge request rejected successfully'));
  } catch (err) {
    next(err);
  }
}; 

/**
 * @openapi
 * /admin/badge-requests/{id}:
 *   get:
 *     tags:
 *       - Admin Badge Management
 *     summary: Get badge request details
 *     description: Get detailed information about a specific badge request
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Badge request ID
 *     responses:
 *       200:
 *         description: Badge request details retrieved successfully
 *       404:
 *         description: Badge request not found
 */
exports.getAdminBadgeRequestDetails = async (req, res, next) => {
  try {
    const request = await badgeService.getBadgeRequestDetails(req.params.id);
    return res.json(ApiResponse.success(request, 'Badge request details retrieved successfully'));
  } catch (err) {
    next(err);
  }
}; 