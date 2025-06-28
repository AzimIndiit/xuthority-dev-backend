const { body, param } = require('express-validator');

exports.updateProfileValidator = [
  body('firstName').optional().isString().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().isString().trim().isLength({ min: 1, max: 50 }),
  body('region').optional().isString().trim().isLength({ max: 100 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('industry').optional().isString().isLength({ max: 100 }),
  body('title').optional().isString().isLength({ max: 100 }),
  body('companyName').optional().isString().isLength({ max: 100 }),
  body('companySize').optional().isString().isIn([
    '1-10 Employees', '11-50 Employees', '51-100 Employees', '100-200 Employees',
    '201-500 Employees', '500+ Employees'
  ]),
  body('companyEmail').optional().isEmail().normalizeEmail(),
  // Vendor-specific field validations
  body('companyAvatar').optional().custom((value) => {
    if (!value || value === '') return true; // Allow empty string or undefined
    if (typeof value === 'string' && value.length > 0) {
      // Only validate URL if it's not empty
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(value)) {
        throw new Error('Company avatar must be a valid URL');
      }
      if (value.length > 500) {
        throw new Error('Company avatar URL is too long');
      }
    }
    return true;
  }),
  body('yearFounded').optional().isString().isLength({ min: 4, max: 4 }).matches(/^\d{4}$/),
  body('hqLocation').optional().isString().trim().isLength({ max: 200 }),
  body('companyDescription').optional().isString().isLength({ max: 2000 }),
  body('companyWebsiteUrl').optional().custom((value) => {
    if (!value || value === '') return true; // Allow empty string or undefined
    if (typeof value === 'string' && value.length > 0) {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(value)) {
        throw new Error('Company website must be a valid URL');
      }
      if (value.length > 200) {
        throw new Error('Company website URL is too long');
      }
    }
    return true;
  }),
  body('socialLinks').optional().isObject(),
  body('socialLinks.linkedin').optional().custom((value) => {
    if (!value || value === '') return true; // Allow empty string or undefined
    if (typeof value === 'string' && value.length > 0) {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(value)) {
        throw new Error('LinkedIn URL must be a valid URL');
      }
      if (value.length > 200) {
        throw new Error('LinkedIn URL is too long');
      }
    }
    return true;
  }),
  body('socialLinks.twitter').optional().custom((value) => {
    if (!value || value === '') return true; // Allow empty string or undefined
    if (typeof value === 'string' && value.length > 0) {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(value)) {
        throw new Error('Twitter URL must be a valid URL');
      }
      if (value.length > 200) {
        throw new Error('Twitter URL is too long');
      }
    }
    return true;
  }),
  body('acceptedMarketing').optional().isBoolean(),
];

exports.userIdValidator = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID format. Must be a valid MongoDB ObjectId')
    .notEmpty()
    .withMessage('User ID is required')
];

exports.changePasswordValidator = [
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
