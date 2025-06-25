const { body, param, query } = require('express-validator');

/**
 * Validation rules for creating a language
 */
const createLanguageValidation = [
  body('name')
    .notEmpty()
    .withMessage('Language name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Language name must be between 2 and 100 characters')
    .trim()
    .escape(),

  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

/**
 * Validation rules for updating a language
 */
const updateLanguageValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid language ID'),

  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Language name must be between 2 and 100 characters')
    .trim()
    .escape(),

  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

/**
 * Validation rules for getting a language by ID
 */
const getLanguageByIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid language ID')
];

/**
 * Validation rules for getting a language by slug
 */
const getLanguageBySlugValidation = [
  param('slug')
    .notEmpty()
    .withMessage('Language slug is required')
];

/**
 * Validation rules for deleting a language
 */
const deleteLanguageValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid language ID')
];

/**
 * Validation rules for toggling language status
 */
const toggleLanguageStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid language ID')
];

/**
 * Validation rules for getting all languages with query parameters
 */
const getAllLanguagesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term cannot exceed 100 characters')
    .trim()
    .escape(),

  query('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),

  query('sortBy')
    .optional()
    .isIn(['name', 'status', 'createdAt', 'updatedAt'])
    .withMessage('SortBy must be one of: name, status, createdAt, updatedAt'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('SortOrder must be either asc or desc')
];

/**
 * Validation rules for getting active languages
 */
const getActiveLanguagesValidation = getAllLanguagesValidation;

module.exports = {
  createLanguageValidation,
  updateLanguageValidation,
  getLanguageByIdValidation,
  getLanguageBySlugValidation,
  deleteLanguageValidation,
  toggleLanguageStatusValidation,
  getAllLanguagesValidation,
  getActiveLanguagesValidation
}; 