const productService = require('../services/productService');
const apiResponse = require('../utils/apiResponse');
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
 *               - software
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
 *               software:
 *                 type: string
 *                 enum: [SaaS, Desktop Application, Mobile App, Web Application, API/Service, Plugin/Extension, Other]
 *               solutions:
 *                 type: array
 *                 items:
 *                   type: string
 *               industries:
 *                 type: array
 *                 items:
 *                   type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *               pricing:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     seats:
 *                       type: number
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
    const vendorId = req.user._id.toString();
    const product = await productService.createProduct(req.body, vendorId);

    await logEvent({
      user: req.user,
      action: 'CREATE_PRODUCT',
      target: 'Product',
      targetId: product._id,
      details: { 
        productName: product.name,
        status: product.status
      },
      req,
    });

    return res.status(201).json(
      apiResponse.success(
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
 *           enum: [draft, published, archived, pending_review]
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
 *           enum: [createdAt, updatedAt, name, views, likes]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
exports.getProducts = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      status: req.query.status,
      software: req.query.software,
      search: req.query.search,
      isActive: req.query.isActive,
      isFeatured: req.query.isFeatured,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
      industries: req.query.industries,
      marketSegment: req.query.marketSegment,
      solutions: req.query.solutions
    };

    // Convert comma-separated strings to arrays
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
      apiResponse.success(
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
    const productId = req.params.productId;
    const incrementViews = req.query.incrementViews === 'true';
    
    const product = await productService.getProductById(productId, incrementViews);

    return res.json(
      apiResponse.success(
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
    const slug = req.params.slug;
    const incrementViews = req.query.incrementViews === 'true';
    
    const product = await productService.getProductBySlug(slug, incrementViews);

    return res.json(
      apiResponse.success(
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
 *               software:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived, pending_review]
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
        updatedFields: Object.keys(req.body)
      },
      req,
    });

    return res.json(
      apiResponse.success(
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
    const productId = req.params.productId;
    const vendorId = req.user._id.toString();
    
    const result = await productService.deleteProduct(productId, vendorId);

    await logEvent({
      user: req.user,
      action: 'DELETE_PRODUCT',
      target: 'Product',
      targetId: productId,
      details: { 
        productId
      },
      req,
    });

    return res.json(
      apiResponse.success(
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
      apiResponse.success(
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
      apiResponse.success(
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
      targetId: productId,
      details: { 
        productName: product.name,
        likes: product.likes
      },
      req,
    });

    return res.json(
      apiResponse.success(
        { 
          product: {
            _id: product._id,
            name: product.name,
            likes: product.likes
          }
        }, 
        'Product like toggled successfully'
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
    const query = req.query.q;
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      software: req.query.software,
      industries: req.query.industries,
      marketSegment: req.query.marketSegment,
      solutions: req.query.solutions
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

    const products = await productService.searchProducts(query, filters);

    return res.json(
      apiResponse.success(
        products, 
        'Search results retrieved successfully',
        { searchQuery: query }
      )
    );
  } catch (err) {
    next(err);
  }
};

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
exports.getProductStats = async (req, res, next) => {
  try {
    // If user is vendor, get their stats only
    const vendorId = req.user.role === 'vendor' ? req.user._id.toString() : null;
    const stats = await productService.getProductStats(vendorId);

    return res.json(
      apiResponse.success(
        stats, 
        'Product statistics retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
}; 