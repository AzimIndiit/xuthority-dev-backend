const express = require('express');
const router = express.Router();
const languageController = require('../controllers/languageController');
const languageValidator = require('../validators/languageValidator');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validation');

/**
 * @openapi
 * components:
 *   schemas:
 *     Language:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the language
 *         name:
 *           type: string
 *           description: Name of the language
 *         code:
 *           type: string
 *           description: ISO language code
 *         slug:
 *           type: string
 *           description: URL-friendly identifier
 *         isActive:
 *           type: boolean
 *           description: Whether the language is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     LanguageCreate:
 *       type: object
 *       required:
 *         - name
 *         - code
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the language
 *         code:
 *           type: string
 *           description: ISO language code
 *         slug:
 *           type: string
 *           description: URL-friendly identifier (optional)
 *     LanguageUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the language
 *         code:
 *           type: string
 *           description: ISO language code
 *         slug:
 *           type: string
 *           description: URL-friendly identifier
 *         isActive:
 *           type: boolean
 *           description: Whether the language is active
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 *         status:
 *           type: integer
 *           description: HTTP status code
 */

// Public routes (no authentication required)

/**
 * @openapi
 * /api/languages/active:
 *   get:
 *     summary: Get all active languages
 *     description: Retrieve a list of all active languages
 *     tags: [Languages]
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
 *     responses:
 *       200:
 *         description: List of active languages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Language'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/active', 
  languageValidator.query,
  validate(languageValidator.query, 'query'),
  languageController.getActiveLanguages
);

/**
 * @openapi
 * /api/languages:
 *   get:
 *     summary: Get all languages with filtering
 *     description: Retrieve a list of all languages with optional filtering and pagination
 *     tags: [Languages]
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
 *         description: Search term for filtering languages
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of languages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Language'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', 
  languageValidator.query,
  validate(languageValidator.query, 'query'),
  languageController.getAllLanguages
);

/**
 * @openapi
 * /api/languages/{id}:
 *   get:
 *     summary: Get language by ID
 *     description: Retrieve a specific language by its ID
 *     tags: [Languages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Language ID
 *     responses:
 *       200:
 *         description: Language retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Language'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Language not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', 
  languageValidator.getById,
  validate(languageValidator.getById, 'params'),
  languageController.getLanguageById
);

/**
 * @openapi
 * /api/languages/slug/{slug}:
 *   get:
 *     summary: Get language by slug
 *     description: Retrieve a specific language by its slug
 *     tags: [Languages]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Language slug
 *     responses:
 *       200:
 *         description: Language retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Language'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Language not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/slug/:slug', 
  languageValidator.getBySlug,
  validate(languageValidator.getBySlug, 'params'),
  languageController.getLanguageBySlug
);

// Protected routes (authentication required)

/**
 * @openapi
 * /api/languages:
 *   post:
 *     summary: Create new language
 *     description: Create a new language (admin only)
 *     tags: [Languages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LanguageCreate'
 *     responses:
 *       201:
 *         description: Language created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Language'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     /{id}:
 *       summary: Update language
 *       description: Update an existing language (admin only)
 *       tags: [Languages]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *           description: Language ID
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *           schema:
 *             $ref: '#/components/schemas/LanguageUpdate'
 *       responses:
 *         200:
 *           description: Language updated successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                   data:
 *                     $ref: '#/components/schemas/Language'
 *         400:
 *           description: Bad request
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *         403:
 *           description: Forbidden - Admin access required
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *         404:
 *           description: Language not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *         500:
 *           description: Internal server error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *   patch:
 *     /{id}/toggle-status:
 *       summary: Toggle language status
 *       description: Toggle the active status of a language (admin only)
 *       tags: [Languages]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *           description: Language ID
 *       responses:
 *         200:
 *           description: Language status toggled successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                   data:
 *                     $ref: '#/components/schemas/Language'
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *         403:
 *           description: Forbidden - Admin access required
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *         404:
 *           description: Language not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *         500:
 *           description: Internal server error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *   delete:
 *     /{id}:
 *       summary: Delete language
 *       description: Delete a language (admin only)
 *       tags: [Languages]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *           description: Language ID
 *       responses:
 *         200:
 *           description: Language deleted successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                   message:
 *                     type: string
 *         401:
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *         403:
 *           description: Forbidden - Admin access required
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *         404:
 *           description: Language not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *         500:
 *           description: Internal server error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 */
// Create new language (admin only)
router.post('/', 
  auth,
  languageValidator.create,
  validate(languageValidator.create, 'body'),
  languageController.createLanguage
);

// Update language (admin only)
router.put('/:id', 
  auth,
  languageValidator.update,
  validate(languageValidator.update, 'body'),
  languageController.updateLanguage
);

// Toggle language status (admin only)
router.patch('/:id/toggle-status', 
  auth,
  languageValidator.toggleStatus,
  validate(languageValidator.toggleStatus, 'params'),
  languageController.toggleLanguageStatus
);

// Delete language (admin only)
router.delete('/:id', 
  auth,
  languageValidator.delete,
  validate(languageValidator.delete, 'params'),
  languageController.deleteLanguage
);

module.exports = router; 