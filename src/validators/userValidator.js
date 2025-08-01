const { body, param } = require('express-validator');

exports.updateProfileValidator = [
  body('firstName').optional().isString().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().isString().trim().isLength({ min: 1, max: 50 }),
  body('region').optional().custom((value) => {
    if (!value || value === '') return true;
    return typeof value === 'string' && value.trim().length <= 100;
  }).withMessage('Region must be a string with max 100 characters'),
  body('description').optional().custom((value) => {
    if (!value || value === '') return true;
    return typeof value === 'string' && value.length <= 1000;
  }).withMessage('Description must be a string with max 1000 characters'),
  body('industry').optional().custom((value) => {
    if (!value || value === '') return true;
    // Validate that it's a valid MongoDB ObjectId format
    return typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);
  }).withMessage('Industry must be a valid MongoDB ObjectId'),
  body('title').optional().custom((value) => {
    if (!value || value === '') return true;
    return typeof value === 'string' && value.trim().length >= 2 && value.trim().length <= 100;
  }).withMessage('Title must be between 2-100 characters'),
  body('companyName').optional().custom((value) => {
    if (!value || value === '') return true;
    return typeof value === 'string' && value.trim().length >= 2 && value.trim().length <= 100;
  }).withMessage('Company name must be between 2-100 characters'),
  body('companySize').optional().custom((value) => {
    if (!value || value === '') return true;
    const validSizes = [
      '1-10 Employees', '11-50 Employees', '51-100 Employees', '100-200 Employees',
      '201-500 Employees', '500+ Employees'
    ];
    return validSizes.includes(value);
  }).withMessage('Company size must be one of the predefined options'),
  body('companyEmail').optional().custom((value) => {
    if (!value || value === '') return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }).withMessage('Company email must be a valid email address'),
  // Vendor-specific field validations
  body('companyAvatar').optional().custom((value) => {
    if (!value || value === '') return true; // Allow empty string or undefined
    if (typeof value === 'string' && value.length > 0) {
      try {
        new URL(value);
        return value.length <= 500;
      } catch {
        return false;
      }
    }
    return true;
  }).withMessage('Company avatar must be a valid URL with max 500 characters'),
  body('yearFounded').optional().custom((value) => {
    if (!value || value === '') return true;
    return typeof value === 'string' && value.length === 4 && /^\d{4}$/.test(value);
  }).withMessage('Year founded must be a 4-digit year'),
  body('hqLocation').optional().custom((value) => {
    if (!value || value === '') return true;
    return typeof value === 'string' && value.trim().length <= 200;
  }).withMessage('HQ location must be a string with max 200 characters'),
  body('companyDescription').optional().custom((value) => {
    if (!value || value === '') return true;
    return typeof value === 'string' && value.length <= 2000;
  }).withMessage('Company description must be a string with max 2000 characters'),
  body('companyWebsiteUrl').optional().custom((value) => {
    if (!value || value === '') return true; // Allow empty string or undefined
    if (typeof value === 'string' && value.length > 0) {
      try {
        new URL(value);
        return value.length <= 200;
      } catch {
        return false;
      }
    }
    return true;
  }).withMessage('Company website must be a valid URL with max 200 characters'),
  body('socialLinks').optional().isObject(),
  body('socialLinks.linkedin').optional().custom((value) => {
    if (!value || value === '') return true; // Allow empty string or undefined
    if (typeof value === 'string' && value.length > 0) {
      try {
        new URL(value);
        return value.length <= 200;
      } catch {
        return false;
      }
    }
    return true;
  }).withMessage('LinkedIn URL must be a valid URL with max 200 characters'),
  body('socialLinks.twitter').optional().custom((value) => {
    if (!value || value === '') return true; // Allow empty string or undefined
    if (typeof value === 'string' && value.length > 0) {
      try {
        new URL(value);
        return value.length <= 200;
      } catch {
        return false;
      }
    }
    return true;
  }).withMessage('Twitter URL must be a valid URL with max 200 characters'),
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
