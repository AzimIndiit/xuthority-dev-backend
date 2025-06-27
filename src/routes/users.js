const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { updateProfile, getProfile, getPublicProfile, changePassword } = require('../controllers/userController');
const { updateProfileValidator, userIdValidator, changePasswordValidator } = require('../validators/userValidator');
const auth = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');
const { validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

// Apply rate limiting to all user routes
router.use(rateLimiter);

/**
 * @openapi
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users or search users
 *     description: Retrieve all users or search for users by name, email, or other criteria
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *         example: "john"
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, vendor, admin]
 *         description: Filter by user role
 *         example: "vendor"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of results per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "507f1f77bcf86cd799439011"
 *                       firstName:
 *                         type: string
 *                         example: "John"
 *                       lastName:
 *                         type: string
 *                         example: "Doe"
 *                       email:
 *                         type: string
 *                         example: "john.doe@example.com"
 *                       role:
 *                         type: string
 *                         example: "user"
 *                 meta:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         total:
 *                           type: integer
 *                           example: 25
 *                         pages:
 *                           type: integer
 *                           example: 3
 *                 message:
 *                   type: string
 *                   example: "Users fetched successfully"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Authentication required"
 *                     code:
 *                       type: string
 *                       example: "AUTHENTICATION_REQUIRED"
 *                     statusCode:
 *                       type: integer
 *                       example: 401
 */
// GET /api/v1/users - Get all users or search users (admin only)
router.get('/', auth, userController.getAllUsers);

/**
 * @openapi
 * /users/profile:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         firstName:
 *                           type: string
 *                           example: "John"
 *                         lastName:
 *                           type: string
 *                           example: "Doe"
 *                         email:
 *                           type: string
 *                           example: "john.doe@example.com"
 *                         role:
 *                           type: string
 *                           example: "user"
 *                         companyName:
 *                           type: string
 *                           example: "Tech Solutions Inc"
 *                         isVerified:
 *                           type: boolean
 *                           example: true
 *                 message:
 *                   type: string
 *                   example: "Profile retrieved successfully"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Authentication required"
 *                     code:
 *                       type: string
 *                       example: "AUTHENTICATION_REQUIRED"
 *                     statusCode:
 *                       type: integer
 *                       example: 401
 */
// GET /api/v1/users/profile - Get current user's profile (authenticated)
router.get('/profile', auth, getProfile);

/**
 * @openapi
 * /users/public-profile/{userId}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user public profile
 *     description: Retrieve public profile information for any user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: User ID (MongoDB ObjectId)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Public profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         firstName:
 *                           type: string
 *                           example: "John"
 *                         lastName:
 *                           type: string
 *                           example: "Doe"
 *                         role:
 *                           type: string
 *                           example: "user"
 *                         companyName:
 *                           type: string
 *                           example: "Tech Solutions Inc"
 *                         isVerified:
 *                           type: boolean
 *                           example: true
 *                         followersCount:
 *                           type: integer
 *                           example: 42
 *                         followingCount:
 *                           type: integer
 *                           example: 15
 *                 message:
 *                   type: string
 *                   example: "Public profile retrieved successfully"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "User not found"
 *                     code:
 *                       type: string
 *                       example: "USER_NOT_FOUND"
 *                     statusCode:
 *                       type: integer
 *                       example: 404
 *       400:
 *         description: Invalid user ID format
 */
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

/**
 * @openapi
 * /users/profile:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update user profile
 *     description: Update the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: User's first name
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: User's last name
 *                 example: "Doe"
 *               companyName:
 *                 type: string
 *                 maxLength: 100
 *                 description: Company name (for vendors)
 *                 example: "Tech Solutions Inc"
 *               companyEmail:
 *                 type: string
 *                 format: email
 *                 description: Company email (for vendors)
 *                 example: "contact@techsolutions.com"
 *               industry:
 *                 type: string
 *                 description: Industry sector (for vendors)
 *                 example: "Technology"
 *               companySize:
 *                 type: string
 *                 description: Company size (for vendors)
 *                 example: "51-100 Employees"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: User description
 *                 example: "Software developer with 5 years of experience"
 *               region:
 *                 type: string
 *                 description: User's region
 *                 example: "US"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         firstName:
 *                           type: string
 *                           example: "John"
 *                         lastName:
 *                           type: string
 *                           example: "Doe"
 *                         email:
 *                           type: string
 *                           example: "john.doe@example.com"
 *                         role:
 *                           type: string
 *                           example: "user"
 *                         companyName:
 *                           type: string
 *                           example: "Tech Solutions Inc"
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 */
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

/**
 * @openapi
 * /users/change-password:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Change user password
 *     description: Change the authenticated user's password. Sends email confirmation and in-app notification upon successful password change.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmNewPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *                 example: "CurrentPassword123!"
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 128
 *                 description: New password (8-128 characters)
 *                 example: "NewPassword123!"
 *               confirmNewPassword:
 *                 type: string
 *                 description: Password confirmation
 *                 example: "NewPassword123!"
 *     responses:
 *       200:
 *         description: Password changed successfully. Email confirmation sent and notification created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password changed successfully"
 *       400:
 *         description: Validation error or invalid current password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Current password is incorrect"
 *                     code:
 *                       type: string
 *                       example: "INVALID_CURRENT_PASSWORD"
 *                     statusCode:
 *                       type: integer
 *                       example: 400
 *       401:
 *         description: Authentication required
 */
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
