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

    body('contactEmail')
      .notEmpty()
      .withMessage('Contact email is required')
      .isEmail()
      .withMessage('Contact email must be a valid email address')
      .normalizeEmail()
      .isLength({ max: 100 })
      .withMessage('Contact email must be less than 100 characters'),

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
      .isIn(['pending', 'approved', 'rejected', 'draft', 'published', 'archived', 'update_pending', 'update_rejected'])
      .withMessage('Invalid status'),

    body('isActive')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Invalid active status'),

    body('isFeatured')
      .optional()
      .isBoolean()
      .withMessage('Featured status must be boolean'),

    body('isFree')
      .optional()
      .isBoolean()
      .withMessage('Free availability must be boolean')
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

    body('contactEmail')
      .notEmpty()
      .withMessage('Contact email is required')
      .isEmail()
      .withMessage('Contact email must be a valid email address')
      .normalizeEmail()
      .isLength({ max: 100 })
      .withMessage('Contact email must be less than 100 characters'),

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
      .isIn(['pending', 'approved', 'rejected', 'draft', 'published', 'archived', 'update_pending', 'update_rejected'])
      .withMessage('Invalid status'),

    body('isActive')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Invalid active status'),

    body('isFeatured')
      .optional()
      .isBoolean()
      .withMessage('Featured status must be boolean'),

    body('isFree')
      .optional()
      .isBoolean()
      .withMessage('Free availability must be boolean')
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
      .custom((value) => {
        if (!value) return true;
        const allowed = ['pending', 'approved', 'rejected', 'draft', 'published', 'archived', 'update_pending', 'update_rejected'];
        // support comma-separated lists
        if (typeof value === 'string' && value.includes(',')) {
          const parts = value.split(',').map(s => s.trim());
          return parts.every((p) => allowed.includes(p));
        }
        return allowed.includes(value);
      })
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
      .isIn(['name', 'createdAt', 'avgRating', 'totalReviews', 'views', 'likes','pricing'])
      .withMessage('Invalid sort field'),

    query('order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Order must be asc or desc'),


    query('languages')
      .optional()
      .custom((value) => {
        const ids = Array.isArray(value) ? value : [value];
        return isValidObjectIdArray(ids);
      })
      .withMessage('Languages must be valid ObjectId array'),

      query('industries')
      .optional()
      .custom((value) => {
        if (Array.isArray(value)) return true;
        if (typeof value === 'string') return true;
        return false;
      })
      .withMessage('Industries must be a string or array'),
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
      .withMessage('Maximum rating must be between 0 and 5'),

    query('segment')
      .optional()
      .isString()
      .trim()
      .withMessage('Segment must be a string'),

    // Date filtering
    query('period')
      .optional()
      .isIn(['weekly', 'monthly', 'yearly'])
      .withMessage('Period must be one of weekly, monthly, yearly'),

    query('dateFrom')
      .optional()
      .isISO8601()
      .withMessage('dateFrom must be a valid ISO date'),

    query('dateTo')
      .optional()
      .isISO8601()
      .withMessage('dateTo must be a valid ISO date'),

    query('categories')
      .optional()
      .custom((value) => {
        if (Array.isArray(value)) return true;
        if (typeof value === 'string') return true;
        return false;
      })
      .withMessage('Categories must be a string or array'),

    query('minPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum price must be a positive number'),

    query('maxPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum price must be a positive number'),

    query('sortBy')
      .optional()
      .custom((value) => {
        if (!value) return true;
        
        const allowedSortFields = [
          'createdAt', 'updatedAt', 'name', 'views', 'likes', 'avgRating', 'totalReviews', 
          'ratings-desc', 'ratings-asc', 'pricing-desc', 'pricing-asc', 
          'reviewCounts-desc', 'reviewCounts-asc', 'pricing'
        ];
        
        // Handle comma-separated sort criteria
        if (value.includes(',')) {
          const sortCriteria = value.split(',').map(s => s.trim());
          return sortCriteria.every(criterion => allowedSortFields.includes(criterion));
        }
        
        // Handle single sort criterion
        return allowedSortFields.includes(value);
      })
      .withMessage('Invalid sort field. Allowed values: createdAt, updatedAt, name, views, likes, avgRating, totalReviews, ratings-desc, ratings-asc, pricing-desc, pricing-asc, reviewCounts-desc, reviewCounts-asc, pricing'),

    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc')
  ]
};

module.exports = productValidator; 