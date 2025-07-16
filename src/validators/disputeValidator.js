const { body, param, query } = require('express-validator');

const createDisputeValidator = [
  body('reviewId')
    .notEmpty()
    .withMessage('Review ID is required')
    .isMongoId()
    .withMessage('Invalid review ID'),

  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isIn([
      'false-or-misleading-information',
      'spam-or-fake-review',
      'inappropriate-content',
      'conflict-of-interest',
      'other'
    ])
    .withMessage('Invalid reason'),

  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
    .trim()
];

const updateDisputeValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid dispute ID'),

  body('reason')
    .optional()
    .isIn([
      'false-or-misleading-information',
      'spam-or-fake-review',
      'inappropriate-content',
      'conflict-of-interest',
      'other'
    ])
    .withMessage('Invalid reason'),

  body('description')
    .optional()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
    .trim(),

  body('status')
    .optional()
    .isIn(['active', 'resolved'])
    .withMessage('Status must be either active or resolved')
];

const getDisputesValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),

  query('status')
    .optional()
    .isIn(['active', 'resolved'])
    .withMessage('Status must be either active or resolved'),

  query('productSlug')
    .optional()
    .isString()
    .withMessage('Invalid product slug'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'status'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

const idValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid dispute ID')
];

const addExplanationValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid dispute ID'),

  body('explanation')
    .notEmpty()
    .withMessage('Explanation is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Explanation must be between 1 and 2000 characters')
    .trim()
];

const updateExplanationValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid dispute ID'),

  param('explanationId')
    .isMongoId()
    .withMessage('Invalid explanation ID'),

  body('explanation')
    .notEmpty()
    .withMessage('Explanation is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Explanation must be between 1 and 2000 characters')
    .trim()
];

module.exports = {
  createDisputeValidator,
  updateDisputeValidator,
  getDisputesValidator,
  idValidator,
  addExplanationValidator,
  updateExplanationValidator
}; 