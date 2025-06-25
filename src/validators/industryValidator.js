const { body, param, query } = require('express-validator');

const createIndustryValidation = [
  body('name')
    .notEmpty()
    .withMessage('Industry name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Industry name must be between 2 and 100 characters')
    .trim()
    .escape(),
  body('category')
    .notEmpty()
    .withMessage('Industry category is required')
    .isIn(['software', 'solution'])
    .withMessage('Category must be either software or solution'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

const updateIndustryValidation = [
  param('id').isMongoId().withMessage('Invalid industry ID'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Industry name must be between 2 and 100 characters')
    .trim()
    .escape(),
  body('category')
    .optional()
    .isIn(['software', 'solution'])
    .withMessage('Category must be either software or solution'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

const getIndustryByIdValidation = [
  param('id').isMongoId().withMessage('Invalid industry ID')
];

const getIndustryBySlugValidation = [
  param('slug').notEmpty().withMessage('Industry slug is required')
];

const deleteIndustryValidation = [
  param('id').isMongoId().withMessage('Invalid industry ID')
];

const toggleIndustryStatusValidation = [
  param('id').isMongoId().withMessage('Invalid industry ID')
];

const getAllIndustriesValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isLength({ max: 100 }).withMessage('Search term cannot exceed 100 characters').trim().escape(),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Status must be either active or inactive'),
  query('category').optional().isIn(['software', 'solution']).withMessage('Category must be either software or solution'),
  query('sortBy').optional().isIn(['name', 'status', 'category', 'createdAt', 'updatedAt']).withMessage('SortBy must be one of: name, status, category, createdAt, updatedAt'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('SortOrder must be either asc or desc')
];

const getActiveIndustriesValidation = getAllIndustriesValidation;

const getIndustriesByCategoryValidation = [
  param('category').isIn(['software', 'solution']).withMessage('Category must be either software or solution'),
  ...getAllIndustriesValidation
];

module.exports = {
  createIndustryValidation,
  updateIndustryValidation,
  getIndustryByIdValidation,
  getIndustryBySlugValidation,
  deleteIndustryValidation,
  toggleIndustryStatusValidation,
  getAllIndustriesValidation,
  getActiveIndustriesValidation,
  getIndustriesByCategoryValidation
};
