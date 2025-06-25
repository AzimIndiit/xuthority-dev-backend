const { body, param, query } = require('express-validator');

// Product creation validation
const createProductValidator = [
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Product name must be between 3 and 100 characters')
    .trim(),

  body('description')
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
    .trim(),

  body('website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL'),

  body('software')
    .notEmpty()
    .withMessage('Software category is required')
    .isIn([
      'SaaS',
      'Desktop Application',
      'Mobile App',
      'Web Application',
      'API/Service',
      'Plugin/Extension',
      'Other'
    ])
    .withMessage('Invalid software category'),

  body('solutions')
    .optional()
    .isArray()
    .withMessage('Solutions must be an array'),

  body('solutions.*')
    .optional()
    .isIn([
      'Analytics',
      'CRM',
      'E-commerce',
      'Marketing',
      'Sales',
      'HR',
      'Finance',
      'Project Management',
      'Communication',
      'Security',
      'DevOps',
      'Other'
    ])
    .withMessage('Invalid solution category'),

  body('whoCanUse')
    .optional()
    .isArray()
    .withMessage('Who can use must be an array'),

  body('whoCanUse.*')
    .optional()
    .isIn([
      'Small Business',
      'Medium Business',
      'Enterprise',
      'Startups',
      'Freelancers',
      'Developers',
      'Marketers',
      'Sales Teams',
      'Everyone'
    ])
    .withMessage('Invalid user category'),

  body('industries')
    .optional()
    .isArray()
    .withMessage('Industries must be an array'),

  body('industries.*')
    .optional()
    .isIn([
      'Technology',
      'Healthcare',
      'Finance',
      'Education',
      'Retail',
      'Manufacturing',
      'Real Estate',
      'Marketing',
      'Consulting',
      'Non-profit',
      'Government',
      'Other'
    ])
    .withMessage('Invalid industry'),

  body('integrations')
    .optional()
    .isArray()
    .withMessage('Integrations must be an array'),

  body('integrations.*')
    .optional()
    .isIn([
      'Slack',
      'Microsoft Teams',
      'Google Workspace',
      'Salesforce',
      'HubSpot',
      'Zapier',
      'API',
      'Webhooks',
      'Custom',
      'None'
    ])
    .withMessage('Invalid integration'),

  body('languages')
    .optional()
    .isArray()
    .withMessage('Languages must be an array'),

  body('languages.*')
    .optional()
    .isIn([
      'English',
      'Spanish',
      'French',
      'German',
      'Italian',
      'Portuguese',
      'Chinese',
      'Japanese',
      'Korean',
      'Russian',
      'Arabic',
      'Hindi',
      'Multi-language'
    ])
    .withMessage('Invalid language'),

  body('marketSegment')
    .optional()
    .isArray()
    .withMessage('Market segment must be an array'),

  body('marketSegment.*')
    .optional()
    .isIn([
      'SMB',
      'Mid-Market',
      'Enterprise',
      'Startup',
      'Government',
      'Education',
      'Non-profit',
      'Global'
    ])
    .withMessage('Invalid market segment'),

  body('brandColors.primary')
    .optional()
    .matches(/^#([0-9A-F]{3}){1,2}$/i)
    .withMessage('Primary color must be a valid hex color'),

  body('brandColors.secondary')
    .optional()
    .matches(/^#([0-9A-F]{3}){1,2}$/i)
    .withMessage('Secondary color must be a valid hex color'),

  body('shortDescription')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Short description must not exceed 200 characters')
    .trim(),

  body('metaTitle')
    .optional()
    .isLength({ max: 60 })
    .withMessage('Meta title must not exceed 60 characters')
    .trim(),

  body('metaDescription')
    .optional()
    .isLength({ max: 160 })
    .withMessage('Meta description must not exceed 160 characters')
    .trim(),

  body('keywords')
    .optional()
    .isArray()
    .withMessage('Keywords must be an array'),

  body('keywords.*')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Each keyword must not exceed 50 characters')
    .trim(),

  // Features validation
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),

  body('features.*.title')
    .optional()
    .notEmpty()
    .withMessage('Feature title is required')
    .isLength({ max: 100 })
    .withMessage('Feature title must not exceed 100 characters')
    .trim(),

  body('features.*.description')
    .optional()
    .notEmpty()
    .withMessage('Feature description is required')
    .isLength({ max: 500 })
    .withMessage('Feature description must not exceed 500 characters')
    .trim(),

  // Pricing validation
  body('pricing')
    .optional()
    .isArray()
    .withMessage('Pricing must be an array'),

  body('pricing.*.name')
    .optional()
    .notEmpty()
    .withMessage('Pricing plan name is required')
    .isLength({ max: 50 })
    .withMessage('Pricing plan name must not exceed 50 characters')
    .trim(),

  body('pricing.*.price')
    .optional()
    .isNumeric()
    .withMessage('Price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('pricing.*.currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD'])
    .withMessage('Invalid currency'),

  body('pricing.*.billingPeriod')
    .optional()
    .isIn(['monthly', 'yearly', 'one-time', 'custom'])
    .withMessage('Invalid billing period'),

  body('pricing.*.seats')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Seats must be a positive integer'),

  body('pricing.*.description')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Pricing description must not exceed 300 characters')
    .trim(),

  body('pricing.*.features')
    .optional()
    .isArray()
    .withMessage('Pricing features must be an array'),

  body('pricing.*.features.*')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Each pricing feature must not exceed 100 characters')
    .trim(),

  body('pricing.*.isPopular')
    .optional()
    .isBoolean()
    .withMessage('isPopular must be a boolean'),

  // Status validation
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived', 'pending_review'])
    .withMessage('Invalid status')
];

// Product update validation (similar to create but all fields optional)
const updateProductValidator = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Product name cannot be empty')
    .isLength({ min: 3, max: 100 })
    .withMessage('Product name must be between 3 and 100 characters')
    .trim(),

  body('description')
    .optional()
    .notEmpty()
    .withMessage('Product description cannot be empty')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
    .trim(),

  body('website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL'),

  body('software')
    .optional()
    .isIn([
      'SaaS',
      'Desktop Application',
      'Mobile App',
      'Web Application',
      'API/Service',
      'Plugin/Extension',
      'Other'
    ])
    .withMessage('Invalid software category'),

  body('solutions')
    .optional()
    .isArray()
    .withMessage('Solutions must be an array'),

  body('solutions.*')
    .optional()
    .isIn([
      'Analytics',
      'CRM',
      'E-commerce',
      'Marketing',
      'Sales',
      'HR',
      'Finance',
      'Project Management',
      'Communication',
      'Security',
      'DevOps',
      'Other'
    ])
    .withMessage('Invalid solution category'),

  body('whoCanUse')
    .optional()
    .isArray()
    .withMessage('Who can use must be an array'),

  body('industries')
    .optional()
    .isArray()
    .withMessage('Industries must be an array'),

  body('integrations')
    .optional()
    .isArray()
    .withMessage('Integrations must be an array'),

  body('languages')
    .optional()
    .isArray()
    .withMessage('Languages must be an array'),

  body('marketSegment')
    .optional()
    .isArray()
    .withMessage('Market segment must be an array'),

  body('brandColors.primary')
    .optional()
    .matches(/^#([0-9A-F]{3}){1,2}$/i)
    .withMessage('Primary color must be a valid hex color'),

  body('brandColors.secondary')
    .optional()
    .matches(/^#([0-9A-F]{3}){1,2}$/i)
    .withMessage('Secondary color must be a valid hex color'),

  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived', 'pending_review'])
    .withMessage('Invalid status'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured must be a boolean'),

  // Features validation
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),

  body('features.*.title')
    .optional()
    .notEmpty()
    .withMessage('Feature title is required')
    .isLength({ max: 100 })
    .withMessage('Feature title must not exceed 100 characters')
    .trim(),

  body('features.*.description')
    .optional()
    .notEmpty()
    .withMessage('Feature description is required')
    .isLength({ max: 500 })
    .withMessage('Feature description must not exceed 500 characters')
    .trim(),

  // Pricing validation
  body('pricing')
    .optional()
    .isArray()
    .withMessage('Pricing must be an array'),

  body('pricing.*.name')
    .optional()
    .notEmpty()
    .withMessage('Pricing plan name is required')
    .isLength({ max: 50 })
    .withMessage('Pricing plan name must not exceed 50 characters')
    .trim(),

  body('pricing.*.price')
    .optional()
    .isNumeric()
    .withMessage('Price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('pricing.*.seats')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Seats must be a positive integer')
];

// Product ID param validation
const productIdValidator = [
  param('productId')
    .isMongoId()
    .withMessage('Invalid product ID format')
];

// Product slug param validation  
const productSlugValidator = [
  param('slug')
    .notEmpty()
    .withMessage('Product slug is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Slug must be between 1 and 100 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens')
];

// Query validation for product listing
const productQueryValidator = [
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

  query('status')
    .optional()
    .isIn(['draft', 'published', 'archived', 'pending_review'])
    .withMessage('Invalid status'),

  query('software')
    .optional()
    .isIn([
      'SaaS',
      'Desktop Application',
      'Mobile App',
      'Web Application',
      'API/Service',
      'Plugin/Extension',
      'Other'
    ])
    .withMessage('Invalid software category'),

  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
    .toBoolean(),

  query('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured must be a boolean')
    .toBoolean(),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'name', 'views', 'likes'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .trim(),

  query('industries')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        return true; // Single industry
      }
      if (Array.isArray(value)) {
        return value.every(industry => typeof industry === 'string');
      }
      throw new Error('Industries must be a string or array of strings');
    }),

  query('marketSegment')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        return true; // Single segment
      }
      if (Array.isArray(value)) {
        return value.every(segment => typeof segment === 'string');
      }
      throw new Error('Market segment must be a string or array of strings');
    }),

  query('solutions')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        return true; // Single solution
      }
      if (Array.isArray(value)) {
        return value.every(solution => typeof solution === 'string');
      }
      throw new Error('Solutions must be a string or array of strings');
    })
];

// Media upload validation
const mediaUploadValidator = [
  body('type')
    .notEmpty()
    .withMessage('Media type is required')
    .isIn(['logo', 'screenshot', 'video', 'demo', 'other'])
    .withMessage('Invalid media type'),

  body('alt')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Alt text must not exceed 200 characters')
    .trim()
];

module.exports = {
  createProductValidator,
  updateProductValidator,
  productIdValidator,
  productSlugValidator,
  productQueryValidator,
  mediaUploadValidator
}; 