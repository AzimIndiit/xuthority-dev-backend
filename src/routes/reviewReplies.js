const express = require('express');
const router = express.Router();
const reviewReplyController = require('../controllers/reviewReplyController');
const { auth, authorize, validate } = require('../middleware');
const { reviewReplyValidator } = require('../validators');

/**
 * @openapi
 * /reviews/{reviewId}/replies:
 *   post:
 *     summary: Create a new reply to a review
 *     tags: [Review Replies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: ID of the review to reply to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 2000
 *                 description: Reply content
 *               replyType:
 *                 type: string
 *                 enum: [user, vendor, admin]
 *                 default: user
 *                 description: Type of reply
 *               parentReply:
 *                 type: string
 *                 format: objectId
 *                 description: ID of parent reply (for nested replies)
 *     responses:
 *       201:
 *         description: Reply created successfully
 *       400:
 *         description: Validation error or cannot reply to non-approved review
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review not found
 */
// Create a new reply to a review (authenticated users only)
router.post('/reviews/:reviewId/replies', 
  auth, 
  validate(reviewReplyValidator.create), 
  reviewReplyController.createReply
);

/**
 * @openapi
 * /reviews/{reviewId}/replies:
 *   get:
 *     summary: Get all replies for a specific review
 *     tags: [Review Replies]
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: ID of the review
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
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, helpfulVotes.count]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *       - in: query
 *         name: replyType
 *         schema:
 *           type: string
 *           enum: [user, vendor, admin]
 *         description: Filter by reply type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, flagged]
 *           default: approved
 *         description: Filter by reply status
 *     responses:
 *       200:
 *         description: Replies retrieved successfully
 *       404:
 *         description: Review not found
 */
// Get all replies for a specific review (public)
router.get('/reviews/:reviewId/replies', 
  validate(reviewReplyValidator.getByReview), 
  reviewReplyController.getRepliesForReview
);

/**
 * @openapi
 * /replies:
 *   get:
 *     summary: Get all replies (admin only)
 *     tags: [Review Replies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, flagged]
 *         description: Filter by reply status
 *       - in: query
 *         name: replyType
 *         schema:
 *           type: string
 *           enum: [user, vendor, admin]
 *         description: Filter by reply type
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, helpfulVotes.count]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: All replies retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
// Get all replies (admin only)
router.get('/replies', 
  auth, 
  authorize('admin'), 
  validate(reviewReplyValidator.listAll), 
  reviewReplyController.getAllReplies
);

/**
 * @openapi
 * /replies/{id}:
 *   get:
 *     summary: Get a single reply by ID
 *     tags: [Review Replies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Reply ID
 *     responses:
 *       200:
 *         description: Reply retrieved successfully
 *       404:
 *         description: Reply not found
 */
// Get single reply by ID (public)
router.get('/replies/:id', 
  validate(reviewReplyValidator.getById), 
  reviewReplyController.getReplyById
);

/**
 * @openapi
 * /replies/{id}:
 *   put:
 *     summary: Update a reply (author only)
 *     tags: [Review Replies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Reply ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 2000
 *                 description: Updated reply content
 *     responses:
 *       200:
 *         description: Reply updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Can only update own replies
 *       404:
 *         description: Reply not found
 */
// Update reply (author only)
router.put('/replies/:id', 
  auth, 
  validate(reviewReplyValidator.update), 
  reviewReplyController.updateReply
);

/**
 * @openapi
 * /replies/{id}:
 *   delete:
 *     summary: Delete a reply (author or admin only)
 *     tags: [Review Replies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Reply ID
 *     responses:
 *       200:
 *         description: Reply deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Can only delete own replies
 *       404:
 *         description: Reply not found
 */
// Delete reply (author or admin only)
router.delete('/replies/:id', 
  auth, 
  validate(reviewReplyValidator.delete), 
  reviewReplyController.deleteReply
);

/**
 * @openapi
 * /replies/{id}/helpful:
 *   post:
 *     summary: Vote reply as helpful
 *     tags: [Review Replies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Reply ID
 *     responses:
 *       200:
 *         description: Vote added successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Reply not found
 *       409:
 *         description: Already voted
 */
// Vote helpful on a reply (authenticated users only)
router.post('/replies/:id/helpful', 
  auth, 
  validate(reviewReplyValidator.helpfulVote), 
  reviewReplyController.voteHelpful
);

/**
 * @openapi
 * /replies/{id}/helpful:
 *   delete:
 *     summary: Remove helpful vote from reply
 *     tags: [Review Replies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Reply ID
 *     responses:
 *       200:
 *         description: Vote removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Reply or vote not found
 */
// Remove helpful vote from a reply (authenticated users only)
router.delete('/replies/:id/helpful', 
  auth, 
  validate(reviewReplyValidator.helpfulVote), 
  reviewReplyController.removeHelpfulVote
);

module.exports = router; 