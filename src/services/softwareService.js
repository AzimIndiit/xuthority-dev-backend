const Software = require('../models/Software');
const ApiError = require('../utils/apiError');

/**
 * Create new software
 * @param {Object} softwareData - Software data
 * @param {string} userId - User ID who created the software
 * @returns {Promise<Object>} Created software
 */
exports.createSoftware = async (softwareData, userId) => {
  try {
    // Check for duplicate name
    const existingSoftware = await Software.findOne({ name: softwareData.name });
    if (existingSoftware) {
      throw new ApiError('Software name already exists', 'DUPLICATE_SOFTWARE', 400);
    }

    const software = new Software({
      ...softwareData,
      createdBy: userId
    });

    await software.save();
    await software.populate('createdBy', 'firstName lastName email');
    
    return software;
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError('Software name already exists', 'DUPLICATE_SOFTWARE', 400);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to create software', 'SOFTWARE_CREATE_FAILED', 500);
  }
};

/**
 * Get all software with search and pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Software list with pagination
 */
exports.getAllSoftware = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    // Build query
    const query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [software, total] = await Promise.all([
      Software.find(query)
        .populate('createdBy', 'firstName lastName email')
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Software.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      software,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage
      }
    };
  } catch (error) {
    throw new ApiError('Failed to fetch software', 'SOFTWARE_FETCH_FAILED', 500);
  }
};

/**
 * Get software by ID
 * @param {string} softwareId - Software ID
 * @returns {Promise<Object>} Software data
 */
exports.getSoftwareById = async (softwareId) => {
  try {
    const software = await Software.findById(softwareId)
      .populate('createdBy', 'firstName lastName email');

    if (!software) {
      throw new ApiError('Software not found', 'SOFTWARE_NOT_FOUND', 404);
    }

    return software;
  } catch (error) {
    if (error.name === 'CastError') {
      throw new ApiError('Invalid software ID', 'INVALID_SOFTWARE_ID', 400);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to fetch software', 'SOFTWARE_FETCH_FAILED', 500);
  }
};

/**
 * Get software by slug
 * @param {string} slug - Software slug
 * @returns {Promise<Object>} Software data
 */
exports.getSoftwareBySlug = async (slug) => {
  try {
    const software = await Software.findOne({ slug })
      .populate('createdBy', 'firstName lastName email');

    if (!software) {
      throw new ApiError('Software not found', 'SOFTWARE_NOT_FOUND', 404);
    }

    return software;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to fetch software', 'SOFTWARE_FETCH_FAILED', 500);
  }
};

/**
 * Update software
 * @param {string} softwareId - Software ID
 * @param {Object} updateData - Update data
 * @param {string} userId - User ID who is updating
 * @returns {Promise<Object>} Updated software
 */
exports.updateSoftware = async (softwareId, updateData, userId) => {
  try {
    const software = await Software.findById(softwareId);

    if (!software) {
      throw new ApiError('Software not found', 'SOFTWARE_NOT_FOUND', 404);
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        software[key] = updateData[key];
      }
    });

    await software.save();
    await software.populate('createdBy', 'firstName lastName email');

    return software;
  } catch (error) {
    if (error.name === 'CastError') {
      throw new ApiError('Invalid software ID', 'INVALID_SOFTWARE_ID', 400);
    }
    if (error.code === 11000) {
      throw new ApiError('Software name already exists', 'DUPLICATE_SOFTWARE', 400);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to update software', 'SOFTWARE_UPDATE_FAILED', 500);
  }
};

/**
 * Delete software
 * @param {string} softwareId - Software ID
 * @param {string} userId - User ID who is deleting
 * @returns {Promise<Object>} Deleted software
 */
exports.deleteSoftware = async (softwareId, userId) => {
  try {
    const software = await Software.findById(softwareId);

    if (!software) {
      throw new ApiError('Software not found', 'SOFTWARE_NOT_FOUND', 404);
    }

    await Software.findByIdAndDelete(softwareId);

    return { message: 'Software deleted successfully', software };
  } catch (error) {
    if (error.name === 'CastError') {
      throw new ApiError('Invalid software ID', 'INVALID_SOFTWARE_ID', 400);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to delete software', 'SOFTWARE_DELETE_FAILED', 500);
  }
};

/**
 * Toggle software status
 * @param {string} softwareId - Software ID
 * @param {string} userId - User ID who is toggling status
 * @returns {Promise<Object>} Updated software
 */
exports.toggleSoftwareStatus = async (softwareId, userId) => {
  try {
    const software = await Software.findById(softwareId);

    if (!software) {
      throw new ApiError('Software not found', 'SOFTWARE_NOT_FOUND', 404);
    }

    await software.toggleStatus();
    await software.populate('createdBy', 'firstName lastName email');

    return software;
  } catch (error) {
    if (error.name === 'CastError') {
      throw new ApiError('Invalid software ID', 'INVALID_SOFTWARE_ID', 400);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to toggle software status', 'SOFTWARE_TOGGLE_FAILED', 500);
  }
};

/**
 * Get active software only
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Active software list
 */
exports.getActiveSoftware = async (options = {}) => {
  try {
    return await this.getAllSoftware({ ...options, status: 'active' });
  } catch (error) {
    throw error;
  }
};

/**
 * Get featured softwares with their top-rated products
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Featured softwares with top-rated products
 */
exports.getFeaturedSoftwaresWithTopProducts = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      productsPerSoftware = 4,
      minRating = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    // Get all active softwares
    const activeSoftwares = await Software.find({ status: 'active', isFeatured: true })
      .populate('createdBy', 'firstName lastName email');

    if (!activeSoftwares.length) {
      return {
        softwares: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: parseInt(limit),
          hasNextPage: false,
          hasPrevPage: false
        }
      };
    }

    // Get products for each software with pagination
    const Product = require('../models/Product');
    const skip = (page - 1) * limit;
    const softwareIds = activeSoftwares.map(software => software._id);

    // Get featured softwares with their top-rated products
    const featuredSoftwares = await Promise.all(
      activeSoftwares.slice(skip, skip + limit).map(async (software) => {
        // Get top-rated products for this software
        const topProducts = await Product.find({
          softwareIds: software._id,
          status: { $in: ['published', 'approved'] },
          isActive: 'active',
          avgRating: { $gte: minRating }
        })
        .populate([
          { path: 'userId', select: 'firstName lastName companyName email' },
          { path: 'industries', select: 'name slug status' },
          { path: 'languages', select: 'name slug status' },
          { path: 'integrations', select: 'name image status' },
          { path: 'marketSegment', select: 'name slug status' },
          { path: 'whoCanUse', select: 'name slug status' },
          { path: 'solutionIds', select: 'name slug status' }
        ])
        .sort({ avgRating: -1, totalReviews: -1 })
        .limit(productsPerSoftware);

        // Only include software if it has at least one product
        if (topProducts.length > 0) {
          return {
            software: software.toObject(),
            topProducts,
            productCount: topProducts.length,
            hasMinimumProducts: topProducts.length >= productsPerSoftware
          };
        }
        return null;
      })
    );

    // Filter out null values (softwares without products)
    const validFeaturedSoftwares = featuredSoftwares.filter(item => item !== null);

    // Sort by criteria
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    validFeaturedSoftwares.sort((a, b) => {
      switch (sortBy) {
        case 'avgRating':
          const avgA = a.topProducts.reduce((sum, product) => sum + product.avgRating, 0) / a.topProducts.length;
          const avgB = b.topProducts.reduce((sum, product) => sum + product.avgRating, 0) / b.topProducts.length;
          return (avgA - avgB) * sortDirection;
        case 'totalReviews':
          const reviewsA = a.topProducts.reduce((sum, product) => sum + product.totalReviews, 0);
          const reviewsB = b.topProducts.reduce((sum, product) => sum + product.totalReviews, 0);
          return (reviewsA - reviewsB) * sortDirection;
        case 'productCount':
          return (a.productCount - b.productCount) * sortDirection;
        case 'name':
          return a.software.name.localeCompare(b.software.name) * sortDirection;
        default:
          return (new Date(a.software.createdAt) - new Date(b.software.createdAt)) * sortDirection;
      }
    });

    // Calculate pagination info
    const totalSoftwaresWithProducts = validFeaturedSoftwares.length;
    const totalPages = Math.ceil(activeSoftwares.length / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      softwares: validFeaturedSoftwares,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: activeSoftwares.length,
        itemsPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage
      },
      meta: {
        totalSoftwaresWithProducts,
        productsPerSoftware: parseInt(productsPerSoftware),
        minRating: parseInt(minRating),
        sortBy,
        sortOrder
      }
    };
  } catch (error) {
    throw new ApiError('Failed to fetch featured softwares with top products', 'FEATURED_SOFTWARES_FETCH_FAILED', 500);
  }
}; 