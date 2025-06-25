const followService = require('../services/followService');
const apiResponse = require('../utils/apiResponse');
const { logEvent } = require('../services/auditService');



/**
 * @openapi
 * /followers/{userId}/remove:
 *   delete:
 *     summary: Remove a follower
 *     tags:
 *       - Follow
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the follower to remove
 *     responses:
 *       200:
 *         description: Successfully removed follower
 *       400:
 *         description: User is not a follower
 *       404:
 *         description: User not found
 */
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


/**
 * @openapi
 * /users/{userId}/followers:
 *   get:
 *     summary: Get a specific user's followers (public)
 *     tags:
 *       - Follow
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for filtering followers
 *     responses:
 *       200:
 *         description: User followers retrieved successfully
 */
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

/**
 * @openapi
 * /users/{userId}/following:
 *   get:
 *     summary: Get a specific user's following (public)
 *     tags:
 *       - Follow
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for filtering following
 *     responses:
 *       200:
 *         description: User following retrieved successfully
 */
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

/**
 * @openapi
 * /follow/status/{userId}:
 *   get:
 *     summary: Check if current user is following a specific user
 *     tags:
 *       - Follow
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to check
 *     responses:
 *       200:
 *         description: Follow status retrieved
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
 *                     isFollowing:
 *                       type: boolean
 *                     userId:
 *                       type: string
 */
// exports.getFollowStatus = async (req, res, next) => {
//   try {
//     const followerId = req.user._id.toString();
//     const followingId = req.params.userId;

//     const isFollowing = await followService.isFollowing(followerId, followingId);

//     return res.json(apiResponse.success(
//       { isFollowing, userId: followingId },
//       'Follow status retrieved successfully'
//     ));
//   } catch (err) {
//     next(err);
//   }
// };

/**
 * @openapi
 * /users/{userId}/stats:
 *   get:
 *     summary: Get follow statistics for a user
 *     tags:
 *       - Follow
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Follow stats retrieved successfully
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
 *                     followers:
 *                       type: number
 *                     following:
 *                       type: number
 */
exports.getFollowStats = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    const stats = await followService.getFollowStats(userId);

    return res.json(apiResponse.success(stats, 'Follow stats retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /follow/toggle/{userId}:
 *   post:
 *     summary: Toggle follow/unfollow a user
 *     description: Follows a user if not already following, unfollows if already following
 *     tags:
 *       - Follow
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to follow/unfollow
 *     responses:
 *       200:
 *         description: Successfully toggled follow status
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
 *                     action:
 *                       type: string
 *                       enum: [followed, unfollowed]
 *                       example: followed
 *                     isFollowing:
 *                       type: boolean
 *                       example: true
 *                     targetUser:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         followersCount:
 *                           type: number
 *                         followingCount:
 *                           type: number
 *                         isFollowing:
 *                           type: boolean
 *                 message:
 *                   type: string
 *                   example: Successfully followed John Doe
 *       400:
 *         description: Bad request (can't follow self, etc.)
 *       404:
 *         description: User not found
 */
exports.toggleFollow = async (req, res, next) => {
  try {
    const currentUserId = req.user._id.toString();
    const targetUserId = req.params.userId;

    // Prevent users from following themselves
    if (currentUserId === targetUserId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot follow yourself',
          code: 'CANNOT_FOLLOW_SELF',
          statusCode: 400
        }
      });
    }

    const result = await followService.toggleFollow(currentUserId, targetUserId);

    await logEvent({
      user: req.user,
      action: result.action === 'followed' ? 'FOLLOW_USER' : 'UNFOLLOW_USER',
      target: 'User',
      targetId: targetUserId,
      details: { 
        targetUserId,
        action: result.action,
        isFollowing: result.isFollowing
      },
      req,
    });

    const message = result.action === 'followed' 
      ? `Successfully followed ${result.targetUser.firstName} ${result.targetUser.lastName}`
      : `Successfully unfollowed ${result.targetUser.firstName} ${result.targetUser.lastName}`;

    return res.json(apiResponse.success(result, message));
  } catch (err) {
    next(err);
  }
}; 