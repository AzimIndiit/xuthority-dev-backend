const mongoose = require('mongoose');
const slugify = require('slugify');
const { Product, User } = require('../models');
const ApiError = require('../utils/apiError');
const { ObjectId } = require('mongoose').Types;

/**
 * Create a new product (vendors only)
 * @param {Object} productData - Product data
 * @param {string} vendorId - Vendor user ID
 * @returns {Object} Created product
 */
const createProduct = async (productData, userId) => {
  try {
    // Check if product with same name already exists
    const existingProduct = await Product.findOne({ 
      name: productData.name.trim(),
      userId: userId
    });

    if (existingProduct) {
      throw new ApiError('Product with this name already exists', 'DUPLICATE_PRODUCT', 400);
    }

    // Generate slug from name if not provided
    const slug = productData.slug || slugify(productData.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });

    // Create product with userId and slug
    const product = new Product({
      ...productData,
      slug,
      userId: userId,
      createdBy: userId
    });

    await product.save();

    // Populate the product before returning
    const populatedProduct = await Product.findById(product._id)
      .populate('userId', 'firstName lastName companyName email')
      .populate('softwareIds', 'name slug')
      .populate('solutionIds', 'name slug')
      .populate('industries', 'name slug')
      .populate('languages', 'name slug')
      .populate('integrations', 'name image')
      .populate('marketSegment', 'name slug')
      .populate('whoCanUse', 'name slug');

    return populatedProduct;
  } catch (error) {
    console.error('Error creating product:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Error creating product', error.message);
  }
};

/**
 * Get products with filtering and pagination
 * @param {Object} options - Query options
 * @returns {Object} Products with metadata
 */
const getProducts = async (options = {}) => {
  const {
    page = 1,
    limit = 10,
    status,
    userId, // Support old field name
    software,
    industries,
    marketSegment,
    solutions,
    softwareIds,
    solutionIds,
    search,
    isActive,
    isFeatured,
    minRating,
    maxRating,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    // New filter parameters
    segment,
    categories,
    priceRange,
    minPrice,
    maxPrice
  } = options;

  // Build filter
  const filter = {};
  
  if (status) filter.status = status;
  if (userId) filter.userId = userId; // Support old field
  if (software) filter.software = software;
  
  // Handle both string and boolean values for isActive
  if (isActive !== undefined) {
    if (typeof isActive === 'boolean') {
      filter.isActive = isActive ? 'active' : 'inactive';
    } else {
      filter.isActive = isActive;
    }
  }
  
  if (isFeatured !== undefined) filter.isFeatured = isFeatured;
  
  // Handle ObjectId arrays for reference fields
  if (industries && industries.length) {
    filter.industries = { $in: industries };
  }
  
  if (marketSegment && marketSegment.length) {
    filter.marketSegment = { $in: marketSegment };
  }
  
  if (solutions && solutions.length) {
    filter.solutions = { $in: solutions };
  }

  // Handle softwareIds and solutionIds filtering
  if (softwareIds && softwareIds.length) {
    filter.softwareIds = { $in: softwareIds };
  }
  
  if (solutionIds && solutionIds.length) {
    filter.solutionIds = { $in: solutionIds };
  }

  // Rating filter
  if (minRating || maxRating) {
    filter.avgRating = {};
    if (minRating) filter.avgRating.$gte = minRating;
    if (maxRating) filter.avgRating.$lte = maxRating;
  }

  // Price filter
  if (minPrice || maxPrice) {
    filter['pricing.price'] = {};
    if (minPrice) filter['pricing.price'].$gte = minPrice;
    if (maxPrice) filter['pricing.price'].$lte = maxPrice;
  }

  // Segment filter (market segment)
  if (segment && segment !== 'all') {
    // Find market segment by name or slug
    const { MarketSegment } = require('../models');
    const segmentDoc = await MarketSegment.findOne({
      $or: [
        { name: { $regex: segment, $options: 'i' } },
        { slug: segment }
      ]
    });
    if (segmentDoc) {
      filter.marketSegment = segmentDoc._id;
    }
  }

  // Categories filter (software/solution categories)
  if (categories && categories.length > 0) {
    const { Software, Solution } = require('../models');
    
    // Find software/solution IDs by category names
    const softwareIds = await Software.find({
      name: { $in: categories }
    }).distinct('_id');
    
    const solutionIds = await Solution.find({
      name: { $in: categories }
    }).distinct('_id');
    
    if (softwareIds.length > 0 || solutionIds.length > 0) {
      filter.$or = [];
      if (softwareIds.length > 0) {
        filter.$or.push({ softwareIds: { $in: softwareIds } });
      }
      if (solutionIds.length > 0) {
        filter.$or.push({ solutionIds: { $in: solutionIds } });
      }
    }
  }

  // Industries filter
  if (industries && industries.length > 0) {
    const { Industry } = require('../models');
    
    // Find industry IDs by industry names
    const industryIds = await Industry.find({
      name: { $in: industries }
    }).distinct('_id');
    
    if (industryIds.length > 0) {
      filter.industries = { $in: industryIds };
    }
  }

  // Add text search if provided
  if (search) {
    // Use regex for more flexible search instead of $text
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { keywords: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const skip = (page - 1) * limit;
  console.log(filter,"filter",sort);
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate([
        { path: 'userId', select: 'firstName lastName companyName email' },
        { path: 'industries', select: 'name slug status' },
        { path: 'languages', select: 'name slug status' },
        { path: 'integrations', select: 'name image status' },
        { path: 'marketSegment', select: 'name slug status' },
        { path: 'whoCanUse', select: 'name slug status' },
        { path: 'softwareIds', select: 'name slug status' },
        { path: 'solutionIds', select: 'name slug status' }
      ])
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter)
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

/**
 * Get product by ID with optional view increment
 * @param {string} productId - Product ID
 * @param {boolean} incrementViews - Whether to increment view count
 * @returns {Object} Product with populated fields
 */
const getProductById = async (productId, incrementViews = false) => {
  const product = await Product.findById(productId)
    .populate([
      { path: 'userId', select: 'firstName lastName companyName email socialLinks' },
      { path: 'industries', select: 'name slug status' },
      { path: 'languages', select: 'name slug status' },
      { path: 'integrations', select: 'name image status' },
      { path: 'marketSegment', select: 'name slug status' },
      { path: 'whoCanUse', select: 'name slug status' },
      { path: 'softwareIds', select: 'name slug status' },
      { path: 'solutionIds', select: 'name slug status' }
    ]);

  if (!product) {
    throw new ApiError('Product not found', 'PRODUCT_NOT_FOUND', 404);
  }

  // Increment views if requested
  if (incrementViews) {
    await product.incrementViews();
  }

  return product;
};

/**
 * Get product by slug
 * @param {string} slug - Product slug
 * @param {boolean} incrementViews - Whether to increment view count
 * @returns {Object} Product
 */
const getProductBySlug = async (slug, incrementViews = false) => {
  const product = await Product.findOne({ slug })
    .populate([
      { path: 'userId', select: 'firstName lastName companyName email socialLinks companyDescription companyWebsiteUrl hqLocation yearFounded companyAvatar socialLinks slug' },
      { path: 'industries', select: 'name slug status' },
      { path: 'languages', select: 'name slug status' },
      { path: 'integrations', select: 'name image status' },
      { path: 'marketSegment', select: 'name slug status' },
      { path: 'whoCanUse', select: 'name slug status' },
      { path: 'softwareIds', select: 'name slug status' },
      { path: 'solutionIds', select: 'name slug status' }
    ]);

  if (!product) {
    throw new ApiError('Product not found', 'PRODUCT_NOT_FOUND', 404);
  }

  // Increment views if requested
  if (incrementViews) {
    await product.incrementViews();
  }

  return product;
};

/**
 * Update product (only by vendor who owns it)
 * @param {string} productId - Product ID
 * @param {Object} updateData - Update data
 * @param {string} userId - User ID
 * @returns {Object} Updated product
 */
const updateProduct = async (productId, updateData, userId) => {
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new ApiError('Product not found', 'PRODUCT_NOT_FOUND', 404);
  }

  // Check ownership - support both userId and vendor fields
  const isOwner = product.userId?.toString() === userId 
             
  
  if (!isOwner) {
    throw new ApiError('You can only update your own products', 'UNAUTHORIZED_UPDATE', 403);
  }

  try {
    // Handle website field compatibility
    if (updateData.website && !updateData.websiteUrl) {
      updateData.websiteUrl = updateData.website;
    }
    if (updateData.websiteUrl && !updateData.website) {
      updateData.website = updateData.websiteUrl;
    }

    // Generate new slug if name is being updated
    if (updateData.name && updateData.name !== product.name) {
      let slug = slugify(updateData.name, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g
      });
      
      // Ensure slug is unique
      let uniqueSlug = slug;
      let counter = 1;
      while (await Product.findOne({ slug: uniqueSlug, _id: { $ne: productId } })) {
        uniqueSlug = `${slug}-${Date.now()}-${counter}`;
        counter++;
      }
      updateData.slug = uniqueSlug;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { 
        $set: {
          ...updateData,
          lastUpdated: new Date()
        }
      },
      { new: true, runValidators: true }
    ).populate([
      { path: 'userId', select: 'firstName lastName companyName email' },
      { path: 'industries', select: 'name slug status' },
      { path: 'languages', select: 'name slug status' },
      { path: 'integrations', select: 'name image status' },
      { path: 'marketSegment', select: 'name slug status' },
      { path: 'whoCanUse', select: 'name slug status' },
      { path: 'softwareIds', select: 'name slug status' },
      { path: 'solutionIds', select: 'name slug status' }
    ]);

    return updatedProduct;
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      throw new ApiError(`Validation failed: ${messages.join(', ')}`, 'VALIDATION_ERROR', 400);
    }
    throw error;
  }
};

/**
 * Delete product (only by vendor who owns it)
 * @param {string} productId - Product ID
 * @param {string} userId - User ID
 * @returns {Object} Delete result
 */
const deleteProduct = async (productId, userId) => {
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new ApiError('Product not found', 'PRODUCT_NOT_FOUND', 404);
  }

  // Check ownership - support both userId and vendor fields
  const isOwner = product.userId?.toString() === userId || 
                 product.vendor?.toString() === userId;
  
  if (!isOwner) {
    throw new ApiError('You can only delete your own products', 'UNAUTHORIZED_DELETE', 403);
  }

  await Product.findByIdAndDelete(productId);
  
  return { 
    success: true, 
    message: 'Product deleted successfully',
    productId 
  };
};

/**
 * Get vendor's products
 * @param {string} vendorId - Vendor ID
 * @param {Object} options - Query options
 * @returns {Object} Products with vendor info and pagination
 */
const getVendorProducts = async (vendorId, options = {}) => {
  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    throw new ApiError('Invalid vendor ID', 'INVALID_VENDOR_ID', 400);
  }

  const vendor = await User.findById(vendorId, 'firstName lastName companyName email');
  if (!vendor) {
    throw new ApiError('Vendor not found', 'VENDOR_NOT_FOUND', 404);
  }

  const {
    page = 1,
    limit = 10,
    status,
    isActive,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  // Build filter - support both userId and vendor fields
  const filter = {
    $or: [
      { userId: vendorId },
    ]
  };
  
  if (status) filter.status = status;
  if (isActive !== undefined) {
    if (typeof isActive === 'boolean') {
      filter.isActive = isActive ? 'active' : 'inactive';
    } else {
      filter.isActive = isActive;
    }
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const skip = (page - 1) * limit;
  
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate([
        { path: 'userId', select: 'firstName lastName companyName email' },
        { path: 'industries', select: 'name slug status' },
        { path: 'languages', select: 'name slug status' },
        { path: 'integrations', select: 'name image status' },
        { path: 'marketSegment', select: 'name slug status' },
        { path: 'whoCanUse', select: 'name slug status' }
      ])
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter)
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

/**
 * Toggle product like
 * @param {string} productId - Product ID
 * @returns {Object} Updated product
 */
const toggleProductLike = async (productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError('Invalid product ID', 'INVALID_PRODUCT_ID', 400);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError('Product not found', 'PRODUCT_NOT_FOUND', 404);
  }

  await product.toggleLike();
  return product;
};

/**
 * Search products with advanced filtering
 * @param {string} query - Search query
 * @param {Object} filters - Additional filters
 * @returns {Array} Search results
 */
const searchProducts = async (query, filters = {}) => {
  const {
    page = 1,
    limit = 10,
    software,
    industries,
    marketSegment,
    solutions,
    minRating,
    maxRating
  } = filters;

  // Use the static search method from the model
  const products = await Product.search(query, {
    software,
    industries,
    marketSegment,
    solutions,
    minRating,
    maxRating,
    page,
    limit
  });

  const total = await Product.countDocuments({
    $text: { $search: query },
    status: { $in: ['published', 'approved'] },
    isActive: 'active',
    ...(software && { software }),
    ...(industries && industries.length && { industries: { $in: industries } }),
    ...(marketSegment && marketSegment.length && { marketSegment: { $in: marketSegment } }),
    ...(solutions && solutions.length && { solutions: { $in: solutions } }),
    ...(minRating && { avgRating: { $gte: minRating } })
  });

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

/**
 * Get product statistics
 * @param {string} vendorId - Vendor ID (optional, if provided returns vendor-specific stats)
 * @returns {Object} Statistics
 */
const getProductStats = async (vendorId = null) => {
  let matchFilter = {};
  
  if (vendorId) {
    // Vendor-specific stats - support both userId and vendor fields
    matchFilter = {
      $or: [
        { userId: new mongoose.Types.ObjectId(vendorId) },
        { vendor: new mongoose.Types.ObjectId(vendorId) }
      ]
    };
  }

  const stats = await Product.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        publishedProducts: {
          $sum: {
            $cond: [
              { $in: ['$status', ['published', 'approved']] },
              1,
              0
            ]
          }
        },
        pendingProducts: {
          $sum: {
            $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
          }
        },
        rejectedProducts: {
          $sum: {
            $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0]
          }
        },
        totalViews: { $sum: '$views' },
        totalLikes: { $sum: '$likes' },
        totalReviews: { $sum: '$totalReviews' },
        avgRating: { $avg: '$avgRating' }
      }
    }
  ]);

  const result = stats[0] || {
    totalProducts: 0,
    publishedProducts: 0,
    pendingProducts: 0,
    rejectedProducts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalReviews: 0,
    avgRating: 0
  };

  // Get additional stats if vendor-specific
  if (vendorId) {
    const topProducts = await Product.find(matchFilter)
      .sort({ avgRating: -1, totalReviews: -1, views: -1 })
      .limit(5)
      .select('name slug avgRating totalReviews views likes')
      .populate('userId', 'firstName lastName companyName')
      .populate('vendor', 'firstName lastName companyName');

    result.topProducts = topProducts;
  }

  return result;
};

/**
 * Update product rating (called when reviews are added/updated)
 * @param {string} productId - Product ID
 * @param {number} newRating - New rating to add
 * @returns {Object} Updated product
 */
const updateProductRating = async (productId, newRating) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError('Invalid product ID', 'INVALID_PRODUCT_ID', 400);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError('Product not found', 'PRODUCT_NOT_FOUND', 404);
  }

  await product.updateRating(newRating);
  return product;
};

/**
 * Add product to favorites
 * @param {string} productId - Product ID
 * @param {string} userId - User ID
 * @returns {Object} Result
 */
const addToFavorites = async (productId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError('Invalid product ID', 'INVALID_PRODUCT_ID', 400);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError('Product not found', 'PRODUCT_NOT_FOUND', 404);
  }

  // This would typically create a record in a Favorites collection
  // For now, just return success
  return { 
    success: true, 
    message: 'Product added to favorites',
    productId,
    userId 
  };
};

const productService = {
  createProduct,
  getProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  getVendorProducts,
  toggleProductLike,
  searchProducts,
  getProductStats,
  updateProductRating,
  addToFavorites
};

module.exports = productService; 