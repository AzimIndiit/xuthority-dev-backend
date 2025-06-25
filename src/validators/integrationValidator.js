const { body, param, query } = require('express-validator');

const createIntegrationValidation = [
  body('name')
    .notEmpty()
    .withMessage('Integration name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Integration name must be between 2 and 100 characters')
    .trim()
    .escape(),
  body('image')
    .optional()
    .isURL()
    .withMessage('Image must be a valid URL'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

const updateIntegrationValidation = [
  param('id').isMongoId().withMessage('Invalid integration ID'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Integration name must be between 2 and 100 characters')
    .trim()
    .escape(),
  body('image')
    .optional()
    .isURL()
    .withMessage('Image must be a valid URL'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

const getIntegrationByIdValidation = [
  param('id').isMongoId().withMessage('Invalid integration ID')
];

const getIntegrationBySlugValidation = [
  param('slug').notEmpty().withMessage('Integration slug is required')
];

const deleteIntegrationValidation = [
  param('id').isMongoId().withMessage('Invalid integration ID')
];

const toggleIntegrationStatusValidation = [
  param('id').isMongoId().withMessage('Invalid integration ID')
];

const getAllIntegrationsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isLength({ max: 100 }).withMessage('Search term cannot exceed 100 characters').trim().escape(),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Status must be either active or inactive'),
  query('sortBy').optional().isIn(['name', 'status', 'createdAt', 'updatedAt']).withMessage('SortBy must be one of: name, status, createdAt, updatedAt'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('SortOrder must be either asc or desc')
];

const getActiveIntegrationsValidation = getAllIntegrationsValidation;

module.exports = {
  createIntegrationValidation,
  updateIntegrationValidation,
  getIntegrationByIdValidation,
  getIntegrationBySlugValidation,
  deleteIntegrationValidation,
  toggleIntegrationStatusValidation,
  getAllIntegrationsValidation,
  getActiveIntegrationsValidation
};
