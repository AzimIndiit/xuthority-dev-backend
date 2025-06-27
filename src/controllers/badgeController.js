const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

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