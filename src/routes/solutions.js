const express = require('express');
const router = express.Router();

// Controllers and middleware
const { solutionController } = require('../controllers');
const { auth } = require('../middleware');
const { solutionValidator } = require('../validators');
const { validate } = require('../middleware/validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     Solution:
 *       type: object
 *       required:
 *         - name
 *         - createdBy
 *       properties:
 *         _id:
 *           type: string
 *           description: Solution ID
 *         name:
 *           type: string
 *           description: Solution name
 *         slug:
 *           type: string
 *           description: Solution slug (auto-generated)
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           default: active
 *           description: Solution status
 *         createdBy:
 *           type: string
 *           description: User ID who created the solution
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/solutions:
 *   get:
 *     summary: Get all solutions with search and pagination
 *     tags: [Solutions]
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
 *         description: Solutions list retrieved successfully
 */
router.get(
  '/',
  validate(solutionValidator.validateGetSolutionList, 'query'),
  solutionController.getAllSolutions
);

/**
 * @swagger
 * /api/v1/solutions/active:
 *   get:
 *     summary: Get active solutions only
 *     tags: [Solutions]
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
 *         description: Active solutions retrieved successfully
 */
router.get(
  '/active',
  validate(solutionValidator.validateGetSolutionList, 'query'),
  solutionController.getActiveSolutions
);

/**
 * @swagger
 * /api/v1/solutions/{id}:
 *   get:
 *     summary: Get solution by ID
 *     tags: [Solutions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Solution ID
 *     responses:
 *       200:
 *         description: Solution retrieved successfully
 *       404:
 *         description: Solution not found
 */
router.get(
  '/:id',
  validate(solutionValidator.validateGetSolutionById, 'params'),
  solutionController.getSolutionById
);

/**
 * @swagger
 * /api/v1/solutions/slug/{slug}:
 *   get:
 *     summary: Get solution by slug
 *     tags: [Solutions]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Solution slug
 *     responses:
 *       200:
 *         description: Solution retrieved successfully
 *       404:
 *         description: Solution not found
 */
router.get(
  '/slug/:slug',
  validate(solutionValidator.validateGetSolutionBySlug, 'params'),
  solutionController.getSolutionBySlug
);

/**
 * @swagger
 * /api/v1/solutions:
 *   post:
 *     summary: Create new solution
 *     tags: [Solutions]
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
 *                 description: Solution name
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *     responses:
 *       201:
 *         description: Solution created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  auth,
  validate(solutionValidator.validateCreateSolution, 'body'),
  solutionController.createSolution
);

/**
 * @swagger
 * /api/v1/solutions/{id}:
 *   put:
 *     summary: Update solution
 *     tags: [Solutions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Solution ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Solution name
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Solution updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Solution not found
 */
router.put(
  '/:id',
  auth,
  validate(solutionValidator.validateUpdateSolution, 'body'),
  solutionController.updateSolution
);

/**
 * @swagger
 * /api/v1/solutions/{id}/toggle-status:
 *   patch:
 *     summary: Toggle solution status
 *     tags: [Solutions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Solution ID
 *     responses:
 *       200:
 *         description: Solution status toggled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Solution not found
 */
router.patch(
  '/:id/toggle-status',
  auth,
  validate(solutionValidator.validateToggleSolutionStatus, 'params'),
  solutionController.toggleSolutionStatus
);

/**
 * @swagger
 * /api/v1/solutions/{id}:
 *   delete:
 *     summary: Delete solution
 *     tags: [Solutions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Solution ID
 *     responses:
 *       200:
 *         description: Solution deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Solution not found
 */
router.delete(
  '/:id',
  auth,
  validate(solutionValidator.validateDeleteSolution, 'params'),
  solutionController.deleteSolution
);

module.exports = router; 