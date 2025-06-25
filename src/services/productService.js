const mongoose = require('mongoose');
const slugify = require('slugify');
const { Product, User } = require('../models');
const ApiError = require('../utils/apiError');

/**
 * Create a new product (vendors only)
 * @param {Object} productData - Product data
 * @param {string} vendorId - Vendor user ID
 * @returns {Object} Created product
 */
const createProduct = async (productData, vendorId) => {
  try {
    // Verify vendor exists and has vendor role
    const vendor = await User.findById(vendorId);
    if (!vendor) {
      throw new ApiError('Vendor not found', 'VENDOR_NOT_FOUND', 404);
    }
    
    if (vendor.role !== 'vendor') {
      throw new ApiError('Only vendors can create products', 'INSUFFICIENT_PERMISSIONS', 403);
    }

    // Generate unique slug using slugify
    let slug = slugify(productData.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
    
    // Ensure slug is unique
    let uniqueSlug = slug;
    let counter = 1;
    while (await Product.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const product = new Product({
      ...productData,
      vendor: vendorId,
      slug: uniqueSlug,
      status: 'draft' // New products start as draft
    });

    await product.save();
    await product.populate('vendor', 'firstName lastName companyName email');
    
    return product;
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      throw new ApiError(`Validation failed: ${messages.join(', ')}`, 'VALIDATION_ERROR', 400);
    }
    throw error;
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
    vendor,
    software,
    industries,
    marketSegment,
    solutions,
    search,
    isActive,
    isFeatured,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  // Build filter
  const filter = {};
  
  if (status) filter.status = status;
  if (vendor) filter.vendor = vendor;
  if (software) filter.software = software;
  if (isActive !== undefined) filter.isActive = isActive;
  if (isFeatured !== undefined) filter.isFeatured = isFeatured;
  
  if (industries && industries.length) {
    filter.industries = { $in: industries };
  }
  
  if (marketSegment && marketSegment.length) {
    filter.marketSegment = { $in: marketSegment };
  }
  
  if (solutions && solutions.length) {
    filter.solutions = { $in: solutions };
  }

  // Add text search if provided
  if (search) {
    filter.$text = { $search: search };
  }

  // Build sort object
  const sort = {};
  if (search) {
    sort.score = { $meta: 'textScore' };
  } else {
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;
  
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('vendor', 'firstName lastName companyName email')
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
 * Get product by ID
 * @param {string} productId - Product ID
 * @param {boolean} incrementViews - Whether to increment view count
 * @returns {Object} Product
 */
const getProductById = async (productId, incrementViews = false) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError('Invalid product ID', 'INVALID_PRODUCT_ID', 400);
  }

  const product = await Product.findById(productId)
    .populate('vendor', 'firstName lastName companyName email socialLinks');

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
    .populate('vendor', 'firstName lastName companyName email socialLinks');

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
 * @param {string} vendorId - Vendor ID
 * @returns {Object} Updated product
 */
const updateProduct = async (productId, updateData, vendorId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError('Invalid product ID', 'INVALID_PRODUCT_ID', 400);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError('Product not found', 'PRODUCT_NOT_FOUND', 404);
  }

  // Check if vendor owns this product
  if (product.vendor.toString() !== vendorId) {
    throw new ApiError('You can only update your own products', 'INSUFFICIENT_PERMISSIONS', 403);
  }

  try {
    // Update slug if name changes
    if (updateData.name && updateData.name !== product.name) {
      let newSlug = slugify(updateData.name, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g
      });
      
      // Ensure slug is unique
      let uniqueSlug = newSlug;
      let counter = 1;
      while (await Product.findOne({ slug: uniqueSlug, _id: { $ne: productId } })) {
        uniqueSlug = `${newSlug}-${counter}`;
        counter++;
      }
      updateData.slug = uniqueSlug;
    }

    Object.assign(product, updateData);
    await product.save();
    await product.populate('vendor', 'firstName lastName companyName email');
    
    return product;
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
 * @param {string} vendorId - Vendor ID
 * @returns {Object} Success message
 */
const deleteProduct = async (productId, vendorId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError('Invalid product ID', 'INVALID_PRODUCT_ID', 400);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError('Product not found', 'PRODUCT_NOT_FOUND', 404);
  }

  // Check if vendor owns this product
  if (product.vendor.toString() !== vendorId) {
    throw new ApiError('You can only delete your own products', 'INSUFFICIENT_PERMISSIONS', 403);
  }

  await Product.findByIdAndDelete(productId);
  
  return {
    message: 'Product deleted successfully',
    productId
  };
};

/**
 * Get vendor's products
 * @param {string} vendorId - Vendor ID
 * @param {Object} options - Query options
 * @returns {Object} Products with metadata
 */
const getVendorProducts = async (vendorId, options = {}) => {
  const {
    page = 1,
    limit = 10,
    status,
    isActive,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  // Verify vendor exists
  const vendor = await User.findById(vendorId);
  if (!vendor) {
    throw new ApiError('Vendor not found', 'VENDOR_NOT_FOUND', 404);
  }

  // Build filter
  const filter = { vendor: vendorId };
  if (status) filter.status = status;
  if (isActive !== undefined) filter.isActive = isActive;

  // Build sort
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (page - 1) * limit;
  
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('vendor', 'firstName lastName companyName email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter)
  ]);

  return {
    products,
    vendor: {
      _id: vendor._id,
      firstName: vendor.firstName,
      lastName: vendor.lastName,
      companyName: vendor.companyName,
      email: vendor.email
    },
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
 * Search products
 * @param {string} query - Search query
 * @param {Object} filters - Additional filters
 * @returns {Object} Search results
 */
const searchProducts = async (query, filters = {}) => {
  const {
    page = 1,
    limit = 10,
    software,
    industries,
    marketSegment,
    solutions
  } = filters;

  return await Product.search(query, {
    software,
    industries,
    marketSegment,
    solutions,
    page,
    limit
  });
};

/**
 * Get product statistics
 * @param {string} vendorId - Vendor ID (optional)
 * @returns {Object} Statistics
 */
const getProductStats = async (vendorId = null) => {
  const baseFilter = vendorId ? { vendor: vendorId } : {};

  const [
    totalProducts,
    publishedProducts,
    draftProducts,
    archivedProducts,
    totalViews,
    totalLikes
  ] = await Promise.all([
    Product.countDocuments(baseFilter),
    Product.countDocuments({ ...baseFilter, status: 'published' }),
    Product.countDocuments({ ...baseFilter, status: 'draft' }),
    Product.countDocuments({ ...baseFilter, status: 'archived' }),
    Product.aggregate([
      { $match: baseFilter },
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]).then(result => result[0]?.total || 0),
    Product.aggregate([
      { $match: baseFilter },
      { $group: { _id: null, total: { $sum: '$likes' } } }
    ]).then(result => result[0]?.total || 0)
  ]);

  return {
    totalProducts,
    publishedProducts,
    draftProducts,
    archivedProducts,
    totalViews,
    totalLikes
  };
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  getVendorProducts,
  toggleProductLike,
  searchProducts,
  getProductStats
}; 