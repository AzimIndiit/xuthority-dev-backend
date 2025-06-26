const express = require('express');
const router = express.Router();

// Middleware
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate } = require('../middleware/validation');

// Controllers
const integrationController = require('../controllers/integrationController');

// Validators
const integrationValidator = require('../validators/integrationValidator');

/**
 * @openapi
 * /api/integrations:
 *   get:
 *     summary: Get all integrations
 *     description: Retrieve a list of all integrations with optional filtering and pagination
 *     tags: [Integrations]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, all]
 *           default: all
 *         description: Filter by integration status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by integration category
 *     responses:
 *       200:
 *         description: List of integrations retrieved successfully
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
 *                     $ref: '#/components/schemas/Integration'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Internal server error
 */
router.get('/', 
  integrationValidator.query,
  validate(integrationValidator.query, 'query'),
  integrationController.getAllIntegrations
);

/**
 * @openapi
 * /api/integrations/active:
 *   get:
 *     summary: Get active integrations
 *     description: Retrieve a list of all active integrations
 *     tags: [Integrations]
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
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by integration category
 *     responses:
 *       200:
 *         description: List of active integrations retrieved successfully
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
 *                     $ref: '#/components/schemas/Integration'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Internal server error
 */
router.get('/active', 
  integrationValidator.query,
  validate(integrationValidator.query, 'query'),
  integrationController.getActiveIntegrations
);

/**
 * @openapi
 * /api/integrations/slug/{slug}:
 *   get:
 *     summary: Get integration by slug
 *     description: Retrieve a specific integration by its slug
 *     tags: [Integrations]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-z0-9-]+$'
 *         description: The slug of the integration
 *     responses:
 *       200:
 *         description: Integration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Integration'
 *       400:
 *         description: Invalid slug format
 *       404:
 *         description: Integration not found
 *       500:
 *         description: Internal server error
 */
router.get('/slug/:slug', 
  integrationValidator.getBySlug,
  validate(integrationValidator.getBySlug, 'params'),
  integrationController.getIntegrationBySlug
);

/**
 * @openapi
 * /api/integrations/{integrationId}:
 *   get:
 *     summary: Get integration by ID
 *     description: Retrieve a specific integration by its ID
 *     tags: [Integrations]
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the integration
 *     responses:
 *       200:
 *         description: Integration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Integration'
 *       400:
 *         description: Invalid integration ID format
 *       404:
 *         description: Integration not found
 *       500:
 *         description: Internal server error
 */
router.get('/:integrationId', 
  integrationValidator.getById,
  validate(integrationValidator.getById, 'params'),
  integrationController.getIntegrationById
);

// Protected routes (require authentication)
router.use(auth);

/**
 * @openapi
 * /api/integrations:
 *   post:
 *     summary: Create a new integration
 *     description: Create a new integration (requires admin or vendor role)
 *     tags: [Integrations]
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
 *               - slug
 *               - description
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: The name of the integration
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9-]+$'
 *                 description: The unique slug for the integration
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 description: Detailed description of the integration
 *               category:
 *                 type: string
 *                 enum: [payment, shipping, analytics, marketing, other]
 *                 description: The category of the integration
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: inactive
 *                 description: The status of the integration
 *               config:
 *                 type: object
 *                 description: Configuration object for the integration
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for the integration
 *     responses:
 *       201:
 *         description: Integration created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Integration'
 *                 message:
 *                   type: string
 *                   example: Integration created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       409:
 *         description: Conflict - Integration with this slug already exists
 *       500:
 *         description: Internal server error
 */
router.post('/', 
  authorize(['admin', 'vendor']),
  integrationValidator.create,
  validate(integrationValidator.create, 'body'),
  integrationController.createIntegration
);

/**
 * @openapi
 * /api/integrations/{integrationId}:
 *   put:
 *     summary: Update an integration
 *     description: Update an existing integration (requires admin or vendor role)
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the integration
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
 *                 description: The name of the integration
 *               slug:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 pattern: '^[a-z0-9-]+$'
 *                 description: URL-friendly identifier for the integration
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Detailed description of the integration
 *               category:
 *                 type: string
 *                 enum: [payment, shipping, analytics, marketing, other]
 *                 description: The category of the integration
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: The status of the integration
 *               config:
 *                 type: object
 *                 description: Configuration object for the integration
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for the integration
 *     responses:
 *       200:
 *         description: Integration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Integration'
 *                 message:
 *                   type: string
 *                   example: Integration updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Integration not found
 *       409:
 *         description: Conflict - Integration with this slug already exists
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /api/integrations/{integrationId}/toggle-status:
 *   patch:
 *     summary: Toggle integration status
 *     description: Toggle the status of an integration between active and inactive (requires admin or vendor role)
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the integration
 *     responses:
 *       200:
 *         description: Integration status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Integration'
 *                 message:
 *                   type: string
 *                   example: Integration status updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Integration not found
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /api/integrations/{integrationId}:
 *   delete:
 *     summary: Delete an integration
 *     description: Delete an integration (requires admin role)
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the integration
 *     responses:
 *       200:
 *         description: Integration deleted successfully
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
 *                   example: Integration deleted successfully
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Integration not found
 *       500:
 *         description: Internal server error
 */

router.put('/:integrationId', 
  authorize(['admin', 'vendor']),
  integrationValidator.update,
  validate(integrationValidator.update, 'body'),
  integrationController.updateIntegration
);

router.patch('/:integrationId/toggle-status', 
  authorize(['admin', 'vendor']),
  integrationValidator.toggleStatus,
  validate(integrationValidator.toggleStatus, 'params'),
  integrationController.toggleIntegrationStatus
);

router.delete('/:integrationId', 
  authorize(['admin']),
  integrationValidator.delete,
  validate(integrationValidator.delete, 'params'),
  integrationController.deleteIntegration
);

module.exports = router; 