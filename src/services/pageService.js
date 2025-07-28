const mongoose = require('mongoose');
const slugify = require('slugify');
const { Page, Admin } = require('../models');
const ApiError = require('../utils/apiError');

/**
 * Create new page
 * @param {Object} pageData - Page data
 * @param {string} adminId - Admin ID creating the page
 * @returns {Object} Created page
 */
const createPage = async (pageData, adminId) => {
  try {
    // Check if page name already exists
    const existingPage = await Page.findOne({ name: pageData.name });
    if (existingPage) {
      throw new ApiError('Page name already exists', 'DUPLICATE_PAGE', 400);
    }

    // Check if slug already exists
    const slug = pageData.slug || slugify(pageData.name, { lower: true, strict: true });
    const existingSlug = await Page.findOne({ slug });
    if (existingSlug) {
      throw new ApiError('Page slug already exists', 'DUPLICATE_SLUG', 400);
    }

    // Create page with admin reference
    const page = new Page({
      ...pageData,
      slug,
      createdBy: adminId
    });

    await page.save();
    await page.populate('createdBy', 'firstName lastName email');
    
    return page;
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      throw new ApiError(messages[0], 'VALIDATION_ERROR', 400, { details: error.errors });
    }
    throw error;
  }
};

/**
 * Get all pages with pagination and filtering
 * @param {Object} options - Query options
 * @returns {Object} Paginated pages
 */
const getAllPages = async (options) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status = '',
    isSystemPage = '',
    sortBy = 'updatedAt',
    sortOrder = 'desc'
  } = options;

  const query = {};

  // Add search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { slug: { $regex: search, $options: 'i' } }
    ];
  }

  // Add status filter
  if (status) {
    query.status = status;
  }

  // Add system page filter
  if (isSystemPage !== '') {
    query.isSystemPage = isSystemPage === 'true';
  }

  // Create sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Calculate skip value for pagination
  const skip = (page - 1) * limit;

  // Execute query with pagination
  const [pages, total] = await Promise.all([
    Page.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    Page.countDocuments(query)
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
    pages,
    pagination
  };
};

/**
 * Get active pages only
 * @param {Object} options - Query options
 * @returns {Object} Paginated active pages
 */
const getActivePages = async (options) => {
  return getAllPages({
    ...options,
    status: 'active'
  });
};

/**
 * Get page by ID
 * @param {string} pageId - Page ID
 * @returns {Object} Page
 */
const getPageById = async (pageId) => {
  if (!mongoose.Types.ObjectId.isValid(pageId)) {
    throw new ApiError('Invalid page ID', 'INVALID_ID', 400);
  }

  const page = await Page.findById(pageId)
    .populate('createdBy', 'firstName lastName email');

  if (!page) {
    throw new ApiError('Page not found', 'PAGE_NOT_FOUND', 404);
  }

  return page;
};

/**
 * Get page by slug
 * @param {string} slug - Page slug
 * @returns {Object} Page
 */
const getPageBySlug = async (slug) => {
  const page = await Page.findOne({ slug })
    .populate('createdBy', 'firstName lastName email');

  if (!page) {
    throw new ApiError('Page not found', 'PAGE_NOT_FOUND', 404);
  }

  return page;
};

/**
 * Update page
 * @param {string} pageId - Page ID
 * @param {Object} updateData - Update data
 * @param {string} adminId - Admin ID updating the page
 * @returns {Object} Updated page
 */
const updatePage = async (pageId, updateData, adminId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(pageId)) {
      throw new ApiError('Invalid page ID', 'INVALID_ID', 400);
    }

    const existingPage = await Page.findById(pageId);
    if (!existingPage) {
      throw new ApiError('Page not found', 'PAGE_NOT_FOUND', 404);
    }

    // Check if name is being updated and already exists
    if (updateData.name && updateData.name !== existingPage.name) {
      const duplicateName = await Page.findOne({ 
        name: updateData.name, 
        _id: { $ne: pageId } 
      });
      if (duplicateName) {
        throw new ApiError('Page name already exists', 'DUPLICATE_PAGE', 400);
      }
    }

    // Generate new slug if name is updated
    if (updateData.name && updateData.name !== existingPage.name) {
      updateData.slug = slugify(updateData.name, { lower: true, strict: true });
    }

    // Check if slug is being updated and already exists
    if (updateData.slug && updateData.slug !== existingPage.slug) {
      const duplicateSlug = await Page.findOne({ 
        slug: updateData.slug, 
        _id: { $ne: pageId } 
      });
      if (duplicateSlug) {
        throw new ApiError('Page slug already exists', 'DUPLICATE_SLUG', 400);
      }
    }

    const page = await Page.findByIdAndUpdate(
      pageId,
      { ...updateData, updatedBy: adminId },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    return page;
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      throw new ApiError(messages[0], 'VALIDATION_ERROR', 400, { details: error.errors });
    }
    throw error;
  }
};

/**
 * Delete page
 * @param {string} pageId - Page ID
 * @returns {Object} Deleted page
 */
const deletePage = async (pageId) => {
  if (!mongoose.Types.ObjectId.isValid(pageId)) {
    throw new ApiError('Invalid page ID', 'INVALID_ID', 400);
  }

  const page = await Page.findById(pageId);
  if (!page) {
    throw new ApiError('Page not found', 'PAGE_NOT_FOUND', 404);
  }

  // Prevent deletion of system pages
  if (page.isSystemPage) {
    throw new ApiError('System pages cannot be deleted', 'SYSTEM_PAGE_DELETE', 403);
  }

  await Page.findByIdAndDelete(pageId);
  return page;
};

/**
 * Toggle page status
 * @param {string} pageId - Page ID
 * @param {string} adminId - Admin ID performing the action
 * @returns {Object} Updated page
 */
const togglePageStatus = async (pageId, adminId) => {
  if (!mongoose.Types.ObjectId.isValid(pageId)) {
    throw new ApiError('Invalid page ID', 'INVALID_ID', 400);
  }

  const page = await Page.findById(pageId);
  if (!page) {
    throw new ApiError('Page not found', 'PAGE_NOT_FOUND', 404);
  }

  page.status = page.status === 'active' ? 'inactive' : 'active';
  page.updatedBy = adminId;
  await page.save();

  await page.populate('createdBy', 'firstName lastName email');
  return page;
};

/**
 * Bulk delete pages
 * @param {Array} pageIds - Array of page IDs
 * @returns {Object} Result summary
 */
const bulkDeletePages = async (pageIds) => {
  if (!Array.isArray(pageIds) || pageIds.length === 0) {
    throw new ApiError('Page IDs array is required', 'INVALID_INPUT', 400);
  }

  // Validate all page IDs
  const invalidIds = pageIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    throw new ApiError('Invalid page IDs provided', 'INVALID_IDS', 400);
  }

  // Check for system pages
  const systemPages = await Page.find({ 
    _id: { $in: pageIds }, 
    isSystemPage: true 
  });

  if (systemPages.length > 0) {
    throw new ApiError('System pages cannot be deleted', 'SYSTEM_PAGE_DELETE', 403);
  }

  const result = await Page.deleteMany({ _id: { $in: pageIds } });

  return {
    deletedCount: result.deletedCount,
    requestedCount: pageIds.length
  };
};

module.exports = {
  createPage,
  getAllPages,
  getActivePages,
  getPageById,
  getPageBySlug,
  updatePage,
  deletePage,
  togglePageStatus,
  bulkDeletePages
}; 