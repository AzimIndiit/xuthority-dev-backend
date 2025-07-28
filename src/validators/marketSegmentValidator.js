const { body, param, query } = require('express-validator');

const marketSegmentValidator = {
  // Create market segment validation
  create: [
    body('name')
      .notEmpty()
      .withMessage('Market segment name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Market segment name must be between 2 and 100 characters')
      .trim()
      .escape(),
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be either active or inactive')
  ],

  // Update market segment validation
  update: [
    param('id').isMongoId().withMessage('Invalid market segment ID'),
    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Market segment name must be between 2 and 100 characters')
      .trim()
      .escape(),
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be either active or inactive')
  ],

  // Get market segment by ID validation
  getById: [
    param('id').isMongoId().withMessage('Invalid market segment ID')
  ],

  // Get market segment by slug validation
  getBySlug: [
    param('slug').notEmpty().withMessage('Market segment slug is required')
  ],

  // Delete market segment validation
  delete: [
    param('id').isMongoId().withMessage('Invalid market segment ID')
  ],

  // Toggle status validation
  toggleStatus: [
    param('id').isMongoId().withMessage('Invalid market segment ID')
  ],

  // Query validation for listing market segments
  query: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isLength({ max: 100 }).withMessage('Search term cannot exceed 100 characters').trim().escape(),
    query('status').optional().isIn(['active', 'inactive']).withMessage('Status must be either active or inactive'),
    query('sortBy').optional().isIn(['name', 'status', 'createdAt', 'updatedAt']).withMessage('SortBy must be one of: name, status, createdAt, updatedAt'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('SortOrder must be either asc or desc')
  ]
};

module.exports = marketSegmentValidator;
