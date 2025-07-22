const { body, query, param } = require('express-validator');

/**
 * Validation for admin login
 */
const validateAdminLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),
    
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
];

/**
 * Validation for admin user queries
 */
const validateUserQuery = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a positive integer between 1 and 1000'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be a positive integer between 1 and 100'),
    
  query('role')
    .optional()
    .isIn(['user', 'vendor'])
    .withMessage('Role must be either user or vendor'),
    
  query('isVerified')
    .optional()
    .isBoolean()
    .withMessage('isVerified must be a boolean value'),
    
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
    .escape(),
    
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'firstName', 'lastName', 'email', 'role'])
    .withMessage('sortBy must be one of: createdAt, firstName, lastName, email, role'),
    
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be either asc or desc'),
    
  query('period')
    .optional()
    .isIn(['weekly', 'monthly', 'yearly'])
    .withMessage('Period must be weekly, monthly, or yearly'),
    
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('dateFrom must be a valid ISO 8601 date'),
    
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('dateTo must be a valid ISO 8601 date')
];

/**
 * Validation for verify vendor profile
 */
const validateVerifyVendor = [
  param('id')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId')
];

/**
 * Validation for approve vendor profile
 */
const validateApproveVendor = [
  param('id')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId')
];

/**
 * Validation for reject vendor profile
 */
const validateRejectVendor = [
  param('id')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Rejection reason must be between 1 and 500 characters')
    .escape()
];

/**
 * Validation for block vendor profile
 */
const validateBlockVendor = [
  param('id')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId')
];

/**
 * Validation for unblock vendor profile
 */
const validateUnblockVendor = [
  param('id')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId')
];

/**
 * Validation for delete vendor profile
 */
const validateDeleteVendor = [
  param('id')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId')
];

/**
 * Validation for admin profile update
 */
const validateAdminProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
    
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
    
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

/**
 * Validation for admin password change
 */
const validateAdminPasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required')
    .isLength({ min: 1 })
    .withMessage('Current password cannot be empty'),
  
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('confirmNewPassword')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

/**
 * Validation for admin forgot password
 */
const validateAdminForgotPassword = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters')
];

/**
 * Validation for admin reset password
 */
const validateAdminResetPassword = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid reset token format'),
    
  body('newPassword')
    .trim()
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
  body('confirmNewPassword')
    .trim()
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

/**
 * Validation for admin verify reset token
 */
const validateAdminVerifyResetToken = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid reset token format')
];

module.exports = {
  validateAdminLogin,
  validateUserQuery,
  validateVerifyVendor,
  validateApproveVendor,
  validateRejectVendor,
  validateBlockVendor,
  validateUnblockVendor,
  validateDeleteVendor,
  validateAdminProfileUpdate,
  validateAdminPasswordChange,
  validateAdminForgotPassword,
  validateAdminResetPassword,
  validateAdminVerifyResetToken
}; 