const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');

/**
 * @swagger
 * tags:
 *   name: Pages
 *   description: Page management API
 */

/**
 * @swagger
 * /api/v1/pages/active:
 *   get:
 *     summary: Get all active pages
 *     tags: [Pages]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for page name or slug
 *       - in: query
 *         name: isSystemPage
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by system page type
 *     responses:
 *       200:
 *         description: Pages retrieved successfully
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
 *                     pages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Page'
 *                 message:
 *                   type: string
 *                   example: "Active pages retrieved successfully"
 *                 meta:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         total:
 *                           type: integer
 *                           example: 50
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *                         hasPrevPage:
 *                           type: boolean
 *                           example: false
 */
router.get('/active', pageController.getActivePages);

/**
 * @swagger
 * /api/v1/pages/{slug}:
 *   get:
 *     summary: Get page by slug
 *     tags: [Pages]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Page slug
 *     responses:
 *       200:
 *         description: Page retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Page'
 *                 message:
 *                   type: string
 *                   example: "Page retrieved successfully"
 *       404:
 *         description: Page not found
 */
router.get('/:slug', pageController.getPageBySlug);

module.exports = router; 