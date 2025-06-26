const asyncHandler = require('express-async-handler');
const productReviewService = require('../services/productReviewService');

/**
 * @openapi
 * /api/v1/product-reviews:
 *   post:
 *     summary: Create a new product review
 *     tags: [Product Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product
 *               - overallRating
 *               - title
 *               - content
 *             properties:
 *               product:
 *                 type: string
 *                 format: objectId
 *               overallRating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 5000
 *               subRatings:
 *                 type: object
 *                 properties:
 *                   easeOfUse:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 7
 *                   customerSupport:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 7
 *                   features:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 7
 *                   pricing:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 7
 *                   technicalSupport:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 7
 *               reviewSource:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Review already exists for this product
 */
const createProductReview = asyncHandler(async (req, res) => {
  const result = await productReviewService.createProductReview(req.body, req.user.id);
  res.status(201).json(result);
});

/**
 * @openapi
 * /api/v1/product-reviews:
 *   get:
 *     summary: Get all product reviews with filtering and pagination
 *     tags: [Product Reviews]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and content
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, flagged]
 *         description: Review status
 *       - in: query
 *         name: overallRating
 *         schema:
 *           type: array
 *           items:
 *             type: integer
 *             minimum: 1
 *             maximum: 5
 *         description: Filter by rating stars
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Minimum rating
 *       - in: query
 *         name: maxRating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Maximum rating
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *         description: Filter by verification status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [submittedAt, publishedAt, overallRating, helpfulVotes.count]
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: mention
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by popular mentions
 *       - in: query
 *         name: keywords
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by keywords
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 */
const getAllProductReviews = asyncHandler(async (req, res) => {
  const result = await productReviewService.getAllProductReviews(req.query);
  res.json(result);
});

/**
 * @openapi
 * /api/v1/product-reviews/product/{productId}:
 *   get:
 *     summary: Get reviews for a specific product
 *     tags: [Product Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *       - in: query
 *         name: overallRating
 *         schema:
 *           type: array
 *           items:
 *             type: integer
 *             minimum: 1
 *             maximum: 5
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [submittedAt, publishedAt, overallRating, helpfulVotes.count]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: mention
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by popular mentions
 *       - in: query
 *         name: keywords
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by keywords
 *     responses:
 *       200:
 *         description: Product reviews retrieved successfully
 *       404:
 *         description: Product not found
 */
const getProductReviews = asyncHandler(async (req, res) => {
  const result = await productReviewService.getProductReviews(req.params.productId, req.query);
  res.json(result);
});

/**
 * @openapi
 * /api/v1/product-reviews/{id}:
 *   get:
 *     summary: Get a single product review by ID
 *     tags: [Product Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *     responses:
 *       200:
 *         description: Review retrieved successfully
 *       404:
 *         description: Review not found
 */
const getProductReviewById = asyncHandler(async (req, res) => {
  const result = await productReviewService.getProductReviewById(req.params.id);
  res.json(result);
});

/**
 * @openapi
 * /api/v1/product-reviews/{id}:
 *   put:
 *     summary: Update a product review (owner only)
 *     tags: [Product Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               overallRating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 5000
 *               subRatings:
 *                 type: object
 *                 properties:
 *                   easeOfUse:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 7
 *                   customerSupport:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 7
 *                   features:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 7
 *                   pricing:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 7
 *                   technicalSupport:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 7
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Can only update own reviews
 *       404:
 *         description: Review not found
 */
const updateProductReview = asyncHandler(async (req, res) => {
  const result = await productReviewService.updateProductReview(req.params.id, req.body, req.user.id);
  res.json(result);
});

/**
 * @openapi
 * /api/v1/product-reviews/{id}:
 *   delete:
 *     summary: Delete a product review (owner or admin only)
 *     tags: [Product Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Can only delete own reviews
 *       404:
 *         description: Review not found
 */
const deleteProductReview = asyncHandler(async (req, res) => {
  const result = await productReviewService.deleteProductReview(req.params.id, req.user.id, req.user.role);
  res.json(result);
});

/**
 * @openapi
 * /api/v1/product-reviews/{id}/helpful:
 *   post:
 *     summary: Vote a review as helpful
 *     tags: [Product Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *     responses:
 *       200:
 *         description: Vote added successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review not found
 *       409:
 *         description: Already voted
 */
const voteHelpful = asyncHandler(async (req, res) => {
  const result = await productReviewService.voteHelpful(req.params.id, req.user.id);
  res.json(result);
});

/**
 * @openapi
 * /api/v1/product-reviews/{id}/helpful:
 *   delete:
 *     summary: Remove helpful vote from a review
 *     tags: [Product Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *     responses:
 *       200:
 *         description: Vote removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review or vote not found
 */
const removeHelpfulVote = asyncHandler(async (req, res) => {
  const result = await productReviewService.removeHelpfulVote(req.params.id, req.user.id);
  res.json(result);
});

/**
 * @openapi
 * /api/v1/product-reviews/{id}/moderate:
 *   patch:
 *     summary: Moderate a review (admin only)
 *     tags: [Product Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected, flagged]
 *               moderationNote:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Review moderated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Review not found
 */
const moderateReview = asyncHandler(async (req, res) => {
  const result = await productReviewService.moderateReview(req.params.id, req.body);
  res.json(result);
});

/**
 * @openapi
 * /api/v1/product-reviews/product/{productId}/stats:
 *   get:
 *     summary: Get review statistics for a product
 *     tags: [Product Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *     responses:
 *       200:
 *         description: Review statistics retrieved successfully
 *       404:
 *         description: Product not found
 */
const getProductReviewStats = asyncHandler(async (req, res) => {
  const result = await productReviewService.getProductReviewStats(req.params.productId);
  res.json(result);
});

module.exports = {
  createProductReview,
  getAllProductReviews,
  getProductReviews,
  getProductReviewById,
  updateProductReview,
  deleteProductReview,
  voteHelpful,
  removeHelpfulVote,
  moderateReview,
  getProductReviewStats
}; 