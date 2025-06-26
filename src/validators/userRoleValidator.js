const { body, param, query } = require('express-validator');

const userRoleValidator = {
  // Create user role validation
  create: [
    body('name')
      .notEmpty()
      .withMessage('User role name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('User role name must be between 2 and 100 characters')
      .trim()
      .escape(),
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be either active or inactive')
  ],

  // Update user role validation
  update: [
    param('id').isMongoId().withMessage('Invalid user role ID'),
    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('User role name must be between 2 and 100 characters')
      .trim()
      .escape(),
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be either active or inactive')
  ],

  // Get user role by ID validation
  getById: [
    param('id').isMongoId().withMessage('Invalid user role ID')
  ],

  // Get user role by slug validation
  getBySlug: [
    param('slug').notEmpty().withMessage('User role slug is required')
  ],

  // Delete user role validation
  delete: [
    param('id').isMongoId().withMessage('Invalid user role ID')
  ],

  // Toggle status validation
  toggleStatus: [
    param('id').isMongoId().withMessage('Invalid user role ID')
  ],

  // Query validation for listing user roles
  query: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isLength({ max: 100 }).withMessage('Search term cannot exceed 100 characters').trim().escape(),
    query('status').optional().isIn(['active', 'inactive']).withMessage('Status must be either active or inactive'),
    query('sortBy').optional().isIn(['name', 'status', 'createdAt', 'updatedAt']).withMessage('SortBy must be one of: name, status, createdAt, updatedAt'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('SortOrder must be either asc or desc')
  ]
};

module.exports = userRoleValidator; 