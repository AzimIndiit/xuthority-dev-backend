const mongoose = require('mongoose');
const { MetaTag, Admin } = require('../models');
const ApiError = require('../utils/apiError');

/**
 * Create new meta tag
 * @param {Object} metaTagData - Meta tag data
 * @param {string} adminId - Admin ID creating the meta tag
 * @returns {Object} Created meta tag
 */
const createMetaTag = async (metaTagData, adminId) => {
  try {
    // Check if page name already exists
    const existingMetaTag = await MetaTag.findOne({ pageName: metaTagData.pageName });
    if (existingMetaTag) {
      throw new ApiError('Meta tag for this page already exists', 'DUPLICATE_META_TAG', 400);
    }

    // Create meta tag with admin reference
    const metaTag = new MetaTag({
      ...metaTagData,
      createdBy: adminId
    });

    await metaTag.save();
    await metaTag.populate('createdBy', 'firstName lastName email');
    
    return metaTag;
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      throw new ApiError(messages[0], 'VALIDATION_ERROR', 400, { details: error.errors });
    }
    throw error;
  }
};

/**
 * Get all meta tags with pagination and filtering
 * @param {Object} options - Query options
 * @returns {Object} Paginated meta tags
 */
const getAllMetaTags = async (options) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status = '',
    sortBy = 'updatedAt',
    sortOrder = 'desc'
  } = options;

  const query = {};

  // Add search filter
  if (search) {
    query.$or = [
      { pageName: { $regex: search, $options: 'i' } },
      { metaTitle: { $regex: search, $options: 'i' } },
      { metaDescription: { $regex: search, $options: 'i' } }
    ];
  }

  // Add status filter
  if (status) {
    query.status = status;
  }

  // Create sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Calculate skip value for pagination
  const skip = (page - 1) * limit;

  // Execute query with pagination
  const [metaTags, total] = await Promise.all([
    MetaTag.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    MetaTag.countDocuments(query)
  ]);

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / limit);
  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };

  return {
    metaTags,
    pagination
  };
};

/**
 * Get active meta tags only
 * @param {Object} options - Query options
 * @returns {Object} Paginated active meta tags
 */
const getActiveMetaTags = async (options) => {
  return getAllMetaTags({
    ...options,
    status: 'active'
  });
};

/**
 * Get meta tag by ID
 * @param {string} metaTagId - Meta tag ID
 * @returns {Object} Meta tag
 */
const getMetaTagById = async (metaTagId) => {
  if (!mongoose.Types.ObjectId.isValid(metaTagId)) {
    throw new ApiError('Invalid meta tag ID', 'INVALID_ID', 400);
  }

  const metaTag = await MetaTag.findById(metaTagId)
    .populate('createdBy', 'firstName lastName email');

  if (!metaTag) {
    throw new ApiError('Meta tag not found', 'META_TAG_NOT_FOUND', 404);
  }

  return metaTag;
};

/**
 * Get meta tag by page name
 * @param {string} pageName - Page name
 * @returns {Object} Meta tag
 */
const getMetaTagByPageName = async (pageName) => {
  const metaTag = await MetaTag.findOne({ pageName })
    .populate('createdBy', 'firstName lastName email');

  if (!metaTag) {
    throw new ApiError('Meta tag not found', 'META_TAG_NOT_FOUND', 404);
  }

  return metaTag;
};

/**
 * Update meta tag
 * @param {string} metaTagId - Meta tag ID
 * @param {Object} updateData - Update data
 * @param {string} adminId - Admin ID updating the meta tag
 * @returns {Object} Updated meta tag
 */
const updateMetaTag = async (metaTagId, updateData, adminId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(metaTagId)) {
      throw new ApiError('Invalid meta tag ID', 'INVALID_ID', 400);
    }

    const existingMetaTag = await MetaTag.findById(metaTagId);
    if (!existingMetaTag) {
      throw new ApiError('Meta tag not found', 'META_TAG_NOT_FOUND', 404);
    }

    // Check if page name is being updated and already exists
    if (updateData.pageName && updateData.pageName !== existingMetaTag.pageName) {
      const duplicatePageName = await MetaTag.findOne({ 
        pageName: updateData.pageName, 
        _id: { $ne: metaTagId } 
      });
      if (duplicatePageName) {
        throw new ApiError('Meta tag for this page already exists', 'DUPLICATE_META_TAG', 400);
      }
    }

    const metaTag = await MetaTag.findByIdAndUpdate(
      metaTagId,
      { ...updateData, updatedBy: adminId },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    return metaTag;
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      throw new ApiError(messages[0], 'VALIDATION_ERROR', 400, { details: error.errors });
    }
    throw error;
  }
};

/**
 * Delete meta tag
 * @param {string} metaTagId - Meta tag ID
 * @returns {Object} Deleted meta tag
 */
const deleteMetaTag = async (metaTagId) => {
  if (!mongoose.Types.ObjectId.isValid(metaTagId)) {
    throw new ApiError('Invalid meta tag ID', 'INVALID_ID', 400);
  }

  const metaTag = await MetaTag.findById(metaTagId);
  if (!metaTag) {
    throw new ApiError('Meta tag not found', 'META_TAG_NOT_FOUND', 404);
  }

  await MetaTag.findByIdAndDelete(metaTagId);
  return metaTag;
};

/**
 * Toggle meta tag status
 * @param {string} metaTagId - Meta tag ID
 * @param {string} adminId - Admin ID performing the action
 * @returns {Object} Updated meta tag
 */
const toggleMetaTagStatus = async (metaTagId, adminId) => {
  if (!mongoose.Types.ObjectId.isValid(metaTagId)) {
    throw new ApiError('Invalid meta tag ID', 'INVALID_ID', 400);
  }

  const metaTag = await MetaTag.findById(metaTagId);
  if (!metaTag) {
    throw new ApiError('Meta tag not found', 'META_TAG_NOT_FOUND', 404);
  }

  metaTag.status = metaTag.status === 'active' ? 'inactive' : 'active';
  metaTag.updatedBy = adminId;
  await metaTag.save();

  await metaTag.populate('createdBy', 'firstName lastName email');
  return metaTag;
};

/**
 * Bulk delete meta tags
 * @param {Array} metaTagIds - Array of meta tag IDs
 * @returns {Object} Result summary
 */
const bulkDeleteMetaTags = async (metaTagIds) => {
  if (!Array.isArray(metaTagIds) || metaTagIds.length === 0) {
    throw new ApiError('Meta tag IDs array is required', 'INVALID_INPUT', 400);
  }

  // Validate all meta tag IDs
  const invalidIds = metaTagIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    throw new ApiError('Invalid meta tag IDs provided', 'INVALID_IDS', 400);
  }

  const result = await MetaTag.deleteMany({ _id: { $in: metaTagIds } });

  return {
    deletedCount: result.deletedCount,
    requestedCount: metaTagIds.length
  };
};

module.exports = {
  createMetaTag,
  getAllMetaTags,
  getActiveMetaTags,
  getMetaTagById,
  getMetaTagByPageName,
  updateMetaTag,
  deleteMetaTag,
  toggleMetaTagStatus,
  bulkDeleteMetaTags
}; 