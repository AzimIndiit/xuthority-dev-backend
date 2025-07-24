const { body, query, param } = require('express-validator');

/**
 * Validation for admin badge queries (GET /admin/badges)
 */
const validateAdminBadgeQuery = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a positive integer between 1 and 1000'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be a positive integer between 1 and 100'),
    
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
    .escape(),
    
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'all'])
    .withMessage('Status must be one of: active, inactive, all'),
    
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'title', 'earnedBy', 'status'])
    .withMessage('sortBy must be one of: createdAt, title, earnedBy, status'),
    
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be either asc or desc')
];

/**
 * Validation for admin badge requests query (GET /admin/badge-requests)
 */
const validateAdminBadgeRequestQuery = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a positive integer between 1 and 1000'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be a positive integer between 1 and 100'),
    
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
    .escape(),
    
  query('status')
    .optional()
    .isIn(['requested', 'approved', 'rejected', 'all'])
    .withMessage('Status must be one of: requested, approved, rejected, all'),
    
  query('sortBy')
    .optional()
    .isIn(['requestedAt', 'approvedAt', 'rejectedAt'])
    .withMessage('sortBy must be one of: requestedAt, approvedAt, rejectedAt'),
    
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be either asc or desc')
];

/**
 * Validation for creating a new badge
 */
const validateCreateBadge = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters')
    .escape(),
    
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters')
    .escape(),
    
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Icon must not exceed 50 characters'),
    
  body('colorCode')
    .optional()
    .trim()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color code must be a valid hex color'),
    
  body('criteria')
    .optional()
    .isArray()
    .withMessage('Criteria must be an array'),
    
  body('criteria.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Each criterion must be between 1 and 200 characters')
    .escape(),
    
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

/**
 * Validation for updating a badge
 */
const validateUpdateBadge = [
  param('id')
    .isMongoId()
    .withMessage('Invalid badge ID format'),
    
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters')
    .escape(),
    
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters')
    .escape(),
    
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Icon must not exceed 50 characters'),
    
  body('colorCode')
    .optional()
    .trim()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color code must be a valid hex color'),
    
  body('criteria')
    .optional()
    .isArray()
    .withMessage('Criteria must be an array'),
    
  body('criteria.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Each criterion must be between 1 and 200 characters')
    .escape(),
    
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

/**
 * Validation for updating badge status
 */
const validateUpdateBadgeStatus = [
  param('id')
    .isMongoId()
    .withMessage('Invalid badge ID format'),
    
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

/**
 * Validation for badge ID parameter
 */
const validateBadgeId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid badge ID format')
];

/**
 * Validation for rejecting badge request
 */
const validateRejectBadgeRequest = [
  param('id')
    .isMongoId()
    .withMessage('Invalid request ID format'),
    
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Rejection reason must not exceed 500 characters')
    .escape()
];

/**
 * Validation for general request ID parameter
 */
const validateRequestId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid request ID format')
];

module.exports = {
  validateAdminBadgeQuery,
  validateAdminBadgeRequestQuery,
  validateCreateBadge,
  validateUpdateBadge,
  validateUpdateBadgeStatus,
  validateBadgeId,
  validateRejectBadgeRequest,
  validateRequestId
}; 