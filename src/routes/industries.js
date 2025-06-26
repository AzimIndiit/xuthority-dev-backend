const express = require('express');
const router = express.Router();

// Middleware
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate } = require('../middleware/validation');

// Controllers
const industryController = require('../controllers/industryController');

// Validators
const {
  createIndustryValidator,
  updateIndustryValidator,
  industryIdValidator,
  industrySlugValidator,
  industryQueryValidator
} = require('../validators/industryValidator');

/**
 * @openapi
 * /api/industries:
 *   get:
 *     summary: Get all industries
 *     description: Retrieve a list of all industries with optional filtering and pagination
 *     tags: [Industries]
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
 *         description: Search term to filter industries by name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, all]
 *           default: all
 *         description: Filter industries by status
 *     responses:
 *       200:
 *         description: List of industries retrieved successfully
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
 *                     $ref: '#/components/schemas/Industry'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Internal server error
 */
router.get('/', 
  validate(industryQueryValidator, 'query'),
  industryController.getAllIndustries
);

/**
 * @openapi
 * /api/industries/active:
 *   get:
 *     summary: Get active industries
 *     description: Retrieve a list of only active industries
 *     tags: [Industries]
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
 *         description: Search term to filter industries by name
 *     responses:
 *       200:
 *         description: List of active industries retrieved successfully
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
 *                     $ref: '#/components/schemas/Industry'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Internal server error
 */
router.get('/active', 
  validate(industryQueryValidator, 'query'),
  industryController.getActiveIndustries
);

/**
 * @openapi
 * /api/industries/slug/{slug}:
 *   get:
 *     summary: Get industry by slug
 *     description: Retrieve a specific industry by its slug
 *     tags: [Industries]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-z0-9-]+$'
 *         description: The slug of the industry
 *     responses:
 *       200:
 *         description: Industry retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Industry'
 *       400:
 *         description: Invalid slug format
 *       404:
 *         description: Industry not found
 *       500:
 *         description: Internal server error
 */
router.get('/slug/:slug', 
  validate(industrySlugValidator, 'params'),
  industryController.getIndustryBySlug
);

/**
 * @openapi
 * /api/industries/{industryId}:
 *   get:
 *     summary: Get industry by ID
 *     description: Retrieve a specific industry by its ID
 *     tags: [Industries]
 *     parameters:
 *       - in: path
 *         name: industryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the industry
 *     responses:
 *       200:
 *         description: Industry retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Industry'
 *       400:
 *         description: Invalid industry ID format
 *       404:
 *         description: Industry not found
 *       500:
 *         description: Internal server error
 */
router.get('/:industryId', 
  validate(industryIdValidator, 'params'),
  industryController.getIndustryById
);

// Protected routes (require authentication)
router.use(auth);

/**
 * @openapi
 * /api/industries:
 *   post:
 *     summary: Create a new industry
 *     description: Create a new industry (requires admin or vendor role)
 *     tags: [Industries]
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
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: The name of the industry
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 description: The description of the industry
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9-]+$'
 *                 description: Custom slug for the industry (optional)
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *                 description: The status of the industry
 *     responses:
 *       201:
 *         description: Industry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Industry'
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       409:
 *         description: Conflict - Industry with same name or slug already exists
 *       500:
 *         description: Internal server error
 */
router.post('/', 
  authorize(['admin', 'vendor']),
  validate(createIndustryValidator, 'body'),
  industryController.createIndustry
);

/**
 * @openapi
 * /api/industries/{industryId}:
 *   put:
 *     summary: Update an industry
 *     description: Update an existing industry by ID (requires admin or vendor role)
 *     tags: [Industries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: industryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the industry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: The name of the industry
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 description: The description of the industry
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9-]+$'
 *                 description: Custom slug for the industry
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *                 description: The status of the industry
 *     responses:
 *       200:
 *         description: Industry updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Industry'
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Industry not found
 *       409:
 *         description: Conflict - Industry with same name or slug already exists
 *       500:
 *         description: Internal server error
 */
router.put('/:industryId', 
  authorize(['admin', 'vendor']),
  validate(industryIdValidator, 'params'),
  validate(updateIndustryValidator, 'body'),
  industryController.updateIndustry
);

/**
 * @openapi
 * /api/industries/{industryId}/toggle-status:
 *   patch:
 *     summary: Toggle industry status
 *     description: Toggle the status of an industry between active and inactive (requires admin or vendor role)
 *     tags: [Industries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: industryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the industry
 *     responses:
 *       200:
 *         description: Industry status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Industry'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Industry not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:industryId/toggle-status', 
  authorize(['admin', 'vendor']),
  validate(industryIdValidator, 'params'),
  industryController.toggleIndustryStatus
);

/**
 * @openapi
 * /api/industries/{industryId}:
 *   delete:
 *     summary: Delete an industry
 *     description: Delete an industry by ID (requires admin role)
 *     tags: [Industries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: industryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the industry
 *     responses:
 *       200:
 *         description: Industry deleted successfully
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
 *                   example: Industry deleted successfully
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Industry not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:industryId', 
  authorize(['admin']),
  validate(industryIdValidator, 'params'),
  industryController.deleteIndustry
);

module.exports = router; 