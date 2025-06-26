const express = require('express');
const router = express.Router();
const { resourceCategoryController } = require('../controllers');
const { auth, authorize, validate } = require('../middleware');
const { resourceCategoryValidator, commonValidator } = require('../validators');

/**
 * @openapi
 * components:
 *   schemas:
 *     ResourceCategory:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         slug:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive]
 */

/**
 * @openapi
 * /api/v1/resource-categories:
 *   post:
 *     summary: Create a new resource category
 *     tags: [Resource Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResourceCategory'
 *     responses:
 *       201:
 *         description: Resource category created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/', auth, authorize(['admin']), validate(resourceCategoryValidator.create), resourceCategoryController.createResourceCategory);

/**
 * @openapi
 * /api/v1/resource-categories:
 *   get:
 *     summary: Get all resource categories
 *     tags: [Resource Categories]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Resource categories retrieved successfully
 */
router.get('/', validate(resourceCategoryValidator.list), resourceCategoryController.getAllResourceCategories);

/**
 * @openapi
 * /api/v1/resource-categories/active:
 *   get:
 *     summary: Get active resource categories
 *     tags: [Resource Categories]
 *     responses:
 *       200:
 *         description: Active resource categories retrieved successfully
 */
router.get('/active', resourceCategoryController.getActiveResourceCategories);

/**
 * @openapi
 * /api/v1/resource-categories/slug/{slug}:
 *   get:
 *     summary: Get resource category by slug
 *     tags: [Resource Categories]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resource category retrieved successfully
 *       404:
 *         description: Resource category not found
 */
router.get('/slug/:slug', validate(resourceCategoryValidator.getBySlug), resourceCategoryController.getResourceCategoryBySlug);

/**
 * @openapi
 * /api/v1/resource-categories/{id}:
 *   get:
 *     summary: Get resource category by ID
 *     tags: [Resource Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resource category retrieved successfully
 *       404:
 *         description: Resource category not found
 */
router.get('/:id', validate(resourceCategoryValidator.getById), resourceCategoryController.getResourceCategoryById);

/**
 * @openapi
 * /api/v1/resource-categories/{id}:
 *   put:
 *     summary: Update resource category
 *     tags: [Resource Categories]
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
 *             $ref: '#/components/schemas/ResourceCategory'
 *     responses:
 *       200:
 *         description: Resource category updated successfully
 *       404:
 *         description: Resource category not found
 */
router.put('/:id', auth, authorize(['admin']), validate(resourceCategoryValidator.update), resourceCategoryController.updateResourceCategory);

/**
 * @openapi
 * /api/v1/resource-categories/{id}/toggle-status:
 *   patch:
 *     summary: Toggle resource category status
 *     tags: [Resource Categories]
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
 *         description: Resource category status toggled successfully
 *       404:
 *         description: Resource category not found
 */
router.patch('/:id/toggle-status', auth, authorize(['admin']), validate(resourceCategoryValidator.toggleStatus), resourceCategoryController.toggleResourceCategoryStatus);

/**
* @openapi
 * /api/v1/resource-categories/{id}:
 *   delete:
 *     summary: Delete resource category
 *     tags: [Resource Categories]
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
 *         description: Resource category deleted successfully
 *       404:
 *         description: Resource category not found
 */
router.delete('/:id', auth, authorize(['admin']), validate(resourceCategoryValidator.delete), resourceCategoryController.deleteResourceCategory);

module.exports = router; 