const { body, param, query } = require('express-validator');
const { isValidObjectId } = require('mongoose');

const resourceCategoryValidator = {
  // Create resource category validation
  create: [
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .trim(),
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be either active or inactive')
  ],

  // Update resource category validation
  update: [
    param('id')
      .notEmpty()
      .withMessage('Resource category ID is required')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid resource category ID');
        }
        return true;
      }),
    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .trim(),
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be either active or inactive')
  ],

  // Get by ID validation
  getById: [
    param('id')
      .notEmpty()
      .withMessage('Resource category ID is required')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid resource category ID');
        }
        return true;
      })
  ],

  // Get by slug validation
  getBySlug: [
    param('slug')
      .notEmpty()
      .withMessage('Resource category slug is required')
      .isLength({ min: 2 })
      .withMessage('Slug must be at least 2 characters long')
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Slug must contain only lowercase letters, numbers, and hyphens')
  ],

  // Delete validation
  delete: [
    param('id')
      .notEmpty()
      .withMessage('Resource category ID is required')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid resource category ID');
        }
        return true;
      })
  ],

  // Toggle status validation
  toggleStatus: [
    param('id')
      .notEmpty()
      .withMessage('Resource category ID is required')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid resource category ID');
        }
        return true;
      })
  ],

  // Query validation for listing
  list: [
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
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters')
      .trim(),
    query('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be either active or inactive'),
    query('sortBy')
      .optional()
      .isIn(['name', 'status', 'createdAt', 'updatedAt'])
      .withMessage('Sort by must be one of: name, status, createdAt, updatedAt'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be either asc or desc')
  ]
};

module.exports = resourceCategoryValidator; 