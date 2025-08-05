const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const User = require('../models/User');
const Admin = require('../models/Admin');
const ApiError = require('../utils/apiError');
const mongoose = require('mongoose');
const emailService = require('./emailService');
const config = require('../config');

/**
 * Get all badges with pagination and filtering for admin
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Badges and pagination info
 */
const getAdminBadges = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    // Build query
    const query = {};
    
    // Add search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } }
      ];
    }
    
    // Add status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries in parallel
    const [badges, total] = await Promise.all([
      Badge.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Badge.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages
    };

    return {
      badges,
      pagination
    };
  } catch (error) {
    throw new ApiError(`Failed to fetch badges: ${error.message}`, 'FETCH_BADGES_ERROR', 500);
  }
};

/**
 * Get badge by ID for admin
 * @param {string} badgeId - Badge ID
 * @returns {Promise<Object>} Badge data
 */
const getAdminBadgeById = async (badgeId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(badgeId)) {
      throw new ApiError('Invalid badge ID format', 'INVALID_BADGE_ID', 400);
    }

    const badge = await Badge.findById(badgeId)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .lean();

    if (!badge) {
      throw new ApiError('Badge not found', 'BADGE_NOT_FOUND', 404);
    }

    // Get additional stats
    const [requestsCount, activeUsersCount] = await Promise.all([
      UserBadge.countDocuments({ badgeId, status: 'requested' }),
      UserBadge.countDocuments({ badgeId, status: 'accepted' })
    ]);

    return {
      ...badge,
      stats: {
        requestsCount,
        activeUsersCount
      }
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(`Failed to fetch badge: ${error.message}`, 'FETCH_BADGE_ERROR', 500);
  }
};

/**
 * Create new badge
 * @param {Object} badgeData - Badge data
 * @param {string} adminId - Admin ID who created the badge
 * @returns {Promise<Object>} Created badge
 */
const createBadge = async (badgeData, adminId) => {
  try {
    // Check if badge with same title exists
    const existingBadge = await Badge.findOne({ 
      title: { $regex: new RegExp(`^${badgeData.title}$`, 'i') }
    });

    if (existingBadge) {
      throw new ApiError('Badge with this title already exists', 'BADGE_EXISTS', 400);
    }

    const badge = new Badge({
      ...badgeData,
      createdBy: adminId,
      updatedBy: adminId
    });

    await badge.save();

    return await Badge.findById(badge._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .lean();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.code === 11000) {
      throw new ApiError('Badge with this title already exists', 'BADGE_EXISTS', 400);
    }
    throw new ApiError(`Failed to create badge: ${error.message}`, 'CREATE_BADGE_ERROR', 500);
  }
};

/**
 * Update badge
 * @param {string} badgeId - Badge ID
 * @param {Object} updateData - Update data
 * @param {string} adminId - Admin ID who updated the badge
 * @returns {Promise<Object>} Updated badge
 */
const updateBadge = async (badgeId, updateData, adminId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(badgeId)) {
      throw new ApiError('Invalid badge ID format', 'INVALID_BADGE_ID', 400);
    }

    // Check if badge exists
    const existingBadge = await Badge.findById(badgeId);
    if (!existingBadge) {
      throw new ApiError('Badge not found', 'BADGE_NOT_FOUND', 404);
    }

    // Check if title is being updated and if it conflicts
    if (updateData.title && updateData.title !== existingBadge.title) {
      const titleConflict = await Badge.findOne({ 
        title: { $regex: new RegExp(`^${updateData.title}$`, 'i') },
        _id: { $ne: badgeId }
      });

      if (titleConflict) {
        throw new ApiError('Badge with this title already exists', 'BADGE_EXISTS', 400);
      }
    }

    const updatedBadge = await Badge.findByIdAndUpdate(
      badgeId,
      {
        ...updateData,
        updatedBy: adminId
      },
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email')
    .lean();

    return updatedBadge;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.code === 11000) {
      throw new ApiError('Badge with this title already exists', 'BADGE_EXISTS', 400);
    }
    throw new ApiError(`Failed to update badge: ${error.message}`, 'UPDATE_BADGE_ERROR', 500);
  }
};

/**
 * Update badge status
 * @param {string} badgeId - Badge ID
 * @param {string} status - New status (active/inactive)
 * @param {string} adminId - Admin ID who updated the status
 * @returns {Promise<Object>} Updated badge
 */
const updateBadgeStatus = async (badgeId, status, adminId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(badgeId)) {
      throw new ApiError('Invalid badge ID format', 'INVALID_BADGE_ID', 400);
    }

    if (!['active', 'inactive'].includes(status)) {
      throw new ApiError('Invalid status. Must be active or inactive', 'INVALID_STATUS', 400);
    }

    const badge = await Badge.findById(badgeId);
    if (!badge) {
      throw new ApiError('Badge not found', 'BADGE_NOT_FOUND', 404);
    }

    badge.status = status;
    badge.updatedBy = adminId;
    await badge.save();

    return await Badge.findById(badgeId)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .lean();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(`Failed to update badge status: ${error.message}`, 'UPDATE_STATUS_ERROR', 500);
  }
};

/**
 * Delete badge
 * @param {string} badgeId - Badge ID
 * @returns {Promise<Object>} Deletion result
 */
const deleteBadge = async (badgeId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(badgeId)) {
      throw new ApiError('Invalid badge ID format', 'INVALID_BADGE_ID', 400);
    }

    const badge = await Badge.findById(badgeId);
    if (!badge) {
      throw new ApiError('Badge not found', 'BADGE_NOT_FOUND', 404);
    }

    // Check if badge has any user associations
    const userBadgeCount = await UserBadge.countDocuments({ badgeId });
    if (userBadgeCount > 0) {
      throw new ApiError(
        'Cannot delete badge that has been awarded to users. Please deactivate instead.',
        'BADGE_IN_USE',
        400
      );
    }

    await Badge.findByIdAndDelete(badgeId);

    return {
      message: 'Badge deleted successfully',
      deletedBadge: badge
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(`Failed to delete badge: ${error.message}`, 'DELETE_BADGE_ERROR', 500);
  }
};

/**
 * Get badge requests with pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Badge requests and pagination info
 */
const getBadgeRequests = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      sortBy = 'requestedAt',
      sortOrder = 'desc'
    } = options;

    // Build simple query
    const query = {};
    
    // Add status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get badge requests with populated data
    const badgeRequests = await UserBadge.find(query)
      .populate('badgeId', 'title description icon colorCode status earnedBy')
      .populate('userId', 'firstName lastName email avatar role')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Transform the data to match frontend expectations
    const transformedRequests = badgeRequests.map(request => ({
      _id: request._id,
      userId: request.userId?._id || request.userId,
      badgeId: request.badgeId?._id || request.badgeId,
      reason: request.reason,
      status: request.status,
      requestedAt: request.createdAt,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      approvedAt: request.approvedAt,
      rejectedAt: request.rejectedAt,
      rejectionReason: request.rejectionReason,
      badge: {
        _id: request.badgeId?._id || request.badgeId,
        title: request.badgeId?.title || 'Unknown Badge',
        description: request.badgeId?.description || 'No description available',
        icon: request.badgeId?.icon || '🏆',
        colorCode: request.badgeId?.colorCode || '#3B82F6',
        earnedBy: request.badgeId?.earnedBy || 0
      },
      user: {
        _id: request.userId?._id || request.userId,
        firstName: request.userId?.firstName || '',
        lastName: request.userId?.lastName || '',
        email: request.userId?.email || '',
        avatar: request.userId?.avatar || '',
        role: request.userId?.role || 'user'
      }
    }));

    // Get total count
    const total = await UserBadge.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages
    };

    return {
      badgeRequests: transformedRequests,
      pagination
    };
  } catch (error) {
    throw new ApiError(`Failed to fetch badge requests: ${error.message}`, 'FETCH_REQUESTS_ERROR', 500);
  }
};

/**
 * Approve badge request
 * @param {string} requestId - User badge request ID
 * @param {string} adminId - Admin ID who approved the request
 * @returns {Promise<Object>} Updated request
 */
const approveBadgeRequest = async (requestId, adminId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      throw new ApiError('Invalid request ID format', 'INVALID_REQUEST_ID', 400);
    }

    const userBadge = await UserBadge.findById(requestId)
      .populate('badgeId')
      .populate('userId');
    
    if (!userBadge) {
      throw new ApiError('Badge request not found', 'REQUEST_NOT_FOUND', 404);
    }

    if (userBadge.status !== 'requested') {
      throw new ApiError('Only pending requests can be approved', 'INVALID_REQUEST_STATUS', 400);
    }

    // Update request status
    userBadge.status = 'approved';
    userBadge.approvedAt = new Date();
    userBadge.approvedBy = adminId;
    await userBadge.save();

    // Increment badge earned count
    await Badge.findByIdAndUpdate(
      userBadge.badgeId,
      { $inc: { earnedBy: 1 } }
    );

    // Send approval email
    try {
      const emailData = {
        user: {
          firstName: userBadge.userId.firstName || 'User',
          email: userBadge.userId.email
        },
        badge: {
          title: userBadge.badgeId.title,
          description: userBadge.badgeId.description,
          icon: userBadge.badgeId.icon || '🏆',
          colorCode: userBadge.badgeId.colorCode || '#667eea'
        },
        reason: userBadge.reason || '',
        profileUrl: `${config.app.frontendUrl}/profile/${userBadge.userId._id}`,
        appName: config.app.name || 'Xuthority',
        currentYear: new Date().getFullYear()
      };

      await emailService.sendTemplatedEmail({
        to: userBadge.userId.email,
        subject: `Congratulations! Your ${userBadge.badgeId.title} Badge Request Has Been Approved`,
        template: 'badge-request-approved.ejs',
        data: emailData
      });
    } catch (emailError) {
      // Log error but don't fail the approval
      console.error('Failed to send approval email:', emailError);
    }

    return await UserBadge.findById(requestId)
      .populate('badgeId', 'title description icon colorCode')
      .populate('userId', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .lean();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(`Failed to approve badge request: ${error.message}`, 'APPROVE_REQUEST_ERROR', 500);
  }
};

/**
 * Reject badge request
 * @param {string} requestId - User badge request ID
 * @param {string} reason - Rejection reason
 * @param {string} adminId - Admin ID who rejected the request
 * @returns {Promise<Object>} Updated request
 */
const rejectBadgeRequest = async (requestId, reason, adminId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      throw new ApiError('Invalid request ID format', 'INVALID_REQUEST_ID', 400);
    }

    const userBadge = await UserBadge.findById(requestId)
      .populate('badgeId')
      .populate('userId');
      
    if (!userBadge) {
      throw new ApiError('Badge request not found', 'REQUEST_NOT_FOUND', 404);
    }

    if (userBadge.status !== 'requested') {
      throw new ApiError('Only pending requests can be rejected', 'INVALID_REQUEST_STATUS', 400);
    }

    // Send rejection email before deleting
    try {
      const emailData = {
        user: {
          firstName: userBadge.userId.firstName || 'User',
          email: userBadge.userId.email
        },
        badge: {
          title: userBadge.badgeId.title,
          description: userBadge.badgeId.description,
          icon: userBadge.badgeId.icon || '🏆',
          colorCode: userBadge.badgeId.colorCode || '#667eea'
        },
        rejectionReason: reason || '',
        badgesUrl: `${config.app.frontendUrl}/badges`,
        appName: config.app.name || 'Xuthority',
        currentYear: new Date().getFullYear()
      };

      await emailService.sendTemplatedEmail({
        to: userBadge.userId.email,
        subject: `Update on Your ${userBadge.badgeId.title} Badge Request`,
        template: 'badge-request-rejected.ejs',
        data: emailData
      });
    } catch (emailError) {
      // Log error but don't fail the rejection
      console.error('Failed to send rejection email:', emailError);
    }

    // Delete the badge request instead of updating status
    await UserBadge.findByIdAndDelete(requestId);

    return {
      message: 'Badge request rejected and deleted successfully',
      requestId: requestId,
      reason: reason,
      deletedAt: new Date(),
      deletedBy: adminId
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(`Failed to reject badge request: ${error.message}`, 'REJECT_REQUEST_ERROR', 500);
  }
};

/**
 * Get badge request details by ID
 * @param {string} requestId - Badge request ID
 * @returns {Promise<Object>} Badge request details
 */
const getBadgeRequestDetails = async (requestId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      throw new ApiError('Invalid request ID format', 'INVALID_REQUEST_ID', 400);
    }

    const request = await UserBadge.findById(requestId)
      .populate('badgeId', 'title description icon colorCode criteria status earnedBy')
      .populate('userId', 'firstName lastName email avatar role')
      .populate('approvedBy', 'firstName lastName email')
      .populate('rejectedBy', 'firstName lastName email')
      .lean();

    if (!request) {
      throw new ApiError('Badge request not found', 'REQUEST_NOT_FOUND', 404);
    }

    // Transform the data to match frontend expectations
    const transformedRequest = {
      _id: request._id,
      userId: request.userId._id,
      badgeId: request.badgeId._id,
      reason: request.reason,
      status: request.status,
      requestedAt: request.createdAt,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      approvedAt: request.approvedAt,
      rejectedAt: request.rejectedAt,
      rejectionReason: request.rejectionReason,
      badge: {
        _id: request.badgeId._id,
        title: request.badgeId.title || 'Unknown Badge',
        description: request.badgeId.description || 'No description available',
        icon: request.badgeId.icon || '🏆',
        colorCode: request.badgeId.colorCode || '#3B82F6',
        earnedBy: request.badgeId.earnedBy || 0
      },
      user: {
        _id: request.userId._id,
        firstName: request.userId.firstName || '',
        lastName: request.userId.lastName || '',
        email: request.userId.email || '',
        avatar: request.userId.avatar || '',
        role: request.userId.role || 'user'
      },
      approvedBy: request.approvedBy ? {
        _id: request.approvedBy._id,
        firstName: request.approvedBy.firstName,
        lastName: request.approvedBy.lastName,
        email: request.approvedBy.email
      } : null,
      rejectedBy: request.rejectedBy ? {
        _id: request.rejectedBy._id,
        firstName: request.rejectedBy.firstName,
        lastName: request.rejectedBy.lastName,
        email: request.rejectedBy.email
      } : null
    };

    return transformedRequest;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(`Failed to fetch badge request details: ${error.message}`, 'FETCH_REQUEST_DETAILS_ERROR', 500);
  }
};

module.exports = {
  getAdminBadges,
  getAdminBadgeById,
  createBadge,
  updateBadge,
  deleteBadge,
  updateBadgeStatus,
  getBadgeRequests,
  approveBadgeRequest,
  rejectBadgeRequest,
  getBadgeRequestDetails
}; 