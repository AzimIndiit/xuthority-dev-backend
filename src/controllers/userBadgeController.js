const UserBadge = require('../models/UserBadge');
const Badge = require('../models/Badge');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

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
    return res.status(201).json(ApiResponse.success(userBadge, 'Badge request submitted'));
  } catch (err) {
    console.error('Error in requestBadge:', err);
    next(err);
  }
};

// Get all badges for a user (for profile/public profile)
exports.getUserBadges = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user.id;
    const userBadges = await UserBadge.find({ userId, status: 'accepted' }).populate('badgeId');
    // Format for stats: total, and badge media URLs
    const badges = userBadges.map(ub => ({
      badgeId: ub.badgeId._id,
      title: ub.badgeId.title,
      icon: ub.badgeId.icon,
      colorCode: ub.badgeId.colorCode,
      description: ub.badgeId.description,
      status: ub.status
    }));
    return res.json(ApiResponse.success({ total: badges.length, badges }, 'User badges retrieved'));
  } catch (err) {
    next(err);
  }
};

// Admin approves a badge request
exports.approveBadgeRequest = async (req, res, next) => {
  try {
    const userBadge = await UserBadge.findByIdAndUpdate(
      req.params.id,
      { status: 'accepted' },
      { new: true }
    ).populate('badgeId');
    if (!userBadge) return next(new ApiError('Badge request not found', 'NOT_FOUND', 404));
    return res.json(ApiResponse.success(userBadge, 'Badge request approved'));
  } catch (err) {
    next(err);
  }
};

// Vendor cancels a badge request
exports.cancelBadgeRequest = async (req, res, next) => {
  try {
    const userBadge = await UserBadge.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: 'canceled' },
      { new: true }
    );
    if (!userBadge) return next(new ApiError('Badge request not found', 'NOT_FOUND', 404));
    return res.json(ApiResponse.success(userBadge, 'Badge request canceled'));
  } catch (err) {
    next(err);
  }
}; 