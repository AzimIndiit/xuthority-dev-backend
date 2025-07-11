const express = require('express');
const router = express.Router();

// Controllers and middleware
const { softwareController } = require('../controllers');
const { auth } = require('../middleware');
const { softwareValidator } = require('../validators');
const { validate } = require('../middleware/validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     Software:
 *       type: object
 *       required:
 *         - name
 *         - createdBy
 *       properties:
 *         _id:
 *           type: string
 *           description: Software ID
 *         name:
 *           type: string
 *           description: Software name
 *         slug:
 *           type: string
 *           description: Software slug (auto-generated)
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           default: active
 *           description: Software status
 *         createdBy:
 *           type: string
 *           description: User ID who created the software
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/software:
 *   get:
 *     summary: Get all software with search and pagination
 *     tags: [Software]
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
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, status, createdAt, updatedAt]
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Software list retrieved successfully
 */
router.get(
  '/',
  validate(softwareValidator.validateGetSoftwareList, 'query'),
  softwareController.getAllSoftware
);

/**
 * @swagger
 * /api/v1/software/active:
 *   get:
 *     summary: Get active software only
 *     tags: [Software]
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
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Active software retrieved successfully
 */
router.get(
  '/active',
  validate(softwareValidator.validateGetSoftwareList, 'query'),
  softwareController.getActiveSoftware
);

/**
 * @swagger
 * /api/v1/software/featured-with-products:
 *   get:
 *     summary: Get featured softwares with their top-rated products
 *     tags: [Software]
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
 *         description: Number of softwares per page
 *       - in: query
 *         name: productsPerSoftware
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *         description: Number of top products to return per software
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *         description: Minimum rating filter for products
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, avgRating, totalReviews, productCount, name]
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Featured softwares with top products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       software:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           slug:
 *                             type: string
 *                           status:
 *                             type: string
 *                           createdBy:
 *                             type: object
 *                             properties:
 *                               firstName:
 *                                 type: string
 *                               lastName:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                       topProducts:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             slug:
 *                               type: string
 *                             avgRating:
 *                               type: number
 *                             totalReviews:
 *                               type: number
 *                             logoUrl:
 *                               type: string
 *                             description:
 *                               type: string
 *                       productCount:
 *                         type: number
 *                       hasMinimumProducts:
 *                         type: boolean
 *                 message:
 *                   type: string
 *                   example: "Featured softwares with top products retrieved successfully"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 *                 meta:
 *                   type: object
 *                   properties:
 *                     totalSoftwaresWithProducts:
 *                       type: integer
 *                     productsPerSoftware:
 *                       type: integer
 *                     minRating:
 *                       type: number
 *                     sortBy:
 *                       type: string
 *                     sortOrder:
 *                       type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get(
  '/featured-with-products',
  validate(softwareValidator.validateGetFeaturedSoftwaresWithProducts, 'query'),
  softwareController.getFeaturedSoftwaresWithTopProducts
);

/**
 * @swagger
 * /api/v1/software/popular-with-products:
 *   get:
 *     summary: Get popular softwares with their top-rated products
 *     tags: [Software]
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
 *         description: Number of softwares per page
 *       - in: query
 *         name: productsPerSoftware
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *         description: "Number of top products to return per software (default: 4)"
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *         description: Minimum rating filter for products
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [totalReviews, avgRating, productCount, name]
 *         description: "Sort field (default: totalReviews)"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: "Sort order (default: desc)"
 *     responses:
 *       200:
 *         description: Popular softwares with top products retrieved successfully
 */
router.get(
  '/popular-with-products',
  validate(softwareValidator.validateGetFeaturedSoftwaresWithProducts, 'query'),
  softwareController.getPopularSoftwaresWithTopProducts
);

/**
 * @swagger
 * /api/v1/software/{id}:
 *   get:
 *     summary: Get software by ID
 *     tags: [Software]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Software ID
 *     responses:
 *       200:
 *         description: Software retrieved successfully
 *       404:
 *         description: Software not found
 */
router.get(
  '/:id',
  validate(softwareValidator.validateGetSoftwareById, 'params'),
  softwareController.getSoftwareById
);

/**
 * @swagger
 * /api/v1/software/slug/{slug}:
 *   get:
 *     summary: Get software by slug
 *     tags: [Software]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Software slug
 *     responses:
 *       200:
 *         description: Software retrieved successfully
 *       404:
 *         description: Software not found
 */
router.get(
  '/slug/:slug',
  validate(softwareValidator.validateGetSoftwareBySlug, 'params'),
  softwareController.getSoftwareBySlug
);

/**
 * @swagger
 * /api/v1/software:
 *   post:
 *     summary: Create new software
 *     tags: [Software]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Software name
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *     responses:
 *       201:
 *         description: Software created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  auth,
  validate(softwareValidator.validateCreateSoftware, 'body'),
  softwareController.createSoftware
);

/**
 * @swagger
 * /api/v1/software/{id}:
 *   put:
 *     summary: Update software
 *     tags: [Software]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Software ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Software name
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Software updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Software not found
 */
router.put(
  '/:id',
  auth,
  validate(softwareValidator.validateUpdateSoftware, 'body'),
  softwareController.updateSoftware
);

/**
 * @swagger
 * /api/v1/software/{id}/toggle-status:
 *   patch:
 *     summary: Toggle software status
 *     tags: [Software]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Software ID
 *     responses:
 *       200:
 *         description: Software status toggled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Software not found
 */
router.patch(
  '/:id/toggle-status',
  auth,
  validate(softwareValidator.validateToggleSoftwareStatus, 'params'),
  softwareController.toggleSoftwareStatus
);

/**
 * @swagger
 * /api/v1/software/{id}:
 *   delete:
 *     summary: Delete software
 *     tags: [Software]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Software ID
 *     responses:
 *       200:
 *         description: Software deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Software not found
 */
router.delete(
  '/:id',
  auth,
  validate(softwareValidator.validateDeleteSoftware, 'params'),
  softwareController.deleteSoftware
);

module.exports = router; 