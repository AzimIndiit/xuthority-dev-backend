const { body, param, query } = require('express-validator');

// Validation for creating software
const validateCreateSoftware = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Software name is required')
    .bail() // Stop validation chain if the previous validation failed
    .isLength({ min: 2, max: 100 })
    .withMessage('Software name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-&().,]+$/)
    .withMessage('Software name contains invalid characters'),

  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),

  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured must be a boolean'),

  body('isPopular')
    .optional()
    .isBoolean()
    .withMessage('isPopular must be a boolean')
];

// Validation for updating software
const validateUpdateSoftware = [
  param('id')
    .isMongoId()
    .withMessage('Invalid software ID'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Software name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Software name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-&().,]+$/)
    .withMessage('Software name contains invalid characters'),

  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),

  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured must be a boolean'),

  body('isPopular')
    .optional()
    .isBoolean()
    .withMessage('isPopular must be a boolean')
];

// Validation for getting software by ID
const validateGetSoftwareById = [
  param('id')
    .isMongoId()
    .withMessage('Invalid software ID')
];

// Validation for getting software by slug
const validateGetSoftwareBySlug = [
  param('slug')
    .trim()
    .notEmpty()
    .withMessage('Software slug is required')
    .isLength({ min: 1, max: 150 })
    .withMessage('Software slug must be between 1 and 150 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Software slug can only contain lowercase letters, numbers, and hyphens')
];

// Validation for software listing with search and pagination
const validateGetSoftwareList = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query cannot exceed 100 characters'),

  query('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),

  query('sortBy')
    .optional()
    .isIn(['name', 'status', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc')
];

// Validation for deleting software
const validateDeleteSoftware = [
  param('id')
    .isMongoId()
    .withMessage('Invalid software ID')
];

// Validation for toggling software status
const validateToggleSoftwareStatus = [
  param('id')
    .isMongoId()
    .withMessage('Invalid software ID')
];

// Validation for getting featured softwares with top products
const validateGetFeaturedSoftwaresWithProducts = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('productsPerSoftware')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Products per software must be between 1 and 20'),

  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Minimum rating must be between 0 and 5'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'avgRating', 'totalReviews', 'productCount', 'name'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc')
];

module.exports = {
  create: validateCreateSoftware,
  update: validateUpdateSoftware,
  getById: validateGetSoftwareById,
  getBySlug: validateGetSoftwareBySlug,
  query: validateGetSoftwareList,
  delete: validateDeleteSoftware,
  toggleStatus: validateToggleSoftwareStatus,
  getFeaturedWithProducts: validateGetFeaturedSoftwaresWithProducts,
  // Keep the old names for backward compatibility
  validateCreateSoftware,
  validateUpdateSoftware,
  validateGetSoftwareById,
  validateGetSoftwareBySlug,
  validateGetSoftwareList,
  validateDeleteSoftware,
  validateToggleSoftwareStatus,
  validateGetFeaturedSoftwaresWithProducts
}; 