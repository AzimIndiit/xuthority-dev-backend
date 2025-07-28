const UserBadge = require('../models/UserBadge');
const Badge = require('../models/Badge');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { createNotification } = require('../services/notificationService');

// Vendor requests a badge
exports.requestBadge = async (req, res, next) => {
  try {
    const { badgeId, reason } = req.body;
    console.log('Requesting badge:', { userId: req.user._id, badgeId, reason });
    
    // Only allow vendor
    if (req.user.role !== 'vendor') {
      return next(new ApiError('Only vendors can request badges', 'FORBIDDEN', 403));
    }
    
    // Prevent duplicate requests (regardless of status)
    const existing = await UserBadge.findOne({ userId: req.user._id, badgeId });
    console.log('Existing badge request found:', existing);
    
    if (existing) {
      console.log('Duplicate badge request found:', existing);
      return next(new ApiError('Badge already requested or assigned', 'DUPLICATE_REQUEST', 400));
    }
    
    const userBadge = await UserBadge.create({ userId: req.user._id, badgeId, reason });
    console.log('Created new badge request:', userBadge);
    // Send badge request notification
    const badge = await Badge.findById(badgeId);
    await createNotification({
      userId: req.user._id,
      type: 'BADGE_REQUEST',
      title: 'Badge Request Submitted',
      message: `Your request for the badge "${badge.title}" has been submitted. We will notify you once it is reviewed.`,
      meta: { badgeId },
      actionUrl: '/profile/my-badges'
    });
    return res.status(201).json(ApiResponse.success(userBadge, 'Badge request submitted'));
  } catch (err) {
    console.error('Error in requestBadge:', err);
    next(err);
  }
};

// Get all badges for a user (for profile/public profile)
exports.getUserBadges = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;
    const userBadges = await UserBadge.find({ userId }).populate('badgeId');
    
    // Format for stats: total, and badge media URLs
    // Filter out badges where badgeId is null (in case of deleted badges)
    const badges = userBadges
      .filter(ub => ub.badgeId) // Filter out null badge references
      .map(ub => ({
        badgeId: ub.badgeId._id,
        title: ub.badgeId.title,
        icon: ub.badgeId.icon,
        colorCode: ub.badgeId.colorCode,
        description: ub.badgeId.description,
        status: ub.status
      }));
    
    return res.json(ApiResponse.success(badges, 'User badges retrieved'));
  } catch (err) {
    next(err);
  }
};

// Admin approves a badge request
exports.approveBadgeRequest = async (req, res, next) => {
  try {
    // First check if the badge request exists and is in the right status
    const existingUserBadge = await UserBadge.findById(req.params.id);
    if (!existingUserBadge) {
      return next(new ApiError('Badge request not found', 'NOT_FOUND', 404));
    }
    
    if (existingUserBadge.status !== 'requested') {
      return next(new ApiError('Only pending requests can be approved', 'INVALID_STATUS', 400));
    }

    // Update the badge request status
    const userBadge = await UserBadge.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: req.user?.id || req.user?._id // Handle both admin auth types
      },
      { new: true }
    ).populate('badgeId');

    if (!userBadge) {
      return next(new ApiError('Badge request not found', 'NOT_FOUND', 404));
    }

    // Increment the badge's earnedBy count
    await Badge.findByIdAndUpdate(
      userBadge.badgeId._id,
      { $inc: { earnedBy: 1 } }
    );

    // Send badge approved notification
    await createNotification({
      userId: userBadge.userId,
      type: 'BADGE_STATUS',
      title: 'New Badge Approved!',
      message: `Congratulations! You've earned the "${userBadge.badgeId.title}" badge for your contributions.`,
      meta: { badgeId: userBadge.badgeId._id },
      actionUrl: '/profile/my-badges'
    });

    return res.json(ApiResponse.success(userBadge, 'Badge request approved'));
  } catch (err) {
    next(err);
  }
};

// Vendor cancels a badge request
exports.cancelBadgeRequest = async (req, res, next) => {
  try {
    // First, find the current badge request to check its status
    const existingUserBadge = await UserBadge.findOne({
      _id: req.params.id, 
      userId: req.user.id
    }).populate('badgeId');

    if (!existingUserBadge) {
      return next(new ApiError('Badge request not found', 'NOT_FOUND', 404));
    }

    // Check if the badge was previously approved
    const wasApproved = existingUserBadge.status === 'approved';

    // Update the badge request status to canceled
    const userBadge = await UserBadge.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { 
        status: 'canceled',
        canceledAt: new Date()
      },
      { new: true }
    ).populate('badgeId');

    // If the badge was approved, we need to decrement the earnedBy count
    if (wasApproved && userBadge.badgeId) {
      await Badge.findByIdAndUpdate(
        userBadge.badgeId._id,
        { $inc: { earnedBy: -1 } }
      );
      console.log(`Decremented earnedBy count for badge: ${userBadge.badgeId.title}`);
    }

    return res.json(ApiResponse.success(userBadge, 'Badge request canceled'));
  } catch (err) {
    next(err);
  }
}; 