const { body, param, query } = require('express-validator');
const { ObjectId } = require('mongoose').Types;

// Helper function to validate ObjectId
const isValidObjectId = (value) => {
  return ObjectId.isValid(value);
};

// Helper function to validate ObjectId arrays
const isValidObjectIdArray = (value) => {
  if (!Array.isArray(value)) return false;
  return value.every(id => ObjectId.isValid(id));
};

const productValidator = {
  // Create product validation
  create: [
    body('name')
      .notEmpty()
      .withMessage('Product name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Product name must be between 2 and 100 characters')
      .trim(),

    body('description')
      .notEmpty()
      .withMessage('Product description is required')
      .isLength({ min: 10, max: 2000 })
      .withMessage('Product description must be between 10 and 2000 characters')
      .trim(),

    body('websiteUrl')
      .optional()
      .isURL()
      .withMessage('Website URL must be a valid URL'),

    body('website')
      .optional()
      .isURL()
      .withMessage('Website must be a valid URL'),

    body('logoUrl')
      .optional()
      .isURL()
      .withMessage('Logo URL must be a valid URL'),

    body('brandColors')
      .optional()
      .isString()
      .trim(),

    body('mediaUrls')
      .optional()
      .isArray()
      .withMessage('Media URLs must be an array'),

    body('mediaUrls.*')
      .optional()
      .isURL()
      .withMessage('Each media URL must be a valid URL'),

    body('features')
      .optional(),

    body('pricing')
      .optional(),

    body('softwareIds')
      .optional()
      .custom(isValidObjectIdArray)
      .withMessage('Software IDs must be valid ObjectId array'),

    body('solutionIds')
      .optional()
      .custom(isValidObjectIdArray)
      .withMessage('Solution IDs must be valid ObjectId array'),

    body('whoCanUse')
      .optional()
      .custom(isValidObjectIdArray)
      .withMessage('Who can use must be valid ObjectId array'),

    body('industries')
      .optional()
      .custom(isValidObjectIdArray)
      .withMessage('Industries must be valid ObjectId array'),

    body('integrations')
      .optional()
      .custom(isValidObjectIdArray)
      .withMessage('Integrations must be valid ObjectId array'),

    body('languages')
      .optional()
      .custom(isValidObjectIdArray)
      .withMessage('Languages must be valid ObjectId array'),

    body('marketSegment')
      .optional()
      .custom(isValidObjectIdArray)
      .withMessage('Market segment must be valid ObjectId array'),

    body('keywords')
      .optional()
      .isArray()
      .withMessage('Keywords must be an array'),

    body('keywords.*')
      .optional()
      .isString()
      .trim()
      .toLowerCase(),

    body('metaTitle')
      .optional()
      .isLength({ max: 60 })
      .withMessage('Meta title must be less than 60 characters')
      .trim(),

    body('metaDescription')
      .optional()
      .isLength({ max: 160 })
      .withMessage('Meta description must be less than 160 characters')
      .trim(),

    body('status')
      .optional()
      .isIn(['pending', 'approved', 'rejected', 'draft', 'published', 'archived'])
      .withMessage('Invalid status'),

    body('isActive')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Invalid active status'),

    body('isFeatured')
      .optional()
      .isBoolean()
      .withMessage('Featured status must be boolean')
  ],

  // Update product validation
  update: [
    param('id')
      .notEmpty()
      .withMessage('Product ID is required'),

    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Product name must be between 2 and 100 characters')
      .trim(),

    body('description')
      .optional()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Product description must be between 10 and 2000 characters')
      .trim(),

    body('websiteUrl')
      .optional()
      .isURL()
      .withMessage('Website URL must be a valid URL'),

    body('website')
      .optional()
      .isURL()
      .withMessage('Website must be a valid URL'),

    body('logoUrl')
      .optional()
      .isURL()
      .withMessage('Logo URL must be a valid URL'),

    body('brandColors')
      .optional()
      .isString()
      .trim(),

    body('mediaUrls')
      .optional()
      .isArray()
      .withMessage('Media URLs must be an array'),

    body('mediaUrls.*')
      .optional()
      .isURL()
      .withMessage('Each media URL must be a valid URL'),

    body('features')
      .optional(),

    body('pricing')
      .optional(),

    body('softwareIds')
      .optional()
      .custom(isValidObjectIdArray)
      .withMessage('Software IDs must be valid ObjectId array'),

    body('solutionIds')
      .optional()
      .custom(isValidObjectIdArray)
      .withMessage('Solution IDs must be valid ObjectId array'),

    body('whoCanUse')
      .optional()
      .custom(isValidObjectIdArray)
      .withMessage('Who can use must be valid ObjectId array'),

    body('industries')
      .optional()
      .custom(isValidObjectIdArray)
      .withMessage('Industries must be valid ObjectId array'),

    body('integrations')
      .optional()
      .custom(isValidObjectIdArray)
      .withMessage('Integrations must be valid ObjectId array'),

    body('languages')
      .optional()
      .custom(isValidObjectIdArray)
      .withMessage('Languages must be valid ObjectId array'),

    body('marketSegment')
      .optional()
      .custom(isValidObjectIdArray)
      .withMessage('Market segment must be valid ObjectId array'),

    body('keywords')
      .optional()
      .isArray()
      .withMessage('Keywords must be an array'),

    body('keywords.*')
      .optional()
      .isString()
      .trim()
      .toLowerCase(),

    body('metaTitle')
      .optional()
      .isLength({ max: 60 })
      .withMessage('Meta title must be less than 60 characters')
      .trim(),

    body('metaDescription')
      .optional()
      .isLength({ max: 160 })
      .withMessage('Meta description must be less than 160 characters')
      .trim(),

    body('status')
      .optional()
      .isIn(['pending', 'approved', 'rejected', 'draft', 'published', 'archived'])
      .withMessage('Invalid status'),

    body('isActive')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Invalid active status'),

    body('isFeatured')
      .optional()
      .isBoolean()
      .withMessage('Featured status must be boolean')
  ],

  // Get product by ID validation
  getById: [
    param('id')
      .notEmpty()
      .withMessage('Product ID is required')
  ],

  // Get product by slug validation
  getBySlug: [
    param('slug')
      .notEmpty()
      .withMessage('Product slug is required')
      .isSlug()
      .withMessage('Invalid slug format')
  ],

  // Delete product validation
  delete: [
    param('id')
      .notEmpty()
      .withMessage('Product ID is required')
  ],

  // Toggle status validation
  toggleStatus: [
    param('id')
      .notEmpty()
      .withMessage('Product ID is required')
  ],

  // Update rating validation
  updateRating: [
    param('productId')
      .notEmpty()
      .withMessage('Product ID is required'),

    body('rating')
      .isFloat({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5')
  ],

  // Query validation for listing products
  query: [
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
      .isString()
      .trim(),

    query('status')
      .optional()
      .isIn(['pending', 'approved', 'rejected', 'draft', 'published', 'archived'])
      .withMessage('Invalid status'),

    query('isActive')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Invalid active status'),

    query('isFeatured')
      .optional()
      .isBoolean()
      .withMessage('Featured status must be boolean'),

    query('sort')
      .optional()
      .isIn(['name', 'createdAt', 'avgRating', 'totalReviews', 'views', 'likes'])
      .withMessage('Invalid sort field'),

    query('order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Order must be asc or desc'),

    query('industries')
      .optional()
      .custom((value) => {
        const ids = Array.isArray(value) ? value : [value];
        return isValidObjectIdArray(ids);
      })
      .withMessage('Industries must be valid ObjectId array'),

    query('languages')
      .optional()
      .custom((value) => {
        const ids = Array.isArray(value) ? value : [value];
        return isValidObjectIdArray(ids);
      })
      .withMessage('Languages must be valid ObjectId array'),

    query('integrations')
      .optional()
      .custom((value) => {
        const ids = Array.isArray(value) ? value : [value];
        return isValidObjectIdArray(ids);
      })
      .withMessage('Integrations must be valid ObjectId array'),

    query('marketSegment')
      .optional()
      .custom((value) => {
        const ids = Array.isArray(value) ? value : [value];
        return isValidObjectIdArray(ids);
      })
      .withMessage('Market segment must be valid ObjectId array'),

    query('whoCanUse')
      .optional()
      .custom((value) => {
        const ids = Array.isArray(value) ? value : [value];
        return isValidObjectIdArray(ids);
      })
      .withMessage('Who can use must be valid ObjectId array'),

    query('minRating')
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage('Minimum rating must be between 0 and 5'),

    query('maxRating')
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage('Maximum rating must be between 0 and 5')
  ]
};

module.exports = productValidator; 