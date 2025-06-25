const { body, param, query } = require('express-validator');

// Validation for creating solution
const validateCreateSolution = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Solution name is required')
    .bail() // Stop validation chain if the previous validation failed
    .isLength({ min: 2, max: 100 })
    .withMessage('Solution name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-&().,]+$/)
    .withMessage('Solution name contains invalid characters'),

  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

// Validation for updating solution
const validateUpdateSolution = [
  param('id')
    .isMongoId()
    .withMessage('Invalid solution ID'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Solution name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Solution name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-&().,]+$/)
    .withMessage('Solution name contains invalid characters'),

  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

// Validation for getting solution by ID
const validateGetSolutionById = [
  param('id')
    .isMongoId()
    .withMessage('Invalid solution ID')
];

// Validation for getting solution by slug
const validateGetSolutionBySlug = [
  param('slug')
    .trim()
    .notEmpty()
    .withMessage('Solution slug is required')
    .isLength({ min: 1, max: 150 })
    .withMessage('Solution slug must be between 1 and 150 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Solution slug can only contain lowercase letters, numbers, and hyphens')
];

// Validation for solution listing with search and pagination
const validateGetSolutionList = [
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

// Validation for deleting solution
const validateDeleteSolution = [
  param('id')
    .isMongoId()
    .withMessage('Invalid solution ID')
];

// Validation for toggling solution status
const validateToggleSolutionStatus = [
  param('id')
    .isMongoId()
    .withMessage('Invalid solution ID')
];

module.exports = {
  validateCreateSolution,
  validateUpdateSolution,
  validateGetSolutionById,
  validateGetSolutionBySlug,
  validateGetSolutionList,
  validateDeleteSolution,
  validateToggleSolutionStatus
}; 