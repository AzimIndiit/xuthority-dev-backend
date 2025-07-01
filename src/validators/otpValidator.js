const { body } = require('express-validator');
const { validationResult } = require('express-validator');

const otpValidator = {
  // Create OTP validation
  create: [
    body('email')
      .trim()
      .normalizeEmail({ gmail_remove_dots: false })
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Valid email address is required'),
    body('type')
      .trim()
      .notEmpty().withMessage('OTP type is required')
      .isIn(['review_verification', 'password_reset', 'email_verification']).withMessage('Invalid OTP type'),
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
  ],

  // Verify OTP validation
  verify: [
    body('email')
      .trim()
      .normalizeEmail({ gmail_remove_dots: false })
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Valid email address is required'),
    body('otp')
      .trim()
      .notEmpty().withMessage('OTP is required')
      .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
      .isNumeric().withMessage('OTP must contain only numbers'),
    body('type')
      .trim()
      .notEmpty().withMessage('OTP type is required')
      .isIn(['review_verification', 'password_reset', 'email_verification']).withMessage('Invalid OTP type'),
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
  ],

  // Resend OTP validation
  resend: [
    body('email')
      .trim()
      .normalizeEmail({ gmail_remove_dots: false })
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Valid email address is required'),
    body('type')
      .trim()
      .notEmpty().withMessage('OTP type is required')
      .isIn(['review_verification', 'password_reset', 'email_verification']).withMessage('Invalid OTP type'),
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
  ],
};

module.exports = otpValidator; 