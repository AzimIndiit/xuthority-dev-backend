const mongoose = require('mongoose');
const slugify = require('slugify');
const { MarketSegment, User } = require('../models');
const ApiError = require('../utils/apiError');

/**
 * Create new market segment
 * @param {Object} marketSegmentData - Market segment data
 * @param {string} userId - User ID creating the market segment
 * @returns {Object} Created market segment
 */
const createMarketSegment = async (marketSegmentData, userId) => {
  try {
    // Check if market segment name already exists
    const existingMarketSegment = await MarketSegment.findOne({ name: marketSegmentData.name });
    if (existingMarketSegment) {
      throw new ApiError('Market segment name already exists', 'DUPLICATE_MARKET_SEGMENT', 400);
    }

    // Create market segment with user reference
    const marketSegment = new MarketSegment({
      ...marketSegmentData,
      createdBy: userId
    });

    await marketSegment.save();
    await marketSegment.populate('createdBy', 'firstName lastName companyName email');
    
    return marketSegment;
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      throw new ApiError(messages[0], 'VALIDATION_ERROR', 400, { details: error.errors });
    }
    throw error;
  }
};

/**
 * Get all market segments with pagination and filtering
 * @param {Object} options - Query options
 * @returns {Object} Paginated market segments
 */
const getAllMarketSegments = async (options) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const query = {};

  // Add search filter
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  // Add status filter
  if (status) {
    query.status = status;
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Execute query
  const [marketSegments, total] = await Promise.all([
    MarketSegment.find(query)
      .populate('createdBy', 'firstName lastName companyName email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    MarketSegment.countDocuments(query)
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    marketSegments,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage
    }
  };
};

/**
 * Get active market segments only
 * @param {Object} options - Query options
 * @returns {Object} Paginated active market segments
 */
const getActiveMarketSegments = async (options) => {
  return await getAllMarketSegments({ ...options, status: 'active' });
};

/**
 * Get market segment by ID
 * @param {string} marketSegmentId - Market segment ID
 * @returns {Object} Market segment
 */
const getMarketSegmentById = async (marketSegmentId) => {
  if (!mongoose.Types.ObjectId.isValid(marketSegmentId)) {
    throw new ApiError('Invalid market segment ID', 'INVALID_ID', 400);
  }

  const marketSegment = await MarketSegment.findById(marketSegmentId)
    .populate('createdBy', 'firstName lastName companyName email');

  if (!marketSegment) {
    throw new ApiError('Market segment not found', 'MARKET_SEGMENT_NOT_FOUND', 404);
  }

  return marketSegment;
};

/**
 * Get market segment by slug
 * @param {string} slug - Market segment slug
 * @returns {Object} Market segment
 */
const getMarketSegmentBySlug = async (slug) => {
  const marketSegment = await MarketSegment.findOne({ slug })
    .populate('createdBy', 'firstName lastName companyName email');

  if (!marketSegment) {
    throw new ApiError('Market segment not found', 'MARKET_SEGMENT_NOT_FOUND', 404);
  }

  return marketSegment;
};

/**
 * Update market segment
 * @param {string} marketSegmentId - Market segment ID
 * @param {Object} updateData - Update data
 * @param {string} userId - User ID updating the market segment
 * @returns {Object} Updated market segment
 */
const updateMarketSegment = async (marketSegmentId, updateData, userId) => {
  const marketSegment = await MarketSegment.findById(marketSegmentId);
  
  if (!marketSegment) {
    throw new ApiError('Market segment not found', 'MARKET_SEGMENT_NOT_FOUND', 404);
  }

  try {
    // Update slug if name changes
    if (updateData.name && updateData.name !== marketSegment.name) {
      let newSlug = slugify(updateData.name, {
        lower: true,
        strict: true,
        remove: /[*+~.()'\"!:@]/g
      });
      
      // Ensure slug is unique
      let uniqueSlug = newSlug;
      let counter = 1;
      while (await MarketSegment.findOne({ slug: uniqueSlug, _id: { $ne: marketSegmentId } })) {
        uniqueSlug = `${newSlug}-${counter}`;
        counter++;
      }
      updateData.slug = uniqueSlug;
    }

    Object.assign(marketSegment, updateData);
    await marketSegment.save();
    await marketSegment.populate('createdBy', 'firstName lastName companyName email');
    
    return marketSegment;
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      throw new ApiError(messages[0], 'VALIDATION_ERROR', 400, { details: error.errors });
    }
    if (error.code === 11000) {
      throw new ApiError('Market segment name already exists', 'DUPLICATE_MARKET_SEGMENT', 400);
    }
    throw error;
  }
};

/**
 * Delete market segment
 * @param {string} marketSegmentId - Market segment ID
 * @param {string} userId - User ID deleting the market segment
 * @returns {Object} Success message
 */
const deleteMarketSegment = async (marketSegmentId, userId) => {
  const marketSegment = await MarketSegment.findById(marketSegmentId);
  
  if (!marketSegment) {
    throw new ApiError('Market segment not found', 'MARKET_SEGMENT_NOT_FOUND', 404);
  }

  await MarketSegment.findByIdAndDelete(marketSegmentId);
  
  return { message: 'Market segment deleted successfully' };
};

/**
 * Toggle market segment status
 * @param {string} marketSegmentId - Market segment ID
 * @param {string} userId - User ID toggling the status
 * @returns {Object} Updated market segment
 */
const toggleMarketSegmentStatus = async (marketSegmentId, userId) => {
  const marketSegment = await MarketSegment.findById(marketSegmentId);
  
  if (!marketSegment) {
    throw new ApiError('Market segment not found', 'MARKET_SEGMENT_NOT_FOUND', 404);
  }

  marketSegment.status = marketSegment.status === 'active' ? 'inactive' : 'active';
  await marketSegment.save();
  await marketSegment.populate('createdBy', 'firstName lastName companyName email');
  
  return marketSegment;
};

module.exports = {
  createMarketSegment,
  getAllMarketSegments,
  getActiveMarketSegments,
  getMarketSegmentById,
  getMarketSegmentBySlug,
  updateMarketSegment,
  deleteMarketSegment,
  toggleMarketSegmentStatus
}; 