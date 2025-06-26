const { body, param, query } = require('express-validator');
const { isValidObjectId } = require('mongoose');

const blogValidator = {
  // Create blog validation
  create: [
    body('resourceCategoryId')
      .notEmpty()
      .withMessage('Resource category is required')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid resource category ID');
        }
        return true;
      }),
    body('authorName')
      .notEmpty()
      .withMessage('Author name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Author name must be between 2 and 100 characters')
      .trim(),
    body('designation')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Designation cannot exceed 100 characters')
      .trim(),
    body('title')
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ min: 3, max: 200 })
      .withMessage('Title must be between 3 and 200 characters')
      .trim(),
    body('mediaUrl')
      .optional()
      .isURL()
      .withMessage('Media URL must be a valid URL'),
    body('description')
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 10 })
      .withMessage('Description must be at least 10 characters long')
      .trim(),
    body('watchUrl')
      .optional()
      .isURL()
      .withMessage('Watch URL must be a valid URL'),
    body('tag')
      .notEmpty()
      .withMessage('Tag is required')
      .isIn(['On Demand', 'Upcoming', 'EBook', 'Marketing', 'Sales'])
      .withMessage('Tag must be one of: On Demand, Upcoming, EBook, Marketing, Sales'),
      
      
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be either active or inactive')
  ],

  // Update blog validation
  update: [
    param('id')
      .notEmpty()
      .withMessage('Blog ID is required')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid blog ID');
        }
        return true;
      }),
    body('resourceCategoryId')
      .optional()
      .custom((value) => {
        if (value && !isValidObjectId(value)) {
          throw new Error('Invalid resource category ID');
        }
        return true;
      }),
    body('authorName')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Author name must be between 2 and 100 characters')
      .trim(),
    body('designation')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Designation cannot exceed 100 characters')
      .trim(),
    body('title')
      .optional()
      .isLength({ min: 3, max: 200 })
      .withMessage('Title must be between 3 and 200 characters')
      .trim(),
    body('mediaUrl')
      .optional()
      .isURL()
      .withMessage('Media URL must be a valid URL'),
    body('description')
      .optional()
      .isLength({ min: 10 })
      .withMessage('Description must be at least 10 characters long')
      .trim(),
    body('watchUrl')
      .optional()
      .isURL()
      .withMessage('Watch URL must be a valid URL'),
    body('tag')
      .optional()
      .isIn(['On Demand', 'Upcoming', 'EBook', 'Marketing', 'Sales'])
      .withMessage('Tag must be one of: On Demand, Upcoming, EBook, Marketing, Sales'),
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be either active or inactive')
  ],

  // Get by ID validation
  getById: [
    param('id')
      .notEmpty()
      .withMessage('Blog ID is required')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid blog ID');
        }
        return true;
      })
  ],

  // Get by slug validation
  getBySlug: [
    param('slug')
      .notEmpty()
      .withMessage('Blog slug is required')
      .isLength({ min: 2 })
      .withMessage('Slug must be at least 2 characters long')
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Slug must contain only lowercase letters, numbers, and hyphens')
  ],

  // Get by category validation
  getByCategory: [
    param('categoryId')
      .notEmpty()
      .withMessage('Category ID is required')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid category ID');
        }
        return true;
      })
  ],

  // Get by tag validation
  getByTag: [
    param('tag')
      .notEmpty()
      .withMessage('Tag is required')
      .isIn(['On Demand', 'Upcoming', 'EBook', 'Marketing', 'Sales'])
      .withMessage('Tag must be one of: On Demand, Upcoming, EBook, Marketing, Sales')
  ],

  // Delete validation
  delete: [
    param('id')
      .notEmpty()
      .withMessage('Blog ID is required')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid blog ID');
        }
        return true;
      })
  ],

  // Toggle status validation
  toggleStatus: [
    param('id')
      .notEmpty()
      .withMessage('Blog ID is required')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid blog ID');
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
      .isIn(['active', 'inactive'])
      .withMessage('Status must be either active or inactive'),
    query('tag')
      .optional()
      .isIn(['On Demand', 'Upcoming', 'EBook', 'Marketing', 'Sales'])
      .withMessage('Tag must be one of: On Demand, Upcoming, EBook, Marketing, Sales'),
    query('postCategoryId')
      .optional()
      .custom((value) => {
        if (value && !isValidObjectId(value)) {
          throw new Error('Invalid post category ID');
        }
        return true;
      }),
    query('authorName')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Author name must be between 1 and 100 characters')
      .trim(),
    query('sortBy')
      .optional()
      .isIn(['title', 'authorName', 'tag', 'status', 'createdAt', 'updatedAt'])
      .withMessage('Sort by must be one of: title, authorName, tag, status, createdAt, updatedAt'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be either asc or desc')
  ]
};

module.exports = blogValidator; 