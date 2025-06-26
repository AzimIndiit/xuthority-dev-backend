const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const productValidator = require('../validators/productValidator');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Public routes (no authentication required)

// Get all active products (published/approved and active)
router.get('/active', 
  productValidator.query,
  validate(productValidator.query, 'query'),
  productController.getActiveProducts
);

// Search products
router.get('/search', 
  productValidator.query,
  validate(productValidator.query, 'query'),
  productController.searchProducts
);

// Get product statistics
router.get('/stats', productController.getProductStats);

// Get top rated products
router.get('/top-rated', productController.getTopRatedProducts);

// Get featured products
router.get('/featured', productController.getFeaturedProducts);

// Get all products (with filtering)
router.get('/', 
  productValidator.query,
  validate(productValidator.query, 'query'),
  productController.getProducts
);

// Get product by slug
router.get('/slug/:slug', 
  productValidator.getBySlug,
  validate(productValidator.getBySlug, 'params'),
  productController.getProductBySlug
);

// Get product by ID
router.get('/:id', 
  productValidator.getById,
  validate(productValidator.getById, 'params'),
  productController.getProductById
);

// Get products by user/vendor
router.get('/user/:userId', 
  productValidator.query,
  validate(productValidator.query, 'query'),
  productController.getProductsByUser
);

// Protected routes (authentication required)

// Create new product
router.post('/', 
  auth,
  productValidator.create,
  validate(productValidator.create, 'body'),
  productController.createProduct
);

// Get my products (current user's products)
router.get('/my/products', 
  auth,
  productValidator.query,
  validate(productValidator.query, 'query'),
  productController.getMyProducts
);

// Update product
router.put('/:id', 
  auth,
  productValidator.update,
  validate(productValidator.update, 'body'),
  productController.updateProduct
);

// Delete product
router.delete('/:id', 
  auth,
  productValidator.delete,
  validate(productValidator.delete, 'params'),
  productController.deleteProduct
);

// Toggle product status (active/inactive)
router.patch('/:id/toggle-status', 
  auth,
  productValidator.toggleStatus,
  validate(productValidator.toggleStatus, 'params'),
  productController.toggleProductStatus
);

// Update product rating
router.post('/:productId/rating', 
  auth,
  productValidator.updateRating,
  validate(productValidator.updateRating, 'body'),
  productController.updateProductRating
);

module.exports = router;
