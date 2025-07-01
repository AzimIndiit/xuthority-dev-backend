const productService = require('../services/productService');
const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { logEvent } = require('../services/auditService');

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

    // Update vendor's totalProducts count if user is a vendor
    if (req.user.role === 'vendor') {
      const { User } = require('../models');
      await User.findByIdAndUpdate(
        vendorId,
        { $inc: { totalProducts: 1 } },
        { new: true }
      );
    }

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
      solutions: req.query.solutions,
      // New filter parameters
      segment: req.query.segment,
      categories: req.query.categories,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined
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
    if (options.categories && typeof options.categories === 'string') {
      options.categories = options.categories.split(',');
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

    const productId = req.params.id;
    const incrementViews = req.query.incrementViews === 'true';
    
    const product = await productService.getProductById(productId, incrementViews);

    return res.json(
      ApiResponse.success(
        product, 
        'Product retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

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
        product, 
        'Product retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

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

    const productId = req.params.id;
    const vendorId = req.user._id.toString();
    const updateData = req.body;

    const product = await productService.updateProduct(productId,updateData,vendorId);

    await logEvent({
      user: req.user,
      action: 'UPDATE_PRODUCT',
      target: 'Product',
      targetId: productId,
      details: { 
        productName: product.name,
        updatedFields: Object.keys(updateData)
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

    const productId = req.params.id;
    const vendorId = req.user._id.toString();

    const product = await productService.deleteProduct(productId, vendorId);

    // Update vendor's totalProducts count if user is a vendor
    if (req.user.role === 'vendor') {
      const { User } = require('../models');
      await User.findByIdAndUpdate(
        vendorId,
        { $inc: { totalProducts: -1 } },
        { new: true }
      );
    }

    await logEvent({
      user: req.user,
      action: 'DELETE_PRODUCT',
      target: 'Product',
      targetId: productId,
      details: { 
        productName: product.name
      },
      req,
    });

    return res.json(
      ApiResponse.success(
        { product }, 
        `Product "${product.name}" deleted successfully`
      )
    );
  } catch (err) {
    next(err);
  }
};

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
    const vendorId = req.user._id.toString();

    const product = await productService.toggleProductStatus(productId, vendorId);

    await logEvent({
      user: req.user,
      action: 'TOGGLE_PRODUCT_STATUS',
      target: 'Product',
      targetId: productId,
      details: { 
        productName: product.name,
        newStatus: product.isActive
      },
      req,
    });

    return res.json(
      ApiResponse.success(
        { product }, 
        `Product "${product.name}" status toggled successfully`
      )
    );
  } catch (err) {
    next(err);
  }
};

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

    return res.json(
      ApiResponse.success(
        { product }, 
        'Product rating updated successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

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
      search: req.query.search,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
      status: 'published', // Only published products
      isActive: 'active', // Only active products
      softwareIds: req.query.softwareIds,
      solutionIds: req.query.solutionIds
    };

    // Convert comma-separated strings to arrays for ObjectId fields
    if (options.softwareIds && typeof options.softwareIds === 'string') {
      options.softwareIds = options.softwareIds.split(',');
    }
    if (options.solutionIds && typeof options.solutionIds === 'string') {
      options.solutionIds = options.solutionIds.split(',');
    }

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

    const { q: query, software, industries, minRating, maxRating } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!query || query.trim().length === 0) {
      throw new ApiError('Search query is required', 'SEARCH_QUERY_REQUIRED', 400);
    }

    const searchOptions = {
      query: query.trim(),
      software,
      industries: industries ? industries.split(',') : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      maxRating: maxRating ? parseFloat(maxRating) : undefined,
      page,
      limit
    };

    const result = await productService.searchProducts(searchOptions);

    return res.json(
      ApiResponse.success(
        result.products, 
        `Found ${result.total} product(s) matching "${query}"`,
        { 
          pagination: result.pagination,
          searchQuery: query
        }
      )
    );
  } catch (err) {
    next(err);
  }
};

exports.getProductStats = async (req, res, next) => {
  try {
    const stats = await productService.getProductStats();

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

exports.getTopRatedProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const products = await productService.getTopRatedProducts(limit);

    return res.json(
      ApiResponse.success(
        products, 
        'Top rated products retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const products = await productService.getFeaturedProducts(limit);

    return res.json(
      ApiResponse.success(
        products, 
        'Featured products retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

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
      search: req.query.search,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
      vendor: vendorId // Only current user's products
    };

    const result = await productService.getProducts(options);

    return res.json(
      ApiResponse.success(
        result.products, 
        'My products retrieved successfully',
        { pagination: result.pagination }
      )
    );
  } catch (err) {
    next(err);
  }
};

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
      status: req.query.status,
      search: req.query.search,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
      vendor: userId // Products by specific user
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

exports.getProductsByCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        ApiResponse.error('Validation failed', {
          errors: errors.array()
        }, 400)
      );
    }

    const { category, subCategory } = req.params;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
      status: 'published', // Only published products
      isActive: 'active', // Only active products
      // New filter parameters
      segment: req.query.segment,
      categories: req.query.categories,
      industries: req.query.industries,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined
    };

    // Convert comma-separated strings to arrays for filter fields
    if (options.categories && typeof options.categories === 'string') {
      options.categories = options.categories.split(',');
    }
    if (options.industries && typeof options.industries === 'string') {
      options.industries = options.industries.split(',');
    }
    // If we have both category and subCategory, we need to find the software/solution by slug
    if ( !options.categories && !options.industries && category && subCategory) {
      const { Software, Solution } = require('../models');
      
      if (category.toLowerCase() === 'software') {
        const software = await Software.findOne({ slug: subCategory });
        if (software) {
          options.softwareIds = [software._id.toString()];
        }
      } else if (category.toLowerCase() === 'solutions') {
        const solution = await Solution.findOne({ slug: subCategory });
        if (solution) {
          options.solutionIds = [solution._id.toString()];
        }
      }
    }
    console.log(options,"options");

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