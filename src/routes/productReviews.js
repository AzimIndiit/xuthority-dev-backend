const express = require('express');
const router = express.Router();
const productReviewController = require('../controllers/productReviewController');
const { auth, authorize, validate } = require('../middleware');
const { productReviewValidator } = require('../validators');

/**
 * @openapi
 * /product-reviews:
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
// Create a new review (authenticated users only)
router.post('/', 
  auth, 
  validate(productReviewValidator.create), 
  productReviewController.createProductReview
);

/**
 * @openapi
 * /product-reviews:
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
// Get all reviews with filtering and pagination (public)
router.get('/', 
  validate(productReviewValidator.list), 
  productReviewController.getAllProductReviews
);

/**
 * @openapi
 * /product-reviews/product/{productId}:
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
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [submittedAt, publishedAt, overallRating, helpfulVotes.count]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Product reviews retrieved successfully
 *       404:
 *         description: Product not found
 */
// Get reviews for a specific product (public)
router.get('/product/:productId', 
  validate(productReviewValidator.listByProduct), 
  productReviewController.getProductReviews
);

/**
 * @openapi
 * /product-reviews/product/{productId}/my-review:
 *   get:
 *     summary: Get current user's review for a specific product
 *     tags: [Product Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *     responses:
 *       200:
 *         description: User's review retrieved successfully
 *       404:
 *         description: Review not found or product not found
 *       401:
 *         description: Unauthorized
 */
// Get current user's review for a specific product (authenticated users only)
router.get('/product/:productId/my-review', 
  auth,
  productReviewController.getUserReviewForProduct
);

/**
 * @openapi
 * /product-reviews/product/{productId}/stats:
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
// Get review statistics for a product (public)
router.get('/product/:productId/stats', 
  validate(productReviewValidator.getByProduct), 
  productReviewController.getProductReviewStats
);

/**
 * @openapi
 * /product-reviews/{id}:
 *   get:
 *     summary: Get single review by ID
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
// Get single review by ID (public)
router.get('/:id', 
  validate(productReviewValidator.getById), 
  productReviewController.getProductReviewById
);

/**
 * @openapi
 * /product-reviews/{id}:
 *   put:
 *     summary: Update review (owner only)
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
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Can only update own reviews
 *       404:
 *         description: Review not found
 */
// Update review (owner only)
router.put('/:id', 
  auth, 
  validate(productReviewValidator.update), 
  productReviewController.updateProductReview
);

/**
 * @openapi
 * /product-reviews/{id}:
 *   delete:
 *     summary: Delete review (owner or admin only)
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
// Delete review (owner or admin only)
router.delete('/:id', 
  auth, 
  validate(productReviewValidator.delete), 
  productReviewController.deleteProductReview
);

/**
 * @openapi
 * /product-reviews/{id}/helpful:
 *   post:
 *     summary: Vote review as helpful
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
// Vote helpful (authenticated users only)
router.post('/:id/helpful', 
  auth, 
  validate(productReviewValidator.helpfulVote), 
  productReviewController.voteHelpful
);

/**
 * @openapi
 * /product-reviews/{id}/helpful:
 *   delete:
 *     summary: Remove helpful vote from review
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
// Remove helpful vote (authenticated users only)
router.delete('/:id/helpful', 
  auth, 
  validate(productReviewValidator.helpfulVote), 
  productReviewController.removeHelpfulVote
);

/**
 * @openapi
 * /product-reviews/{id}/moderate:
 *   patch:
 *     summary: Moderate review (admin only)
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
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Review not found
 */
// Moderate review (admin only)
router.patch('/:id/moderate', 
  auth, 
  authorize(['admin']), 
  validate(productReviewValidator.moderateReview), 
  productReviewController.moderateReview
);

module.exports = router; 