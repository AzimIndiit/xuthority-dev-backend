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
  body('socialLinks').optional().isObject(),
  body('socialLinks.linkedin').optional().isString().isURL().isLength({ max: 200 }),
  body('socialLinks.twitter').optional().isString().isURL().isLength({ max: 200 }),
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
