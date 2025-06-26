const express = require('express');
const router = express.Router();

// Middleware
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate } = require('../middleware/validation');

// Controllers
const marketSegmentController = require('../controllers/marketSegmentController');

// Validators
const marketSegmentValidator = require('../validators/marketSegmentValidator');

/**
 * @openapi
 * /api/market-segments:
 *   get:
 *     summary: Get all market segments
 *     description: Retrieve a list of all market segments with optional filtering and pagination
 *     tags: [Market Segments]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter market segments
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of market segments retrieved successfully
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
 *                     $ref: '#/components/schemas/MarketSegment'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Bad request - invalid query parameters
 *       500:
 *         description: Internal server error
 */
router.get('/', 
  marketSegmentValidator.query,
  validate(marketSegmentValidator.query, 'query'),
  marketSegmentController.getAllMarketSegments
);

/**
 * @openapi
 * /api/market-segments/active:
 *   get:
 *     summary: Get active market segments
 *     description: Retrieve a list of only active market segments
 *     tags: [Market Segments]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter market segments
 *     responses:
 *       200:
 *         description: List of active market segments retrieved successfully
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
 *                     $ref: '#/components/schemas/MarketSegment'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Bad request - invalid query parameters
 *       500:
 *         description: Internal server error
 */
router.get('/active', 
  marketSegmentValidator.query,
  validate(marketSegmentValidator.query, 'query'),
  marketSegmentController.getActiveMarketSegments
);

/**
 * @openapi
 * /api/market-segments/slug/{slug}:
 *   get:
 *     summary: Get market segment by slug
 *     description: Retrieve a specific market segment using its slug
 *     tags: [Market Segments]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The slug of the market segment
 *     responses:
 *       200:
 *         description: Market segment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MarketSegment'
 *       404:
 *         description: Market segment not found
 *       500:
 *         description: Internal server error
 */
router.get('/slug/:slug', 
  marketSegmentValidator.getBySlug,
  validate(marketSegmentValidator.getBySlug, 'params'),
  marketSegmentController.getMarketSegmentBySlug
);

/**
 * @openapi
 * /api/market-segments/{marketSegmentId}:
 *   get:
 *     summary: Get market segment by ID
 *     description: Retrieve a specific market segment using its ID
 *     tags: [Market Segments]
 *     parameters:
 *       - in: path
 *         name: marketSegmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the market segment
 *     responses:
 *       200:
 *         description: Market segment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MarketSegment'
 *       404:
 *         description: Market segment not found
 *       500:
 *         description: Internal server error
 */
router.get('/:marketSegmentId', 
  marketSegmentValidator.getById,
  validate(marketSegmentValidator.getById, 'params'),
  marketSegmentController.getMarketSegmentById
);

// Protected routes (require authentication)
router.use(auth);

/**
 * @openapi
 * /api/market-segments:
 *   post:
 *     summary: Create a new market segment
 *     description: Create a new market segment (requires admin or vendor role)
 *     tags: [Market Segments]
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
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Name of the market segment
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *                 description: Description of the market segment
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *                 description: Status of the market segment
 *     responses:
 *       201:
 *         description: Market segment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MarketSegment'
 *       400:
 *         description: Bad request - invalid input data
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       409:
 *         description: Conflict - market segment with same name already exists
 *       500:
 *         description: Internal server error
 */
router.post('/', 
  authorize(['admin', 'vendor']),
  marketSegmentValidator.create,
  validate(marketSegmentValidator.create, 'body'),
  marketSegmentController.createMarketSegment
);

/**
 * @openapi
 * /api/market-segments/{marketSegmentId}:
 *   put:
 *     summary: Update a market segment
 *     description: Update an existing market segment (requires admin or vendor role)
 *     tags: [Market Segments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: marketSegmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the market segment to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Name of the market segment
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *                 description: Description of the market segment
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: Status of the market segment
 *     responses:
 *       200:
 *         description: Market segment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MarketSegment'
 *       400:
 *         description: Bad request - invalid input data
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Not found - market segment not found
 *       409:
 *         description: Conflict - market segment with same name already exists
 *       500:
 *         description: Internal server error
 */
router.put('/:marketSegmentId', 
  authorize(['admin', 'vendor']),
  marketSegmentValidator.update,
  validate(marketSegmentValidator.update, 'body'),
  marketSegmentController.updateMarketSegment
);

/**
 * @openapi
 * /api/market-segments/{marketSegmentId}/toggle-status:
 *   patch:
 *     summary: Toggle market segment status
 *     description: Toggle the status of a market segment between active and inactive (requires admin or vendor role)
 *     tags: [Market Segments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: marketSegmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the market segment to toggle status
 *     responses:
 *       200:
 *         description: Market segment status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MarketSegment'
 *       400:
 *         description: Bad request - invalid input data
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Not found - market segment not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:marketSegmentId/toggle-status', 
  authorize(['admin', 'vendor']),
  marketSegmentValidator.toggleStatus,
  validate(marketSegmentValidator.toggleStatus, 'params'),
  marketSegmentController.toggleMarketSegmentStatus
);

/**
 * @openapi
 * /api/market-segments/{marketSegmentId}:
 *   delete:
 *     summary: Delete a market segment
 *     description: Delete a market segment (requires admin role)
 *     tags: [Market Segments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: marketSegmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the market segment to delete
 *     responses:
 *       200:
 *         description: Market segment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Market segment deleted successfully
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Not found - market segment not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:marketSegmentId', 
  authorize(['admin']),
  marketSegmentValidator.delete,
  validate(marketSegmentValidator.delete, 'params'),
  marketSegmentController.deleteMarketSegment
);

module.exports = router; 