const { body, validationResult } = require('express-validator');

// Registration validation and sanitization
const validateRegister = [
  body('firstName')
    .trim()
    .escape()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
  body('lastName')
    .trim()
    .escape()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
  body('email')
    .trim()
    .normalizeEmail({ gmail_remove_dots: false })
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address'),
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8, max: 100 }).withMessage('Password must be 8-100 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          statusCode: 400,
          details: errors.mapped(),
        },
      });
    }
    next();
  },
];

// Login validation and sanitization
const validateLogin = [
  body('email')
    .trim()
    .normalizeEmail({ gmail_remove_dots: false })
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address'),
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          statusCode: 400,
          details: errors.mapped(),
        },
      });
    }
    next();
  },
];

// Vendor registration validation and sanitization
const validateVendorRegister = [
  body('firstName')
    .trim()
    .escape()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
  body('lastName')
    .trim()
    .escape()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
  body('email')
    .trim()
    .normalizeEmail({ gmail_remove_dots: false })
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address'),
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8, max: 100 }).withMessage('Password must be 8-100 characters'),
  body('companyName')
    .trim()
    .escape()
    .notEmpty().withMessage('Company name is required'),
  body('companyEmail')
    .trim()
    .normalizeEmail({ gmail_remove_dots: false })
    .notEmpty().withMessage('Company email is required')
    .isEmail().withMessage('Invalid company email'),
  body('industry')
    .trim()
    .escape()
    .notEmpty().withMessage('Industry is required'),
  body('companySize')
    .trim()
    .escape()
    .notEmpty().withMessage('Company size is required'),
  body('acceptedTerms')
    .equals('true').withMessage('You must accept the terms and conditions'),
  body('acceptedMarketing')
    .optional()
    .isBoolean().withMessage('acceptedMarketing must be a boolean'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          statusCode: 400,
          details: errors.mapped(),
        },
      });
    }
    next();
  },
];

module.exports = {
  validateRegister,
  validateLogin,
  validateVendorRegister,
};
