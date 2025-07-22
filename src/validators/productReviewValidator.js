const { body, param, query } = require('express-validator');
const { isValidObjectId } = require('mongoose');

const productReviewValidator = {
  // Create review validation
  create: [
    body('product')
      .notEmpty()
      .withMessage('Product ID is required')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid product ID');
        }
        return true;
      }),
    body('overallRating')
      .notEmpty()
      .withMessage('Overall rating is required')
      .isInt({ min: 1, max: 5 })
      .withMessage('Overall rating must be between 1 and 5'),
    body('title')
      .notEmpty()
      .withMessage('Review title is required')
      .isLength({ min: 3, max: 200 })
      .withMessage('Title must be between 3 and 200 characters')
      .trim(),
    body('content')
      .notEmpty()
      .withMessage('Review content is required')
      .isLength({ min: 10, max: 5000 })
      .withMessage('Content must be between 10 and 5000 characters')
      .trim(),
    body('subRatings')
      .optional()
      .isObject()
      .withMessage('Sub-ratings must be an object'),
    body('subRatings.easeOfUse')
      .optional()
      .isInt({ min: 0, max: 7 })
      .withMessage('Ease of use rating must be between 0 and 7'),
    body('subRatings.customerSupport')
      .optional()
      .isInt({ min: 0, max: 7 })
      .withMessage('Customer support rating must be between 0 and 7'),
    body('subRatings.features')
      .optional()
      .isInt({ min: 0, max: 7 })
      .withMessage('Features rating must be between 0 and 7'),
    body('subRatings.pricing')
      .optional()
      .isInt({ min: 0, max: 7 })
      .withMessage('Pricing rating must be between 0 and 7'),
    body('subRatings.technicalSupport')
      .optional()
      .isInt({ min: 0, max: 7 })
      .withMessage('Technical support rating must be between 0 and 7'),
    body('reviewSource')
      .optional()
      .isString()
      .withMessage('Review source must be a string')
      .trim(),
    // Metadata validation
    body('metaData')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),
    body('metaData.attachments')
      .optional()
      .isArray()
      .withMessage('Attachments must be an array'),
    body('metaData.attachments.*.fileName')
      .optional()
      .isString()
      .isLength({ max: 255 })
      .withMessage('File name must be a string with max 255 characters')
      .trim(),
    body('metaData.attachments.*.fileUrl')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('File URL must be a string with max 500 characters')
      .trim(),
    body('metaData.attachments.*.fileType')
      .optional()
      .isString()
      .isLength({ max: 50 })
      .withMessage('File type must be a string with max 50 characters')
      .trim(),
    body('metaData.attachments.*.fileSize')
      .optional()
      .isInt({ min: 0 })
      .withMessage('File size must be a positive integer'),
    body('metaData.reviewVersion')
      .optional()
      .isString()
      .withMessage('Review version must be a string')
      .trim(),
    body('metaData.sourceInfo')
      .optional(),
    body('metaData.customFields')
      .optional()
  ],

  // Update review validation
  update: [
    param('id')
      .notEmpty()
      .withMessage('Review ID is required')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid review ID');
        }
        return true;
      }),
    body('overallRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Overall rating must be between 1 and 5'),
    body('title')
      .optional()
      .isLength({ min: 3, max: 200 })
      .withMessage('Title must be between 3 and 200 characters')
      .trim(),
    body('content')
      .optional()
      .isLength({ min: 10, max: 5000 })
      .withMessage('Content must be between 10 and 5000 characters')
      .trim(),
    body('subRatings')
      .optional()
      .isObject()
      .withMessage('Sub-ratings must be an object'),
    body('subRatings.easeOfUse')
      .optional()
      .isInt({ min: 0, max: 7 })
      .withMessage('Ease of use rating must be between 0 and 7'),
    body('subRatings.customerSupport')
      .optional()
      .isInt({ min: 0, max: 7 })
      .withMessage('Customer support rating must be between 0 and 7'),
    body('subRatings.features')
      .optional()
      .isInt({ min: 0, max: 7 })
      .withMessage('Features rating must be between 0 and 7'),
    body('subRatings.pricing')
      .optional()
      .isInt({ min: 0, max: 7 })
      .withMessage('Pricing rating must be between 0 and 7'),
    body('subRatings.technicalSupport')
      .optional()
      .isInt({ min: 0, max: 7 })
      .withMessage('Technical support rating must be between 0 and 7'),
    body('reviewSource')
      .optional()
      .isString()
      .withMessage('Review source must be a string')
      .trim(),
    // Metadata validation
    body('metaData')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),
    body('metaData.attachments')
      .optional()
      .isArray()
      .withMessage('Attachments must be an array'),
    body('metaData.attachments.*.fileName')
      .optional()
      .isString()
      .isLength({ max: 255 })
      .withMessage('File name must be a string with max 255 characters')
      .trim(),
    body('metaData.attachments.*.fileUrl')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('File URL must be a string with max 500 characters')
      .trim(),
    body('metaData.attachments.*.fileType')
      .optional()
      .isString()
      .isLength({ max: 50 })
      .withMessage('File type must be a string with max 50 characters')
      .trim(),
    body('metaData.attachments.*.fileSize')
      .optional()
      .isInt({ min: 0 })
      .withMessage('File size must be a positive integer'),
    body('metaData.reviewVersion')
      .optional()
      .isString()
      .withMessage('Review version must be a string')
      .trim(),
    body('metaData.sourceInfo')
      .optional(),
    body('metaData.customFields')
      .optional()
  ],

  // Get by ID validation
  getById: [
    param('id')
      .notEmpty()
      .withMessage('Review ID is required')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid review ID');
        }
        return true;
      })
  ],

  // Get by product validation
  getByProduct: [
    param('productId')
      .notEmpty()
      .withMessage('Product ID is required')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid product ID');
        }
        return true;
      })
  ],

  // Delete validation
  delete: [
    param('id')
      .notEmpty()
      .withMessage('Review ID is required')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid review ID');
        }
        return true;
      })
  ],

  // Helpful vote validation
  helpfulVote: [
    param('id')
      .notEmpty()
      .withMessage('Review ID is required')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid review ID');
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
      .isIn(['pending', 'approved', 'rejected', 'flagged'])
      .withMessage('Status must be one of: pending, approved, rejected, flagged'),
    query('overallRating')
      .optional()
      .custom((value) => {
        if (Array.isArray(value)) {
          // Handle multiple ratings like ?overallRating=4&overallRating=5
          return value.every(rating => [1, 2, 3, 4, 5].includes(parseInt(rating)));
        }
        return [1, 2, 3, 4, 5].includes(parseInt(value));
      })
      .withMessage('Overall rating must be between 1 and 5'),
    query('isVerified')
      .optional()
      .isBoolean()
      .withMessage('IsVerified must be a boolean'),
    query('sortBy')
      .optional()
      .isIn(['submittedAt', 'publishedAt', 'overallRating', 'helpfulVotes.count'])
      .withMessage('SortBy must be one of: submittedAt, publishedAt, overallRating, helpfulVotes.count'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('SortOrder must be either asc or desc'),
    query('minRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Min rating must be between 1 and 5'),
    query('maxRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Max rating must be between 1 and 5'),
    query('mention')
      .optional()
      .custom((value) => {
        if (Array.isArray(value)) {
          return value.every(m => typeof m === 'string' && m.length >= 2);
        }
        return typeof value === 'string' && value.length >= 2;
      })
      .withMessage('Each mention must be at least 2 characters'),
    query('keywords')
      .optional()
      .custom((value) => {
        if (Array.isArray(value)) {
          return value.every(k => typeof k === 'string' && k.length >= 2);
        }
        return typeof value === 'string' && value.length >= 2;
      })
      .withMessage('Each keyword must be at least 2 characters')
  ],

  // Product-specific review list validation
  listByProduct: [
    param('productId')
      .notEmpty()
      .withMessage('Product ID is required')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid product ID');
        }
        return true;
      }),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('overallRating')
      .optional()
      .custom((value) => {
        if (Array.isArray(value)) {
          return value.every(rating => [1, 2, 3, 4, 5].includes(parseInt(rating)));
        }
        return [1, 2, 3, 4, 5].includes(parseInt(value));
      })
      .withMessage('Overall rating must be between 1 and 5'),
    query('isVerified')
      .optional()
      .isBoolean()
      .withMessage('IsVerified must be a boolean'),
    query('sortBy')
      .optional()
      .isIn(['submittedAt', 'publishedAt', 'overallRating', 'helpfulVotes.count'])
      .withMessage('SortBy must be one of: submittedAt, publishedAt, overallRating, helpfulVotes.count'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('SortOrder must be either asc or desc'),
    query('mention')
      .optional()
      .custom((value) => {
        if (Array.isArray(value)) {
          return value.every(m => typeof m === 'string' && m.length >= 2);
        }
        return typeof value === 'string' && value.length >= 2;
      })
      .withMessage('Each mention must be at least 2 characters'),
    query('keywords')
      .optional()
      .custom((value) => {
        if (Array.isArray(value)) {
          return value.every(k => typeof k === 'string' && k.length >= 2);
        }
        return typeof value === 'string' && value.length >= 2;
      })
      .withMessage('Each keyword must be at least 2 characters')
  ],

  // Moderation actions (admin only)
  moderateReview: [
    param('id')
      .notEmpty()
      .withMessage('Review ID is required')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid review ID');
        }
        return true;
      }),
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['pending', 'approved', 'rejected', 'flagged'])
      .withMessage('Status must be one of: pending, approved, rejected, flagged'),
    body('moderationNote')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Moderation note cannot exceed 500 characters')
      .trim()
  ]
};

module.exports = productReviewValidator; 