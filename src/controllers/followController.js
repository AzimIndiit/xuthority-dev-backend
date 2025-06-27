const followService = require('../services/followService');
const apiResponse = require('../utils/apiResponse');
const { logEvent } = require('../services/auditService');

exports.toggleFollow = async (req, res, next) => {
  try {
    const followerId = req.user._id.toString();
    const followingId = req.params.userId;

    const result = await followService.toggleFollow(followerId, followingId);

    await logEvent({
      user: req.user,
      action: result.action.toUpperCase(),
      target: 'User',
      targetId: followingId,
      details: { 
        action: result.action,
        isFollowing: result.isFollowing,
        targetUserId: followingId
      },
      req,
    });

    return res.json(apiResponse.success(result, result.message));
  } catch (err) {
    next(err);
  }
};

exports.removeFollower = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const followerId = req.params.userId;

    const result = await followService.removeFollower(userId, followerId);

    await logEvent({
      user: req.user,
      action: 'REMOVE_FOLLOWER',
      target: 'User',
      targetId: followerId,
      details: { followerId },
      req,
    });

    return res.json(apiResponse.success(result, result.message));
  } catch (err) {
    next(err);
  }
};

exports.getUserFollowers = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const search = req.query.search || '';

    const result = await followService.getFollowers(userId, page, limit, search);

    return res.json(apiResponse.success(result, 'User followers retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getUserFollowing = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const search = req.query.search || '';

    const result = await followService.getFollowing(userId, page, limit, search);

    return res.json(apiResponse.success(result, 'User following retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getFollowStats = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const stats = await followService.getFollowStats(userId);

    return res.json(apiResponse.success(stats, 'Follow statistics retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getFollowStatus = async (req, res, next) => {
  try {
    const followerId = req.user._id.toString();
    const followingId = req.params.userId;

    const isFollowing = await followService.isFollowing(followerId, followingId);

    return res.json(apiResponse.success({
      isFollowing,
      userId: followingId
    }, 'Follow status retrieved successfully'));
  } catch (err) {
    next(err);
  }
}; 