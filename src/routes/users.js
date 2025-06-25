const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { updateProfile, searchUsers, getProfile, getPublicProfile, changePassword } = require('../controllers/userController');
const { updateProfileValidator, userIdValidator, changePasswordValidator } = require('../validators/userValidator');
const auth = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');
const { validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

// Apply rate limiting to all user routes
router.use(rateLimiter);

// GET /api/v1/users/search - Search users (public endpoint)
router.get('/search', searchUsers);

// GET /api/v1/users/profile - Get current user's profile (authenticated)
router.get('/profile', auth, getProfile);

// GET /api/v1/users/public-profile/:userId - Get any user's public profile (public endpoint)
router.get(
  '/public-profile/:userId',
  userIdValidator,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(
        new ApiError('Validation error', 'VALIDATION_ERROR', 400, { errors: errors.array() })
      );
    }
    next();
  },
  getPublicProfile
);

// GET /api/v1/users - Get all users (authenticated)
router.get('/', auth, userController.getAllUsers);

// PATCH /api/v1/users/profile - Update user profile (authenticated)
router.patch(
  '/profile',
  auth,
  updateProfileValidator,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(
        new ApiError('Validation error', 'VALIDATION_ERROR', 400, { errors: errors.array() })
      );
    }
    next();
  },
  updateProfile
);

// PATCH /api/v1/users/change-password - Change user password (authenticated)
router.patch(
  '/change-password',
  auth,
  changePasswordValidator,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(
        new ApiError('Validation error', 'VALIDATION_ERROR', 400, { errors: errors.array() })
      );
    }
    next();
  },
  changePassword
);

module.exports = router;
