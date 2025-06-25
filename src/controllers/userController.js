const User = require('../models/User');
const apiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * Get all users with pagination
 * @route GET /api/v1/users
 * @query page, limit
 */
/**
 * Get all users with pagination
 * @openapi
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users with pagination
 *     description: Retrieve a paginated list of all users in the system
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/User' }
 *                 message: { type: string, example: "Users fetched successfully" }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page: { type: integer, example: 1 }
 *                         limit: { type: integer, example: 10 }
 *                         totalPages: { type: integer, example: 5 }
 *                         total: { type: integer, example: 50 }
 *                     total: { type: integer, example: 50 }
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().skip(skip).limit(limit).select('-password -accessToken'),
      User.countDocuments(),
    ]);

    const pagination = {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total,
    };

    return res.json(apiResponse.success(users, 'Users fetched successfully', { pagination, total }));
  } catch (err) {
    next(err);
  }
};

/**
 * Update user profile
 * @openapi
 * /users/profile:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update user profile
 *     description: Update the authenticated user's profile fields
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string, example: "Jane" }
 *               lastName: { type: string, example: "Doe" }
 *               region: { type: string, example: "US" }
 *               description: { type: string, example: "Bio..." }
 *               industry: { type: string, example: "Tech" }
 *               title: { type: string, example: "CTO" }
 *               companyName: { type: string, example: "Acme Corp" }
 *               companySize: { type: string, example: "51-100 Employees" }
 *               companyEmail: { type: string, example: "contact@acme.com" }
 *               socialLinks:
 *                 type: object
 *                 properties:
 *                   linkedin: { type: string, example: "https://linkedin.com/in/janedoe" }
 *                   twitter: { type: string, example: "https://twitter.com/janedoe" }
 *               acceptedMarketing: { type: boolean, example: false }
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *                 message: { type: string, example: "Profile updated successfully" }
 *                 meta: { type: object }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error:
 *                   type: object
 *                   properties:
 *                     message: { type: string, example: "User not found" }
 *                     code: { type: string, example: "USER_NOT_FOUND" }
 *                     statusCode: { type: integer, example: 404 }
 *                     details: { type: object }
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error:
 *                   type: object
 *                   properties:
 *                     message: { type: string, example: "Internal server error" }
 *                     code: { type: string, example: "INTERNAL_ERROR" }
 *                     statusCode: { type: integer, example: 500 }
 *                     details: { type: object }
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;
    const user = await require('../services/userService').updateUserProfile(userId, updateData);
    await require('../services/auditService').logEvent({
      user: req.user,
      action: 'update_profile',
      target: 'User',
      targetId: userId,
      details: updateData,
      req,
    });
    return res.json(require('../utils/apiResponse').success({ user }, 'Profile updated successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * Get current user's profile
 * @openapi
 * /users/profile:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get current user's profile
 *     description: Retrieve the authenticated user's complete profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *                 message: { type: string, example: "Profile retrieved successfully" }
 *                 meta: { type: object }
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error:
 *                   type: object
 *                   properties:
 *                     message: { type: string, example: "Authentication required" }
 *                     code: { type: string, example: "UNAUTHORIZED" }
 *                     statusCode: { type: integer, example: 401 }
 *                     details: { type: object }
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error:
 *                   type: object
 *                   properties:
 *                     message: { type: string, example: "User not found" }
 *                     code: { type: string, example: "USER_NOT_FOUND" }
 *                     statusCode: { type: integer, example: 404 }
 *                     details: { type: object }
 *       500:
 *         description: Internal server error
 */
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await require('../services/userService').getUserProfile(userId);
    
    // Log the profile access
    await require('../services/auditService').logEvent({
      user: req.user,
      action: 'view_own_profile',
      target: 'User',
      targetId: userId,
      details: {},
      req,
    });
    
    return res.json(require('../utils/apiResponse').success({ user }, 'Profile retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * Get any user's public profile
 * @openapi
 * /users/public-profile/{userId}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user's public profile
 *     description: Retrieve any user's public profile information (limited data)
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: ID of the user whose profile to retrieve
 *     responses:
 *       200:
 *         description: Public profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id: { type: string }
 *                         firstName: { type: string }
 *                         lastName: { type: string }
 *                         email: { type: string }
 *                         region: { type: string }
 *                         description: { type: string }
 *                         industry: { type: string }
 *                         title: { type: string }
 *                         companyName: { type: string }
 *                         companySize: { type: string }
 *                         socialLinks: { type: object }
 *                         followersCount: { type: number }
 *                         followingCount: { type: number }
 *                         userType: { type: string, enum: [user, vendor] }
 *                         createdAt: { type: string, format: date-time }
 *                 message: { type: string, example: "Public profile retrieved successfully" }
 *                 meta: { type: object }
 *       400:
 *         description: Invalid user ID format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error:
 *                   type: object
 *                   properties:
 *                     message: { type: string, example: "Invalid user ID format" }
 *                     code: { type: string, example: "INVALID_ID" }
 *                     statusCode: { type: integer, example: 400 }
 *                     details: { type: object }
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error:
 *                   type: object
 *                   properties:
 *                     message: { type: string, example: "User not found" }
 *                     code: { type: string, example: "USER_NOT_FOUND" }
 *                     statusCode: { type: integer, example: 404 }
 *                     details: { type: object }
 *       500:
 *         description: Internal server error
 */
exports.getPublicProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await require('../services/userService').getPublicUserProfile(userId);
    
    return res.json(require('../utils/apiResponse').success({ user }, 'Public profile retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * Change user password
 * @openapi
 * /users/change-password:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Change user password
 *     description: Change the authenticated user's password by providing current password and new password
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
 *                 example: "OldPassword123!"
 *                 description: Current password for verification
 *               newPassword:
 *                 type: string
 *                 example: "NewPassword123!"
 *                 description: New password (must contain uppercase, lowercase, and number)
 *               confirmNewPassword:
 *                 type: string
 *                 example: "NewPassword123!"
 *                 description: Confirmation of new password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: object }
 *                 message: { type: string, example: "Password changed successfully" }
 *                 meta: { type: object }
 *       400:
 *         description: Validation error or invalid current password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error:
 *                   type: object
 *                   properties:
 *                     message: { type: string }
 *                     code: { type: string }
 *                     statusCode: { type: integer, example: 400 }
 *                     details: { type: object }
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;
    
    await require('../services/userService').changePassword(userId, currentPassword, newPassword);
    
    // Log the password change event
    await require('../services/auditService').logEvent({
      user: req.user,
      action: 'change_password',
      target: 'User',
      targetId: userId,
      details: { action: 'password_changed' },
      req,
    });
    
    return res.json(require('../utils/apiResponse').success({}, 'Password changed successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * Search users
 * @openapi
 * /users/search:
 *   get:
 *     tags:
 *       - Users
 *     summary: Search users
 *     description: Search for users by name, email, or other criteria
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of users per page
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *           enum: [user, vendor]
 *         description: Filter by user type
 *     responses:
 *       200:
 *         description: Users found successfully
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
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           email:
 *                             type: string
 *                           userType:
 *                             type: string
 *                           followers:
 *                             type: number
 *                           following:
 *                             type: number
 *                     pagination:
 *                       type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - missing or invalid search query
 *       500:
 *         description: Internal server error
 */
exports.searchUsers = async (req, res, next) => {
  try {
    const { q: query, userType } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;

    if (!query || query.trim().length === 0) {
      throw new ApiError('Search query is required', 'SEARCH_QUERY_REQUIRED', 400);
    }

    // Build search criteria - exact matches for names, email only if it looks like email
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special regex chars
    const isEmailQuery = query.includes('@') || query.includes('.'); // Check if it looks like email
    const isFullNameQuery = query.includes(' '); // Check if it's a full name search
    
    const searchCriteria = {
      $or: [
        { firstName: { $regex: `^${escapedQuery}$`, $options: 'i' } }, // Exact match for first name
        { lastName: { $regex: `^${escapedQuery}$`, $options: 'i' } },  // Exact match for last name
        // Only search email if query looks like an email
        ...(isEmailQuery ? [{ email: { $regex: escapedQuery, $options: 'i' } }] : []),
        // Only search full name if query contains a space (multi-word search)
        ...(isFullNameQuery ? [{ 
          $expr: {
            $regexMatch: {
              input: { $concat: ['$firstName', ' ', '$lastName'] },
              regex: escapedQuery,
              options: 'i'
            }
          }
        }] : [])
      ]
    };

    // Add userType filter if specified (field name is 'role' in the User model)
    if (userType) {
      searchCriteria.role = userType;
    }

    const [foundUsers, total] = await Promise.all([
      User.find(searchCriteria)
        .select('-password -accessToken')
        .skip(skip)
        .limit(limit)
        .sort({ firstName: 1, lastName: 1 }),
      User.countDocuments(searchCriteria),
    ]);

    // Transform users to include userType field (mapped from role)
    const users = foundUsers.map(user => ({
      ...user.toObject(),
      userType: user.role
    }));

    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    return res.json(apiResponse.success(
      { users, pagination },
      `Found ${total} user(s) matching "${query}"`
    ));
  } catch (err) {
    next(err);
  }
};
