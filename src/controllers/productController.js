const productService = require('../services/productService');
const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { logEvent } = require('../services/auditService');

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
exports.createProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        ApiResponse.error('Validation failed', {
          errors: errors.array()
        }, 400)
      );
    }

    const vendorId = req.user._id.toString();
    const product = await productService.createProduct(req.body, vendorId);

    await logEvent({
      user: req.user,
      action: 'CREATE_PRODUCT',
      target: 'Product',
      targetId: product._id,
      details: { 
        productName: product.name,
        status: product.status,
        userId: product.userId || product.vendor
      },
      req,
    });

    return res.status(201).json(
      ApiResponse.success(
        { product }, 
        `Product "${product.name}" created successfully`,
        { productId: product._id }
      )
    );
  } catch (err) {
    next(err);
  }
};

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
exports.getProducts = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        ApiResponse.error('Validation failed', {
          errors: errors.array()
        }, 400)
      );
    }

    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      status: req.query.status,
      vendor: req.query.vendor,
      userId: req.query.userId, // Support old field name
      software: req.query.software,
      search: req.query.search,
      isActive: req.query.isActive,
      isFeatured: req.query.isFeatured,
      minRating: req.query.minRating ? parseFloat(req.query.minRating) : undefined,
      maxRating: req.query.maxRating ? parseFloat(req.query.maxRating) : undefined,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
      industries: req.query.industries,
      marketSegment: req.query.marketSegment,
      solutions: req.query.solutions
    };

    // Convert comma-separated strings to arrays for ObjectId fields
    if (options.industries && typeof options.industries === 'string') {
      options.industries = options.industries.split(',');
    }
    if (options.marketSegment && typeof options.marketSegment === 'string') {
      options.marketSegment = options.marketSegment.split(',');
    }
    if (options.solutions && typeof options.solutions === 'string') {
      options.solutions = options.solutions.split(',');
    }

    const result = await productService.getProducts(options);

    return res.json(
      ApiResponse.success(
        result.products, 
        'Products retrieved successfully',
        { pagination: result.pagination }
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /products/{productId}:
 *   get:
 *     summary: Get product by ID
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: productId
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
exports.getProductById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        ApiResponse.error('Validation failed', {
          errors: errors.array()
        }, 400)
      );
    }

    const productId = req.params.productId;
    const incrementViews = req.query.incrementViews === 'true';
    
    const product = await productService.getProductById(productId, incrementViews);

    return res.json(
      ApiResponse.success(
        { product }, 
        'Product retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

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
exports.getProductBySlug = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        ApiResponse.error('Validation failed', {
          errors: errors.array()
        }, 400)
      );
    }

    const slug = req.params.slug;
    const incrementViews = req.query.incrementViews === 'true';
    
    const product = await productService.getProductBySlug(slug, incrementViews);

    return res.json(
      ApiResponse.success(
        { product }, 
        'Product retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /products/{productId}:
 *   put:
 *     summary: Update product (Vendor only - own products)
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               website:
 *                 type: string
 *               websiteUrl:
 *                 type: string
 *               software:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected, draft, published, archived]
 *               isActive:
 *                 type: string
 *                 enum: [active, inactive]
 *               totalReviews:
 *                 type: number
 *               avgRating:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       403:
 *         description: Can only update own products
 *       404:
 *         description: Product not found
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        ApiResponse.error('Validation failed', {
          errors: errors.array()
        }, 400)
      );
    }

    const productId = req.params.productId;
    const vendorId = req.user._id.toString();
    
    const product = await productService.updateProduct(productId, req.body, vendorId);

    await logEvent({
      user: req.user,
      action: 'UPDATE_PRODUCT',
      target: 'Product',
      targetId: product._id,
      details: { 
        productName: product.name,
        updatedFields: Object.keys(req.body),
        userId: product.userId || product.vendor
      },
      req,
    });

    return res.json(
      ApiResponse.success(
        { product }, 
        `Product "${product.name}" updated successfully`
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /products/{productId}:
 *   delete:
 *     summary: Delete product (Vendor only - own products)
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
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       403:
 *         description: Can only delete own products
 *       404:
 *         description: Product not found
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        ApiResponse.error('Validation failed', {
          errors: errors.array()
        }, 400)
      );
    }

    const productId = req.params.productId;
    const vendorId = req.user._id.toString();
    
    const result = await productService.deleteProduct(productId, vendorId);

    await logEvent({
      user: req.user,
      action: 'DELETE_PRODUCT',
      target: 'Product',
      targetId: productId,
      details: { 
        productId,
        userId: vendorId
      },
      req,
    });

    return res.json(
      ApiResponse.success(
        result, 
        'Product deleted successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /products/vendor/{vendorId}:
 *   get:
 *     summary: Get vendor's products
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vendor products retrieved successfully
 *       404:
 *         description: Vendor not found
 */
exports.getVendorProducts = async (req, res, next) => {
  try {
    const vendorId = req.params.vendorId;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      status: req.query.status,
      isActive: req.query.isActive,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await productService.getVendorProducts(vendorId, options);

    return res.json(
      ApiResponse.success(
        result.products, 
        'Vendor products retrieved successfully',
        { 
          vendor: result.vendor,
          pagination: result.pagination 
        }
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /products/my:
 *   get:
 *     summary: Get current vendor's products
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: My products retrieved successfully
 */
exports.getMyProducts = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        ApiResponse.error('Validation failed', {
          errors: errors.array()
        }, 400)
      );
    }

    const vendorId = req.user._id.toString();
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      status: req.query.status,
      isActive: req.query.isActive,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await productService.getVendorProducts(vendorId, options);

    return res.json(
      ApiResponse.success(
        result.products, 
        'My products retrieved successfully',
        { 
          vendor: result.vendor,
          pagination: result.pagination 
        }
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /products/{productId}/like:
 *   post:
 *     summary: Toggle product like
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
 *     responses:
 *       200:
 *         description: Product like toggled successfully
 *       404:
 *         description: Product not found
 */
exports.toggleLike = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    
    const product = await productService.toggleProductLike(productId);

    await logEvent({
      user: req.user,
      action: 'TOGGLE_PRODUCT_LIKE',
      target: 'Product',
      targetId: product._id,
      details: { 
        productName: product.name,
        likes: product.likes
      },
      req,
    });

    return res.json(
      ApiResponse.success(
        { 
          product: {
            _id: product._id,
            name: product.name,
            likes: product.likes
          }
        }, 
        `Product like toggled successfully`
      )
    );
  } catch (err) {
    next(err);
  }
};

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
exports.searchProducts = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        ApiResponse.error('Validation failed', {
          errors: errors.array()
        }, 400)
      );
    }

    const query = req.query.q;
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      software: req.query.software,
      industries: req.query.industries,
      marketSegment: req.query.marketSegment,
      solutions: req.query.solutions,
      minRating: req.query.minRating ? parseFloat(req.query.minRating) : undefined,
      maxRating: req.query.maxRating ? parseFloat(req.query.maxRating) : undefined
    };

    // Convert comma-separated strings to arrays
    if (filters.industries && typeof filters.industries === 'string') {
      filters.industries = filters.industries.split(',');
    }
    if (filters.marketSegment && typeof filters.marketSegment === 'string') {
      filters.marketSegment = filters.marketSegment.split(',');
    }
    if (filters.solutions && typeof filters.solutions === 'string') {
      filters.solutions = filters.solutions.split(',');
    }

    const result = await productService.searchProducts(query, filters);

    return res.json(
      ApiResponse.success(
        result.products, 
        'Search results retrieved successfully',
        { 
          searchQuery: query,
          pagination: result.pagination
        }
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /products/stats/overview:
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
exports.getProductStats = async (req, res, next) => {
  try {
    // If user is vendor, get their stats only
    const vendorId = req.user.role === 'vendor' ? req.user._id.toString() : null;
    const stats = await productService.getProductStats(vendorId);

    return res.json(
      ApiResponse.success(
        stats, 
        'Product statistics retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

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
exports.updateProductRating = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        ApiResponse.error('Validation failed', {
          errors: errors.array()
        }, 400)
      );
    }

    const productId = req.params.productId;
    const { rating } = req.body;
    
    const product = await productService.updateProductRating(productId, rating);

    await logEvent({
      user: req.user,
      action: 'UPDATE_PRODUCT_RATING',
      target: 'Product',
      targetId: product._id,
      details: { 
        productName: product.name,
        newRating: rating,
        avgRating: product.avgRating,
        totalReviews: product.totalReviews
      },
      req,
    });

    return res.json(
      ApiResponse.success(
        { 
          product: {
            _id: product._id,
            name: product.name,
            avgRating: product.avgRating,
            totalReviews: product.totalReviews
          }
        }, 
        'Product rating updated successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /products/{productId}/favorites:
 *   post:
 *     summary: Add product to favorites
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
 *     responses:
 *       200:
 *         description: Product added to favorites successfully
 *       404:
 *         description: Product not found
 */
exports.addToFavorites = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const userId = req.user._id.toString();
    
    const result = await productService.addToFavorites(productId, userId);

    await logEvent({
      user: req.user,
      action: 'ADD_TO_FAVORITES',
      target: 'Product',
      targetId: productId,
      details: { 
        productId,
        userId
      },
      req,
    });

    return res.json(
      ApiResponse.success(
        result, 
        'Product added to favorites successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

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
 *     responses:
 *       200:
 *         description: Active products retrieved successfully
 */
exports.getActiveProducts = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        ApiResponse.error('Validation failed', {
          errors: errors.array()
        }, 400)
      );
    }

    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      status: 'published',
      isActive: 'active',
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await productService.getProducts(options);

    return res.json(
      ApiResponse.success(
        result.products, 
        'Active products retrieved successfully',
        { pagination: result.pagination }
      )
    );
  } catch (err) {
    next(err);
  }
};

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
 *           maximum: 20
 *           default: 10
 *     responses:
 *       200:
 *         description: Top rated products retrieved successfully
 */
exports.getTopRatedProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const options = {
      page: 1,
      limit: Math.min(limit, 20),
      status: 'published',
      isActive: 'active',
      sortBy: 'avgRating',
      sortOrder: 'desc',
      minRating: 4
    };

    const result = await productService.getProducts(options);

    return res.json(
      ApiResponse.success(
        result.products, 
        'Top rated products retrieved successfully',
        { pagination: result.pagination }
      )
    );
  } catch (err) {
    next(err);
  }
};

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
 *           maximum: 20
 *           default: 10
 *     responses:
 *       200:
 *         description: Featured products retrieved successfully
 */
exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const options = {
      page: 1,
      limit: Math.min(limit, 20),
      status: 'published',
      isActive: 'active',
      isFeatured: true,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    const result = await productService.getProducts(options);

    return res.json(
      ApiResponse.success(
        result.products, 
        'Featured products retrieved successfully',
        { pagination: result.pagination }
      )
    );
  } catch (err) {
    next(err);
  }
};



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
 *         description: User/Vendor ID
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
 *     responses:
 *       200:
 *         description: User products retrieved successfully
 */
exports.getProductsByUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        ApiResponse.error('Validation failed', {
          errors: errors.array()
        }, 400)
      );
    }

    const userId = req.params.userId;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      userId: userId,
      status: req.query.status || 'published', // Default to published for public view
      isActive: req.query.isActive || 'active',
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await productService.getProducts(options);

    return res.json(
      ApiResponse.success(
        result.products, 
        'User products retrieved successfully',
        { pagination: result.pagination }
      )
    );
  } catch (err) {
    next(err);
  }
};

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
 *       404:
 *         description: Product not found
 */
exports.toggleProductStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        ApiResponse.error('Validation failed', {
          errors: errors.array()
        }, 400)
      );
    }

    const productId = req.params.id;
    const userId = req.user._id.toString();
    
    const product = await productService.getProductById(productId);
    
    // Check if user owns the product
    if (product.userId.toString() !== userId && req.user.role !== 'admin') {
      throw new ApiError('You can only toggle status of your own products', 'FORBIDDEN', 403);
    }

    // Toggle isActive status
    const newStatus = product.isActive === 'active' ? 'inactive' : 'active';
    const updatedProduct = await productService.updateProduct(productId, { isActive: newStatus }, userId);

    await logEvent({
      user: req.user,
      action: 'TOGGLE_PRODUCT_STATUS',
      target: 'Product',
      targetId: product._id,
      details: { 
        productName: product.name,
        oldStatus: product.isActive,
        newStatus: newStatus
      },
      req,
    });

    return res.json(
      ApiResponse.success(
        { 
          product: {
            _id: updatedProduct._id,
            name: updatedProduct.name,
            isActive: updatedProduct.isActive
          }
        }, 
        `Product status toggled to ${newStatus} successfully`
      )
    );
  } catch (err) {
    next(err);
  }
}; 