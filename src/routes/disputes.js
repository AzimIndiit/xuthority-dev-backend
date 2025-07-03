const express = require('express');
const router = express.Router();

const disputeController = require('../controllers/disputeController');
const { disputeValidator } = require('../validators');
const { auth, authorize, validate } = require('../middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Dispute:
 *       type: object
 *       required:
 *         - review
 *         - vendor
 *         - product
 *         - reason
 *         - description
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated dispute ID
 *         review:
 *           type: string
 *           description: Product review ID being disputed
 *         vendor:
 *           type: string
 *           description: Vendor creating the dispute
 *         product:
 *           type: string
 *           description: Product ID
 *         reason:
 *           type: string
 *           enum: [false-or-misleading-information, spam-or-fake-review, inappropriate-content, conflict-of-interest, other]
 *           description: Reason for dispute
 *         description:
 *           type: string
 *           description: Detailed explanation of the dispute
 *           minLength: 10
 *           maxLength: 2000
 *         status:
 *           type: string
 *           enum: [active, resolved]
 *           description: Current status of the dispute
 *           default: active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/disputes:
 *   post:
 *     summary: Create a new dispute on a product review
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reviewId
 *               - reason
 *               - description
 *             properties:
 *               reviewId:
 *                 type: string
 *                 description: ID of the review to dispute
 *               reason:
 *                 type: string
 *                 enum: [false-or-misleading-information, spam-or-fake-review, inappropriate-content, conflict-of-interest, other]
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *     responses:
 *       201:
 *         description: Dispute created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not product owner
 */
router.post(
  '/',
  auth,
  authorize(['vendor']),
  validate(disputeValidator.createDisputeValidator),
  disputeController.createDispute
);

/**
 * @swagger
 * /api/v1/disputes:
 *   get:
 *     summary: Get vendor's disputes with pagination
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, resolved]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, status]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Disputes retrieved successfully
 */
router.get(
  '/',
  auth,
  validate(disputeValidator.getDisputesValidator),
  disputeController.getVendorDisputes
);

/**
 * @swagger
 * /api/v1/disputes/all:
 *   get:
 *     summary: Get all disputes (Admin only)
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, resolved]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, status]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: All disputes retrieved successfully
 */
router.get(
  '/all',
  validate(disputeValidator.getDisputesValidator),
  disputeController.getAllDisputes
);

/**
 * @swagger
 * /api/v1/disputes/{id}:
 *   get:
 *     summary: Get dispute by ID
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dispute retrieved successfully
 *       404:
 *         description: Dispute not found
 */
router.get(
  '/:id',
  auth,
  authorize(['vendor']),
  validate(disputeValidator.idValidator),
  disputeController.getDisputeById
);

/**
 * @swagger
 * /api/v1/disputes/{id}:
 *   put:
 *     summary: Update dispute
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: [false-or-misleading-information, spam-or-fake-review, inappropriate-content, conflict-of-interest, other]
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *               status:
 *                 type: string
 *                 enum: [active, resolved]
 *     responses:
 *       200:
 *         description: Dispute updated successfully
 *       404:
 *         description: Dispute not found
 */
router.put(
  '/:id',
  auth,
  authorize(['vendor','user']),
  validate(disputeValidator.updateDisputeValidator),
  disputeController.updateDispute
);

/**
 * @swagger
 * /api/v1/disputes/{id}:
 *   delete:
 *     summary: Delete dispute
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dispute deleted successfully
 *       404:
 *         description: Dispute not found
 */
router.delete(
  '/:id',
  auth,
  authorize(['vendor']),
  validate(disputeValidator.idValidator),
  disputeController.deleteDispute
);

/**
 * @swagger
 * /api/v1/disputes/{id}/explanation:
 *   post:
 *     summary: Add explanation to dispute
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - explanation
 *             properties:
 *               explanation:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *     responses:
 *       200:
 *         description: Explanation added successfully
 *       404:
 *         description: Dispute not found
 */
router.post(
  '/:id/explanation',
  auth,
  validate(disputeValidator.addExplanationValidator),
  disputeController.addExplanation
);

/**
 * @swagger
 * /api/v1/disputes/{id}/explanation/{explanationId}:
 *   put:
 *     summary: Update explanation in dispute
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: explanationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - explanation
 *             properties:
 *               explanation:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *     responses:
 *       200:
 *         description: Explanation updated successfully
 *       404:
 *         description: Dispute or explanation not found
 *       403:
 *         description: Unauthorized to update this explanation
 */
router.put(
  '/:id/explanation/:explanationId',
  auth,
  validate(disputeValidator.updateExplanationValidator),
  disputeController.updateExplanation
);

module.exports = router; 