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

// Forgot password validation
const validateForgotPassword = [
  body('email')
    .trim()
    .normalizeEmail({ gmail_remove_dots: false })
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Valid email address is required'),
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

// Reset password validation
const validateResetPassword = [
  body('token')
    .trim()
    .notEmpty().withMessage('Reset token is required')
    .isLength({ min: 64, max: 64 }).withMessage('Invalid reset token format'),
  body('newPassword')
    .trim()
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8, max: 128 }).withMessage('New password must be between 8 and 128 characters'),
    // .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('confirmNewPassword')
    .trim()
    .notEmpty().withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
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

// Verify reset token validation
const validateVerifyResetToken = [
  body('token')
    .trim()
    .notEmpty().withMessage('Reset token is required')
    .isLength({ min: 64, max: 64 }).withMessage('Invalid reset token format'),
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
  validateForgotPassword,
  validateResetPassword,
  validateVerifyResetToken,
};
