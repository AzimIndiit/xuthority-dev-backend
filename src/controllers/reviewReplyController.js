const asyncHandler = require('express-async-handler');
const reviewReplyService = require('../services/reviewReplyService');

/**
 * @openapi
 * /api/v1/reviews/{reviewId}/replies:
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
const createReply = asyncHandler(async (req, res) => {
  const result = await reviewReplyService.createReply(req.params.reviewId, req.body, req.user.id);
  res.status(201).json(result);
});

/**
 * @openapi
 * /api/v1/reviews/{reviewId}/replies:
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
const getRepliesForReview = asyncHandler(async (req, res) => {
  const result = await reviewReplyService.getRepliesForReview(req.params.reviewId, req.query);
  res.json(result);
});

/**
 * @openapi
 * /api/v1/replies/{id}:
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
const getReplyById = asyncHandler(async (req, res) => {
  const result = await reviewReplyService.getReplyById(req.params.id);
  res.json(result);
});

/**
 * @openapi
 * /api/v1/replies/{id}:
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Can only update own replies
 *       404:
 *         description: Reply not found
 */
const updateReply = asyncHandler(async (req, res) => {
  const result = await reviewReplyService.updateReply(req.params.id, req.body, req.user.id);
  res.json(result);
});

/**
 * @openapi
 * /api/v1/replies/{id}:
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
const deleteReply = asyncHandler(async (req, res) => {
  const result = await reviewReplyService.deleteReply(req.params.id, req.user.id, req.user.role);
  res.json(result);
});

/**
 * @openapi
 * /api/v1/replies/{id}/helpful:
 *   post:
 *     summary: Vote a reply as helpful
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
const voteHelpful = asyncHandler(async (req, res) => {
  const result = await reviewReplyService.voteHelpful(req.params.id, req.user.id);
  res.json(result);
});

/**
 * @openapi
 * /api/v1/replies/{id}/helpful:
 *   delete:
 *     summary: Remove helpful vote from a reply
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
const removeHelpfulVote = asyncHandler(async (req, res) => {
  const result = await reviewReplyService.removeHelpfulVote(req.params.id, req.user.id);
  res.json(result);
});


/**
 * @openapi
 * /api/v1/replies:
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
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, flagged]
 *         description: Filter by status
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in reply content
 *     responses:
 *       200:
 *         description: Replies retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
const getAllReplies = asyncHandler(async (req, res) => {
  const result = await reviewReplyService.getAllReplies(req.query);
  res.json(result);
});



module.exports = {
  createReply,
  getRepliesForReview,
  getReplyById,
  updateReply,
  deleteReply,
  voteHelpful,
  removeHelpfulVote,
  getAllReplies
}; 