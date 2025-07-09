const { body, param, query } = require('express-validator');

// Community Question Validators
const createQuestionValidator = [
  body('title')
    .notEmpty()
    .withMessage('Question title is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Question title must be between 10 and 1000 characters')
    .trim(),

  body('product')
    .optional()
    .isMongoId()
    .withMessage('Invalid product ID'),

  body('productSlug')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Product slug must be between 1 and 100 characters')
    .trim()
];

const updateQuestionValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid question ID'),

  body('title')
    .optional()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Question title must be between 10 and 1000 characters')
    .trim()
];

// Community Answer Validators
const createAnswerValidator = [
  param('questionId')
    .isMongoId()
    .withMessage('Invalid question ID'),

  body('content')
    .notEmpty()
    .withMessage('Answer content is required')
    .isLength({ min: 10, max: 10000 })
    .withMessage('Answer content must be between 10 and 10000 characters')
    .trim()
];

const updateAnswerValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid answer ID'),

  body('content')
    .notEmpty()
    .withMessage('Answer content is required')
    .isLength({ min: 10, max: 10000 })
    .withMessage('Answer content must be between 10 and 10000 characters')
    .trim()
];

// Get Questions Validators
const getQuestionsValidator = [
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
    .isIn(['createdAt', 'totalAnswers'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Invalid status'),

  query('product')
    .optional()
    .isMongoId()
    .withMessage('Invalid product ID'),

  query('productSlug')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Product slug must be between 1 and 100 characters')
    .trim(),

  query('author')
    .optional()
    .isMongoId()
    .withMessage('Invalid author ID'),

  query('search')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters')
    .trim()
];

// Get Answers Validators
const getAnswersValidator = [
  param('questionId')
    .isMongoId()
    .withMessage('Invalid question ID'),

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
    .isIn(['createdAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Invalid status')
];

// ID Validator (for route params)
const idValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
];

// Search Validators
const searchValidator = [
  query('q')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters')
    .trim(),

  query('type')
    .optional()
    .isIn(['questions', 'answers', 'both'])
    .withMessage('Search type must be questions, answers, or both'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];



module.exports = {
  createQuestionValidator,
  updateQuestionValidator,
  createAnswerValidator,
  updateAnswerValidator,
  getQuestionsValidator,
  getAnswersValidator,
  searchValidator,
  idValidator
}; 