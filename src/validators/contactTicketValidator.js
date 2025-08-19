const { body, param, query } = require('express-validator');

const create = [
  body('firstName').notEmpty().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').notEmpty().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('email').isEmail().withMessage('A valid email is required'),
  body('company').optional().isLength({ max: 100 }).withMessage('Company must be less than 100 characters'),
  body('subject').notEmpty().isLength({ min: 5, max: 120 }).withMessage('Subject must be between 5 and 120 characters'),
  body('reason').notEmpty().isIn(['sales', 'support', 'partnership', 'press', 'other']).withMessage('Invalid reason'),
  body('message').notEmpty().isLength({ min: 10, max: 1000 }).withMessage('Message must be between 10 and 1000 characters'),
  body('consent').optional().isBoolean(),
];

const updateStatus = [
  param('id').isMongoId().withMessage('Invalid ticket ID'),
  body('status').isIn(['open', 'pending', 'resolved', 'closed']).withMessage('Invalid status'),
];

const list = [
  query('status').optional().isIn(['open', 'pending', 'resolved', 'closed']),
  query('reason').optional().isIn(['sales', 'support', 'partnership', 'press', 'other']),
  query('search').optional().isString().isLength({ min: 1 }).trim(),
  query('ticketId').optional().isString().trim(),
  query('period').optional().isIn(['weekly', 'monthly', 'yearly']),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('sortBy').optional().isIn(['createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = { create, updateStatus, list };


