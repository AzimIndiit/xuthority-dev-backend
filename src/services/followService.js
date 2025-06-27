const mongoose = require('mongoose');
const { Follow } = require('../models');
const { User } = require('../models');
const ApiError = require('../utils/apiError');
const { createNotification } = require('../services/notificationService');
const Notification = require('../models/Notification');

/**
 * Toggle follow/unfollow user with count updates
 * @param {string} currentUserId - ID of user performing the action
 * @param {string} targetUserId - ID of user being followed/unfollowed
 * @returns {Object} Result with action and user details
 */
const toggleFollow = async (currentUserId, targetUserId) => {
  // Use transactions only if not in test environment or if replica set is available
  const useTransactions = process.env.NODE_ENV !== 'test';
  
  if (useTransactions) {
    return await toggleFollowWithTransaction(currentUserId, targetUserId);
  } else {
    return await toggleFollowWithoutTransaction(currentUserId, targetUserId);
  }
};

/**
 * Toggle follow with transaction support
 */
const toggleFollowWithTransaction = async (currentUserId, targetUserId) => {
  const session = await mongoose.startSession();
  
  try {
    await session.startTransaction();

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new ApiError('Target user not found', 'USER_NOT_FOUND', 404);
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: currentUserId,
      following: targetUserId
    });

    let action, isFollowing;

    if (existingFollow) {
      // Unfollow - remove follow relationship
      await Follow.deleteOne({
        follower: currentUserId,
        following: targetUserId
      }, { session });

      // Update counts
      await User.findByIdAndUpdate(
        currentUserId,
        { $inc: { followingCount: -1 } },
        { session }
      );

      await User.findByIdAndUpdate(
        targetUserId,
        { $inc: { followersCount: -1 } },
        { session }
      );

      action = 'unfollowed';
      isFollowing = false;
      // Mark follow notification as read if it exists
      await Notification.findOneAndUpdate({
        userId: targetUserId,
        type: 'FOLLOW',
        'meta.followerId': currentUserId,
        isRead: false
      }, { isRead: true });
    } else {
      // Follow - create follow relationship
      await Follow.create([{
        follower: currentUserId,
        following: targetUserId
      }], { session });

      // Update counts
      await User.findByIdAndUpdate(
        currentUserId,
        { $inc: { followingCount: 1 } },
        { session }
      );

      await User.findByIdAndUpdate(
        targetUserId,
        { $inc: { followersCount: 1 } },
        { session }
      );

      action = 'followed';
      isFollowing = true;
      // Only create notification if one does not already exist
      const existingNotif = await Notification.findOne({
        userId: targetUserId,
        type: 'FOLLOW',
        'meta.followerId': currentUserId,
        isRead: false
      });
      if (!existingNotif) {
        const follower = await User.findById(currentUserId);
        await createNotification({
          userId: targetUserId,
          type: 'FOLLOW',
          title: 'New Follower',
          message: `${follower.firstName} ${follower.lastName} has started following your profile. Keep them engaged by sharing updates.`,
          meta: { followerId: currentUserId },
          actionUrl: `/users/${currentUserId}`
        });
      }
    }

    // Get updated target user data
    const updatedTargetUser = await User.findById(targetUserId)
      .select('firstName lastName email followersCount followingCount');

    await session.commitTransaction();

    return {
      action,
      isFollowing,
      targetUser: {
        ...updatedTargetUser.toObject(),
        isFollowing
      }
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Toggle follow without transaction (for test environments)
 */
const toggleFollowWithoutTransaction = async (currentUserId, targetUserId) => {
  try {
    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new ApiError('Target user not found', 'USER_NOT_FOUND', 404);
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: currentUserId,
      following: targetUserId
    });

    let action, isFollowing;

    if (existingFollow) {
      // Unfollow - remove follow relationship
      await Follow.deleteOne({
        follower: currentUserId,
        following: targetUserId
      });

      // Update counts
      await User.findByIdAndUpdate(
        currentUserId,
        { $inc: { followingCount: -1 } }
      );

      await User.findByIdAndUpdate(
        targetUserId,
        { $inc: { followersCount: -1 } }
      );

      action = 'unfollowed';
      isFollowing = false;
      // Mark follow notification as read if it exists
      await Notification.findOneAndUpdate({
        userId: targetUserId,
        type: 'FOLLOW',
        'meta.followerId': currentUserId,
        isRead: false
      }, { isRead: true });
    } else {
      // Follow - create follow relationship
      await Follow.create({
        follower: currentUserId,
        following: targetUserId
      });

      // Update counts
      await User.findByIdAndUpdate(
        currentUserId,
        { $inc: { followingCount: 1 } }
      );

      await User.findByIdAndUpdate(
        targetUserId,
        { $inc: { followersCount: 1 } }
      );

      action = 'followed';
      isFollowing = true;
      // Only create notification if one does not already exist
      const existingNotif = await Notification.findOne({
        userId: targetUserId,
        type: 'FOLLOW',
        'meta.followerId': currentUserId,
        isRead: false
      });
      if (!existingNotif) {
        const follower = await User.findById(currentUserId);
        await createNotification({
          userId: targetUserId,
          type: 'FOLLOW',
          title: 'New Follower',
          message: `${follower.firstName} ${follower.lastName} has started following your profile. Keep them engaged by sharing updates.`,
          meta: { followerId: currentUserId },
          actionUrl: `/users/${currentUserId}`
        });
      }
    }

    // Get updated target user data
    const updatedTargetUser = await User.findById(targetUserId)
      .select('firstName lastName email followersCount followingCount');

    return {
      action,
      isFollowing,
      targetUser: {
        ...updatedTargetUser.toObject(),
        isFollowing
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get followers or following list with pagination and search
 * @param {Object} options - Query options
 * @returns {Object} Paginated list with metadata
 */
const getFollowList = async (options) => {
  const {
    type,
    userId,
    currentUserId,
    page,
    limit,
    search
  } = options;

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
  }

  // Build aggregation pipeline
  const matchStage = type === 'followers' 
    ? { following: new mongoose.Types.ObjectId(userId) }
    : { follower: new mongoose.Types.ObjectId(userId) };

  const lookupField = type === 'followers' ? 'follower' : 'following';

  // Build search filter
  const searchFilter = search ? {
    $or: [
      { 'user.firstName': { $regex: search, $options: 'i' } },
      { 'user.lastName': { $regex: search, $options: 'i' } },
      { 'user.email': { $regex: search, $options: 'i' } }
    ]
  } : {};

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'users',
        localField: lookupField,
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $match: {
        ...searchFilter
      }
    },
    {
      $lookup: {
        from: 'follows',
        let: { userId: '$user._id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$follower', new mongoose.Types.ObjectId(currentUserId)] },
                  { $eq: ['$following', '$$userId'] }
                ]
              }
            }
          }
        ],
        as: 'currentUserFollows'
      }
    },
    {
      $project: {
        _id: '$user._id',
        firstName: '$user.firstName',
        lastName: '$user.lastName',
        email: '$user.email',
        followersCount: '$user.followersCount',
        followingCount: '$user.followingCount',
        isFollowing: { $gt: [{ $size: '$currentUserFollows' }, 0] },
        createdAt: '$createdAt'
      }
    },
    { $sort: { createdAt: -1 } }
  ];

  // Get total count
  const totalPipeline = [...pipeline, { $count: 'total' }];
  const totalResult = await Follow.aggregate(totalPipeline);
  const total = totalResult[0]?.total || 0;

  // Get paginated results
  const skip = (page - 1) * limit;
  const dataPipeline = [
    ...pipeline,
    { $skip: skip },
    { $limit: limit }
  ];

  const data = await Follow.aggregate(dataPipeline);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get follow statistics for a user
 * @param {string} userId - User ID
 * @param {string} currentUserId - Current user ID (optional)
 * @returns {Object} Follow statistics
 */
const getFollowStats = async (userId, currentUserId) => {
  const user = await User.findById(userId)
    .select('followersCount followingCount');
  
  if (!user) {
    throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
  }

  const stats = {
    followersCount: user.followersCount,
    followingCount: user.followingCount
  };

  // Add follow status if current user is provided
  if (currentUserId && currentUserId !== userId) {
    const followStatus = await getFollowStatus(currentUserId, userId);
    stats.isFollowing = followStatus.isFollowing;
    stats.isFollowedBy = followStatus.isFollowedBy;
  }

  return stats;
};

/**
 * Get follow status between two users
 * @param {string} currentUserId - Current user ID
 * @param {string} targetUserId - Target user ID
 * @returns {Object} Follow status
 */
const getFollowStatus = async (currentUserId, targetUserId) => {
  const [isFollowing, isFollowedBy] = await Promise.all([
    Follow.exists({ follower: currentUserId, following: targetUserId }),
    Follow.exists({ follower: targetUserId, following: currentUserId })
  ]);

  return {
    isFollowing: !!isFollowing,
    isFollowedBy: !!isFollowedBy
  };
};

/**
 * Get followers for a user
 * @param {string} userId - User ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {string} search - Search term
 * @returns {Object} Paginated followers list
 */
const getFollowers = async (userId, page, limit, search) => {
  return await getFollowList({
    type: 'followers',
    userId,
    currentUserId: userId, // For isFollowing status
    page,
    limit,
    search
  });
};

/**
 * Get following for a user
 * @param {string} userId - User ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {string} search - Search term
 * @returns {Object} Paginated following list
 */
const getFollowing = async (userId, page, limit, search) => {
  return await getFollowList({
    type: 'following',
    userId,
    currentUserId: userId, // For isFollowing status
    page,
    limit,
    search
  });
};

module.exports = {
  toggleFollow,
  getFollowList,
  getFollowStats,
  getFollowStatus,
  getFollowers,
  getFollowing
}; 