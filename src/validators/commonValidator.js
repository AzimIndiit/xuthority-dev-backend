const { param, query } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Validation for MongoDB ObjectId in URL parameters
 */
exports.mongoIdValidator = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID format')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid ObjectId format');
      }
      return true;
    }),
];

/**
 * Validation for pagination parameters
 */
exports.paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
];

/**
 * Validation for search query
 */
exports.searchValidator = [
  query('q')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Search query must not be empty')
    .trim(),
];

/**
 * Combined pagination and search validator
 */
exports.paginationSearchValidator = [
  ...exports.paginationValidator,
  ...exports.searchValidator,
];
