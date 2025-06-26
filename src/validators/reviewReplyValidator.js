const { body, param, query } = require('express-validator');
const { isValidObjectId } = require('mongoose');

const reviewReplyValidator = {
  // Create reply validation
  create: [
    param('reviewId')
      .notEmpty()
      .withMessage('Review ID is required')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid review ID');
        }
        return true;
      }),
    body('content')
      .notEmpty()
      .withMessage('Reply content is required')
      .isLength({ min: 3, max: 2000 })
      .withMessage('Reply content must be between 3 and 2000 characters')
      .trim(),

  ],

  // Update reply validation
  update: [
    param('id')
      .notEmpty()
      .withMessage('Reply ID is required')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid reply ID');
        }
        return true;
      }),
    body('content')
      .optional()
      .isLength({ min: 3, max: 2000 })
      .withMessage('Reply content must be between 3 and 2000 characters')
      .trim()
  ],

  // Get reply by ID validation
  getById: [
    param('id')
      .notEmpty()
      .withMessage('Reply ID is required')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid reply ID');
        }
        return true;
      })
  ],

  // Get replies for review validation
  getByReview: [
    param('reviewId')
      .notEmpty()
      .withMessage('Review ID is required')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid review ID');
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
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'updatedAt', 'helpfulVotes.count'])
      .withMessage('SortBy must be one of: createdAt, updatedAt, helpfulVotes.count'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('SortOrder must be either asc or desc'),
    query('status')
      .optional()
      .isIn(['pending', 'approved', 'rejected', 'flagged'])
      .withMessage('Status must be one of: pending, approved, rejected, flagged')
  ],

  // Delete reply validation
  delete: [
    param('id')
      .notEmpty()
      .withMessage('Reply ID is required')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid reply ID');
        }
        return true;
      })
  ],

  // Helpful vote validation
  helpfulVote: [
    param('id')
      .notEmpty()
      .withMessage('Reply ID is required')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid reply ID');
        }
        return true;
      })
  ],



  // List all replies validation (admin only)
  listAll: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['pending', 'approved', 'rejected', 'flagged'])
      .withMessage('Status must be one of: pending, approved, rejected, flagged'),
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'updatedAt', 'helpfulVotes.count'])
      .withMessage('SortBy must be one of: createdAt, updatedAt, helpfulVotes.count'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('SortOrder must be either asc or desc'),
    query('search')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Search term must be between 2 and 100 characters')
      .trim()
  ]
};

module.exports = reviewReplyValidator; 