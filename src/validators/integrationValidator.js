const { body, param, query } = require('express-validator');

const integrationValidator = {
  // Create integration validation
  create: [
    body('name')
      .notEmpty()
      .withMessage('Integration name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Integration name must be between 2 and 100 characters')
      .trim()
      .escape(),
    body('image')
      .optional()
      .isURL()
      .withMessage('Image must be a valid URL'),
    body('link')
      .optional()
      .isURL()
      .withMessage('Link must be a valid URL'),
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be either active or inactive')
  ],

  // Update integration validation
  update: [
    param('id').isMongoId().withMessage('Invalid integration ID'),
    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Integration name must be between 2 and 100 characters')
      .trim()
      .escape(),
    body('image')
      .optional()
      .isURL()
      .withMessage('Image must be a valid URL'),
    body('link')
      .optional()
      .isURL()
      .withMessage('Link must be a valid URL'),
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be either active or inactive')
  ],

  // Get integration by ID validation
  getById: [
    param('id').isMongoId().withMessage('Invalid integration ID')
  ],

  // Get integration by slug validation
  getBySlug: [
    param('slug').notEmpty().withMessage('Integration slug is required')
  ],

  // Delete integration validation
  delete: [
    param('id').isMongoId().withMessage('Invalid integration ID')
  ],

  // Toggle status validation
  toggleStatus: [
    param('id').isMongoId().withMessage('Invalid integration ID')
  ],

  // Query validation for listing integrations
  query: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isLength({ max: 100 }).withMessage('Search term cannot exceed 100 characters').trim().escape(),
    query('status').optional().isIn(['active', 'inactive']).withMessage('Status must be either active or inactive'),
    query('sortBy').optional().isIn(['name', 'status', 'createdAt', 'updatedAt']).withMessage('SortBy must be one of: name, status, createdAt, updatedAt'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('SortOrder must be either asc or desc')
  ]
};

module.exports = integrationValidator;
