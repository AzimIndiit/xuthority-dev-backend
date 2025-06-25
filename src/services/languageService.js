const mongoose = require('mongoose');
const slugify = require('slugify');
const { Language, User } = require('../models');
const ApiError = require('../utils/apiError');

/**
 * Create new language
 * @param {Object} languageData - Language data
 * @param {string} userId - User ID creating the language
 * @returns {Object} Created language
 */
const createLanguage = async (languageData, userId) => {
  try {
    // Check if language name already exists
    const existingLanguage = await Language.findOne({ name: languageData.name });
    if (existingLanguage) {
      throw new ApiError('Language name already exists', 'DUPLICATE_LANGUAGE', 400);
    }

    // Create language with user reference
    const language = new Language({
      ...languageData,
      createdBy: userId
    });

    await language.save();
    await language.populate('createdBy', 'firstName lastName companyName email');
    
    return language;
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      throw new ApiError(messages[0], 'VALIDATION_ERROR', 400, { details: error.errors });
    }
    throw error;
  }
};

/**
 * Get all languages with pagination and filtering
 * @param {Object} options - Query options
 * @returns {Object} Paginated languages
 */
const getAllLanguages = async (options) => {
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
  const [languages, total] = await Promise.all([
    Language.find(query)
      .populate('createdBy', 'firstName lastName companyName email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Language.countDocuments(query)
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    languages,
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
 * Get active languages only
 * @param {Object} options - Query options
 * @returns {Object} Paginated active languages
 */
const getActiveLanguages = async (options) => {
  return await getAllLanguages({ ...options, status: 'active' });
};

/**
 * Get language by ID
 * @param {string} languageId - Language ID
 * @returns {Object} Language
 */
const getLanguageById = async (languageId) => {
  if (!mongoose.Types.ObjectId.isValid(languageId)) {
    throw new ApiError('Invalid language ID', 'INVALID_ID', 400);
  }

  const language = await Language.findById(languageId)
    .populate('createdBy', 'firstName lastName companyName email');

  if (!language) {
    throw new ApiError('Language not found', 'LANGUAGE_NOT_FOUND', 404);
  }

  return language;
};

/**
 * Get language by slug
 * @param {string} slug - Language slug
 * @returns {Object} Language
 */
const getLanguageBySlug = async (slug) => {
  const language = await Language.findOne({ slug })
    .populate('createdBy', 'firstName lastName companyName email');

  if (!language) {
    throw new ApiError('Language not found', 'LANGUAGE_NOT_FOUND', 404);
  }

  return language;
};

/**
 * Update language
 * @param {string} languageId - Language ID
 * @param {Object} updateData - Update data
 * @param {string} userId - User ID updating the language
 * @returns {Object} Updated language
 */
const updateLanguage = async (languageId, updateData, userId) => {
  const language = await Language.findById(languageId);
  
  if (!language) {
    throw new ApiError('Language not found', 'LANGUAGE_NOT_FOUND', 404);
  }

  try {
    // Update slug if name changes
    if (updateData.name && updateData.name !== language.name) {
      let newSlug = slugify(updateData.name, {
        lower: true,
        strict: true,
        remove: /[*+~.()'\"!:@]/g
      });
      
      // Ensure slug is unique
      let uniqueSlug = newSlug;
      let counter = 1;
      while (await Language.findOne({ slug: uniqueSlug, _id: { $ne: languageId } })) {
        uniqueSlug = `${newSlug}-${counter}`;
        counter++;
      }
      updateData.slug = uniqueSlug;
    }

    Object.assign(language, updateData);
    await language.save();
    await language.populate('createdBy', 'firstName lastName companyName email');
    
    return language;
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      throw new ApiError(messages[0], 'VALIDATION_ERROR', 400, { details: error.errors });
    }
    if (error.code === 11000) {
      throw new ApiError('Language name already exists', 'DUPLICATE_LANGUAGE', 400);
    }
    throw error;
  }
};

/**
 * Delete language
 * @param {string} languageId - Language ID
 * @param {string} userId - User ID deleting the language
 * @returns {Object} Success message
 */
const deleteLanguage = async (languageId, userId) => {
  const language = await Language.findById(languageId);
  
  if (!language) {
    throw new ApiError('Language not found', 'LANGUAGE_NOT_FOUND', 404);
  }

  await Language.findByIdAndDelete(languageId);
  
  return { message: 'Language deleted successfully' };
};

/**
 * Toggle language status
 * @param {string} languageId - Language ID
 * @param {string} userId - User ID toggling the status
 * @returns {Object} Updated language
 */
const toggleLanguageStatus = async (languageId, userId) => {
  const language = await Language.findById(languageId);
  
  if (!language) {
    throw new ApiError('Language not found', 'LANGUAGE_NOT_FOUND', 404);
  }

  language.status = language.status === 'active' ? 'inactive' : 'active';
  await language.save();
  await language.populate('createdBy', 'firstName lastName companyName email');
  
  return language;
};

module.exports = {
  createLanguage,
  getAllLanguages,
  getActiveLanguages,
  getLanguageById,
  getLanguageBySlug,
  updateLanguage,
  deleteLanguage,
  toggleLanguageStatus
}; 