const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const productValidator = require('../validators/productValidator');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validation');

/**
 * @openapi
 * /products:
 *   post:
 *     summary: Create a new product (Vendors only)
 *     tags:
 *       - Products
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
 *                 minLength: 3
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *               website:
 *                 type: string
 *                 format: uri
 *               websiteUrl:
 *                 type: string
 *                 format: uri
 *               software:
 *                 type: string
 *                 enum: [SaaS, Desktop Application, Mobile App, Web Application, API/Service, Plugin/Extension, Other]
 *               softwareIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectId
 *               solutionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectId
 *               solutions:
 *                 type: array
 *                 items:
 *                   type: string
 *               industries:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectId
 *               whoCanUse:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectId
 *               languages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectId
 *               integrations:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectId
 *               marketSegment:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectId
 *               brandColors:
 *                 type: string
 *               logoUrl:
 *                 type: string
 *                 format: uri
 *               mediaUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected, draft, published, archived]
 *               isActive:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Only vendors can create products
 */
// Create new product
router.post('/', 
  auth,
  productValidator.create,
  validate(productValidator.create, 'body'),
  productController.createProduct
);

/**
 * @openapi
 * /products:
 *   get:
 *     summary: Get products with filtering and pagination
 *     tags:
 *       - Products
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
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, draft, published, archived]
 *       - in: query
 *         name: software
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name, views, likes, avgRating, totalReviews]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *       - in: query
 *         name: maxRating
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
// Get all products (with filtering)
router.get('/', 
  productValidator.query,
  validate(productValidator.query, 'query'),
  productController.getProducts
);

/**
 * @openapi
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: query
 *         name: incrementViews
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to increment view count
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 */
// Get product by ID
router.get('/:id', 
  productValidator.getById,
  validate(productValidator.getById, 'params'),
  productController.getProductById
);

/**
 * @openapi
 * /products/slug/{slug}:
 *   get:
 *     summary: Get product by slug
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Product slug
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 */
// Get product by slug
router.get('/slug/:slug', 
  productValidator.getBySlug,
  validate(productValidator.getBySlug, 'params'),
  productController.getProductBySlug
);

/**
 * @openapi
 * /products/{id}:
 *   put:
 *     summary: Update product (Vendor only - own products)
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *               website:
 *                 type: string
 *                 format: uri
 *               websiteUrl:
 *                 type: string
 *                 format: uri
 *               software:
 *                 type: string
 *                 enum: [SaaS, Desktop Application, Mobile App, Web Application, API/Service, Plugin/Extension, Other]
 *               softwareIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectId
 *               solutionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectId
 *               solutions:
 *                 type: array
 *                 items:
 *                   type: string
 *               industries:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectId
 *               whoCanUse:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectId
 *               languages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectId
 *               integrations:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectId
 *               marketSegment:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectId
 *               brandColors:
 *                 type: string
 *               logoUrl:
 *                 type: string
 *                 format: uri
 *               mediaUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected, draft, published, archived]
 *               isActive:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Can only update own products
 *       404:
 *         description: Product not found
 */
// Update product
router.put('/:id', 
  auth,
  productValidator.update,
  validate(productValidator.update, 'body'),
  productController.updateProduct
);

/**
 * @openapi
 * /products/{id}:
 *   delete:
 *     summary: Delete product (Vendor only - own products)
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       403:
 *         description: Can only delete own products
 *       404:
 *         description: Product not found
 */
// Delete product
router.delete('/:id', 
  auth,
  productValidator.delete,
  validate(productValidator.delete, 'params'),
  productController.deleteProduct
);

/**
 * @openapi
 * /products/{id}/toggle-status:
 *   patch:
 *     summary: Toggle product status (active/inactive)
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product status toggled successfully
 *       403:
 *         description: Can only toggle own products
 *       404:
 *         description: Product not found
 */
// Toggle product status (active/inactive)
router.patch('/:id/toggle-status', 
  auth,
  productValidator.toggleStatus,
  validate(productValidator.toggleStatus, 'params'),
  productController.toggleProductStatus
);

/**
 * @openapi
 * /products/{productId}/rating:
 *   post:
 *     summary: Update product rating (when review is added)
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       200:
 *         description: Product rating updated successfully
 *       404:
 *         description: Product not found
 */
// Update product rating
router.post('/:productId/rating', 
  auth,
  productValidator.updateRating,
  validate(productValidator.updateRating, 'body'),
  productController.updateProductRating
);

/**
 * @openapi
 * /products/active:
 *   get:
 *     summary: Get all active products (published/approved and active)
 *     tags:
 *       - Products
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
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name, views, likes, avgRating, totalReviews]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Active products retrieved successfully
 */
// Get all active products (published/approved and active)
router.get('/active', 
  productValidator.query,
  validate(productValidator.query, 'query'),
  productController.getActiveProducts
);

/**
 * @openapi
 * /products/search:
 *   get:
 *     summary: Search products
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: software
 *         schema:
 *           type: string
 *       - in: query
 *         name: industries
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *       - in: query
 *         name: maxRating
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
// Search products
router.get('/search', 
  productValidator.query,
  validate(productValidator.query, 'query'),
  productController.searchProducts
);

/**
 * @openapi
 * /products/stats:
 *   get:
 *     summary: Get product statistics
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
// Get product statistics
router.get('/stats', productController.getProductStats);

/**
 * @openapi
 * /products/top-rated:
 *   get:
 *     summary: Get top rated products
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Top rated products retrieved successfully
 */
// Get top rated products
router.get('/top-rated', productController.getTopRatedProducts);

/**
 * @openapi
 * /products/featured:
 *   get:
 *     summary: Get featured products
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Featured products retrieved successfully
 */
// Get featured products
router.get('/featured', productController.getFeaturedProducts);

/**
 * @openapi
 * /products/my/products:
 *   get:
 *     summary: Get my products (current user's products)
 *     tags:
 *       - Products
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
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, draft, published, archived]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name, views, likes, avgRating, totalReviews]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: My products retrieved successfully
 *       401:
 *         description: Authentication required
 */
// Get my products (current user's products)
router.get('/my/products', 
  auth,
  productValidator.query,
  validate(productValidator.query, 'query'),
  productController.getMyProducts
);

/**
 * @openapi
 * /products/user/{userId}:
 *   get:
 *     summary: Get products by user/vendor
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
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
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, draft, published, archived]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name, views, likes, avgRating, totalReviews]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: User products retrieved successfully
 *       404:
 *         description: User not found
 */
// Get products by user/vendor
router.get('/user/:userId', 
  productValidator.query,
  validate(productValidator.query, 'query'),
  productController.getProductsByUser
);

module.exports = router;
