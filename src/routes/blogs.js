const express = require('express');
const router = express.Router();
const { blogController } = require('../controllers');
const { auth, authorize, validate } = require('../middleware');
const { blogValidator, commonValidator } = require('../validators');

/**
 * @openapi
 * components:
 *   schemas:
 *     Blog:
 *       type: object
 *       required:
 *         - authorName
 *         - title
 *         - description
 *         - tag
 *         - resourceCategoryId
 *       properties:
 *         authorName:
 *           type: string
 *           maxLength: 100
 *         designation:
 *           type: string
 *           maxLength: 100
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 200
 *         slug:
 *           type: string
 *         mediaUrl:
 *           type: string
 *         description:
 *           type: string
 *           minLength: 10
 *         watchUrl:
 *           type: string
 *         tag:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *         resourceCategoryId:
 *           type: string
 *           format: objectId
 */

/**
 * @openapi
 * /api/v1/blogs:
 *   post:
 *     summary: Create a new blog
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Blog'
 *     responses:
 *       201:
 *         description: Blog created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/', auth, authorize(['admin']), validate(blogValidator.create), blogController.createBlog);

/**
 * @openapi
 * /api/v1/blogs:
 *   get:
 *     summary: Get all blogs
 *     tags: [Blogs]
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
 *         description: Blogs retrieved successfully
 */
router.get('/', validate(blogValidator.list), blogController.getAllBlogs);

/**
 * @openapi
 * /api/v1/blogs/active:
 *   get:
 *     summary: Get active blogs
 *     tags: [Blogs]
 *     responses:
 *       200:
 *         description: Active blogs retrieved successfully
 */
router.get('/active', blogController.getActiveBlogs);

/**
 * @openapi
 * /api/v1/blogs/grouped-by-categories:
 *   get:
 *     summary: Get blogs grouped by categories with limit
 *     tags: [Blogs]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Number of blogs per category
 *     responses:
 *       200:
 *         description: Blogs grouped by categories retrieved successfully
 */
router.get('/grouped-by-categories', blogController.getBlogsGroupedByCategories);

/**
 * @openapi
 * /api/v1/blogs/category/{categoryId}:
 *   get:
 *     summary: Get blogs by category
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blogs retrieved successfully
 */
router.get('/category/:categoryId', validate(blogValidator.getByCategory), blogController.getBlogsByCategory);

/**
 * @openapi
 * /api/v1/blogs/tag/{tag}:
 *   get:
 *     summary: Get blogs by tag
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: tag
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blogs retrieved successfully
 */
router.get('/tag/:tag', validate(blogValidator.getByTag), blogController.getBlogsByTag);

/**
 * @openapi
 * /api/v1/blogs/slug/{slug}:
 *   get:
 *     summary: Get blog by slug
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog retrieved successfully
 *       404:
 *         description: Blog not found
 */
router.get('/slug/:slug', validate(blogValidator.getBySlug), blogController.getBlogBySlug);

/**
 * @openapi
 * /api/v1/blogs/{id}:
 *   get:
 *     summary: Get blog by ID
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog retrieved successfully
 *       404:
 *         description: Blog not found
 */
router.get('/:id', validate(blogValidator.getById), blogController.getBlogById);

/**
 * @openapi
 * /api/v1/blogs/{id}:
 *   put:
 *     summary: Update blog
 *     tags: [Blogs]
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
 *             $ref: '#/components/schemas/Blog'
 *     responses:
 *       200:
 *         description: Blog updated successfully
 *       404:
 *         description: Blog not found
 */
router.put('/:id', auth, authorize(['admin']), validate(blogValidator.update), blogController.updateBlog);

/**
 * @openapi
 * /api/v1/blogs/{id}/toggle-status:
 *   patch:
 *     summary: Toggle blog status
 *     tags: [Blogs]
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
 *         description: Blog status toggled successfully
 *       404:
 *         description: Blog not found
 */
router.patch('/:id/toggle-status', auth, authorize(['admin']), validate(blogValidator.toggleStatus), blogController.toggleBlogStatus);

/**
 * @openapi
 * /api/v1/blogs/{id}:
 *   delete:
 *     summary: Delete blog
 *     tags: [Blogs]
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
 *         description: Blog deleted successfully
 *       404:
 *         description: Blog not found
 */
router.delete('/:id', auth, authorize(['admin']), validate(blogValidator.delete), blogController.deleteBlog);

module.exports = router;
 