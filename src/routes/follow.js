const express = require('express');
const followController = require('../controllers/followController');
const auth = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validation');
const { mongoIdValidator } = require('../validators/commonValidator');

const router = express.Router();

// Apply rate limiting to all follow routes
router.use(rateLimiter);


/**
 * @openapi
 * follow/toggle/{userId}:
 *   post:
 *     summary: Toggle follow/unfollow a user
 *     description: Follow or unfollow a user. If already following, it will unfollow. If not following, it will follow.
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: ID of the user to follow/unfollow
 *     responses:
 *       200:
 *         description: Follow status toggled successfully
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
 *                       description: The action performed
 *                     isFollowing:
 *                       type: boolean
 *                       description: Current follow status after toggle
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         username:
 *                           type: string
 *                         followersCount:
 *                           type: number
 *                         followingCount:
 *                           type: number
 *                 message:
 *                   type: string
 *                   example: "Successfully followed user"
 *       400:
 *         description: Invalid user ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Target user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/**
 * @openapi
 * follow/toggle/{userId}:
 *   post:
 *     tags:
 *       - Follow
 *     summary: Toggle follow status for a user
 *     description: Follow or unfollow a user. If not following, will follow. If already following, will unfollow.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: ID of the user to follow/unfollow
 *     responses:
 *       200:
 *         description: Follow status toggled successfully
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
 *                       description: The action performed
 *                     isFollowing:
 *                       type: boolean
 *                       description: Current follow status after toggle
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         username:
 *                           type: string
 *                         followersCount:
 *                           type: number
 *                         followingCount:
 *                           type: number
 *                 message:
 *                   type: string
 *                   example: "Successfully followed user"
 *       400:
 *         description: Invalid user ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Target user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/toggle/:userId', 
  auth, 
  validate(mongoIdValidator, 'params'), 
  followController.toggleFollow
);

// Public routes - no authentication required
router.get('/:userId/followers', 
  validate(mongoIdValidator, 'params'), 
  followController.getUserFollowers
);

router.get('/:userId/following', 
  validate(mongoIdValidator, 'params'), 
  followController.getUserFollowing
);

/**
 * @openapi
 * follow/{userId}/stats:
 *   get:
 *     summary: Get user's follow statistics
 *     description: Retrieve follow statistics for the specified user including follower and following counts
 *     tags: [Follow]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: ID of the user whose statistics to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved follow statistics
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
 *                     followersCount:
 *                       type: number
 *                       description: Number of users following this user
 *                     followingCount:
 *                       type: number
 *                       description: Number of users this user is following
 *                 message:
 *                   type: string
 *                   example: "Follow statistics retrieved successfully"
 *       400:
 *         description: Invalid user ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:userId/stats', 
  validate(mongoIdValidator, 'params'), 
  followController.getFollowStats
);

module.exports = router; 