const express = require('express');
const router = express.Router();
const metaTagController = require('../controllers/metaTagController');

/**
 * @swagger
 * tags:
 *   name: Meta Tags
 *   description: Meta tag management API
 */

/**
 * @swagger
 * /api/v1/meta-tags/active:
 *   get:
 *     summary: Get all active meta tags
 *     tags: [Meta Tags]
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
 *         description: Search term for page name, meta title, or description
 *     responses:
 *       200:
 *         description: Meta tags retrieved successfully
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
 *                     metaTags:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MetaTag'
 *                 message:
 *                   type: string
 *                   example: "Active meta tags retrieved successfully"
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
router.get('/active', metaTagController.getActiveMetaTags);

/**
 * @swagger
 * /api/v1/meta-tags/page/{pageName}:
 *   get:
 *     summary: Get meta tag by page name
 *     tags: [Meta Tags]
 *     parameters:
 *       - in: path
 *         name: pageName
 *         required: true
 *         schema:
 *           type: string
 *         description: Page name
 *     responses:
 *       200:
 *         description: Meta tag retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MetaTag'
 *                 message:
 *                   type: string
 *                   example: "Meta tag retrieved successfully"
 *       404:
 *         description: Meta tag not found
 */
router.get('/page/:pageName', metaTagController.getMetaTagByPageName);

module.exports = router; 