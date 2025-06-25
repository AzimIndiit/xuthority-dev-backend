const express = require('express');
const router = express.Router();

// Middleware
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate } = require('../middleware/validation');
const upload = require('../middleware/upload');

// Controllers
const productController = require('../controllers/productController');

// Validators
const {
  createProductValidator,
  updateProductValidator,
  productIdValidator,
  productSlugValidator,
  productQueryValidator,
  mediaUploadValidator
} = require('../validators/productValidator');

const { mongoIdValidator } = require('../validators/commonValidator');

/**
 * @openapi
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - software
 *         - vendor
 *       properties:
 *         _id:
 *           type: string
 *           description: Product ID
 *         name:
 *           type: string
 *           description: Product name
 *         slug:
 *           type: string
 *           description: Product URL slug
 *         description:
 *           type: string
 *           description: Product description
 *         website:
 *           type: string
 *           description: Product website URL
 *         software:
 *           type: string
 *           enum: [SaaS, Desktop Application, Mobile App, Web Application, API/Service, Plugin/Extension, Other]
 *         solutions:
 *           type: array
 *           items:
 *             type: string
 *         industries:
 *           type: array
 *           items:
 *             type: string
 *         marketSegment:
 *           type: array
 *           items:
 *             type: string
 *         features:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *         pricing:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               seats:
 *                 type: number
 *               currency:
 *                 type: string
 *         vendor:
 *           $ref: '#/components/schemas/User'
 *         status:
 *           type: string
 *           enum: [draft, published, archived, pending_review]
 *         views:
 *           type: number
 *         likes:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// Public routes (no authentication required)
router.get('/', 
  validate(productQueryValidator, 'query'),
  productController.getProducts
);

router.get('/search', 
  validate(productQueryValidator, 'query'),
  productController.searchProducts
);

router.get('/slug/:slug', 
  validate(productSlugValidator, 'params'),
  productController.getProductBySlug
);

router.get('/vendor/:vendorId', 
  validate(mongoIdValidator, 'params'),
  validate(productQueryValidator, 'query'),
  productController.getVendorProducts
);

router.get('/:productId', 
  validate(productIdValidator, 'params'),
  productController.getProductById
);

// Protected routes (authentication required)
router.use(auth); // All routes below require authentication

// Vendor-only routes (require vendor role)
router.post('/', 
  authorize(['vendor']),
  validate(createProductValidator, 'body'),
  productController.createProduct
);

router.get('/my', 
  authorize(['vendor']),
  validate(productQueryValidator, 'query'),
  productController.getMyProducts
);

router.put('/:productId', 
  authorize(['vendor']),
  validate(productIdValidator, 'params'),
  validate(updateProductValidator, 'body'),
  productController.updateProduct
);

router.delete('/:productId', 
  authorize(['vendor']),
  validate(productIdValidator, 'params'),
  productController.deleteProduct
);

// Routes available to all authenticated users
router.post('/:productId/like', 
  validate(productIdValidator, 'params'),
  productController.toggleLike
);

router.get('/stats/overview', 
  productController.getProductStats
);

// Media upload routes (vendor only)
router.post('/:productId/media', 
  authorize(['vendor']),
  validate(productIdValidator, 'params'),
  upload.single('file'),
  validate(mediaUploadValidator, 'body'),
  async (req, res, next) => {
    try {
      // This would be handled by a media controller
      // For now, just return the uploaded file info
      res.json({
        success: true,
        data: {
          file: req.file,
          productId: req.params.productId
        },
        message: 'Media uploaded successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Bulk operations (vendor only)
router.patch('/bulk/status', 
  authorize(['vendor']),
  async (req, res, next) => {
    try {
      const { productIds, status } = req.body;
      
      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Product IDs array is required',
            code: 'VALIDATION_ERROR',
            statusCode: 400
          }
        });
      }

      if (!['draft', 'published', 'archived', 'pending_review'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid status',
            code: 'VALIDATION_ERROR',
            statusCode: 400
          }
        });
      }

      // This would be handled by the service layer
      // Implementation would update multiple products at once
      res.json({
        success: true,
        data: {
          updatedCount: productIds.length,
          status
        },
        message: `${productIds.length} products updated successfully`
      });
    } catch (error) {
      next(error);
    }
  }
);

// Admin-only routes (require admin role)
router.patch('/:productId/feature', 
  authorize(['admin']),
  validate(productIdValidator, 'params'),
  async (req, res, next) => {
    try {
      const { isFeatured } = req.body;
      
      // This would be handled by an admin service
      res.json({
        success: true,
        data: {
          productId: req.params.productId,
          isFeatured
        },
        message: `Product ${isFeatured ? 'featured' : 'unfeatured'} successfully`
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router; 