const adminService = require('../services/adminService');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * @openapi
 * /admin/auth/login:
 *   post:
 *     tags:
 *       - Admin Authentication
 *     summary: Admin login
 *     description: Authenticate admin user with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin email address
 *                 example: admin@xuthority.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Admin password
 *                 example: AdminPassword123!
 *     responses:
 *       200:
 *         description: Login successful
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
 *                     admin:
 *                       $ref: '#/components/schemas/Admin'
 *                     token:
 *                       type: string
 *                       description: JWT authentication token
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 message:
 *                   type: string
 *                   example: Admin login successful
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await adminService.adminLogin(email, password);
    
    return res.json(ApiResponse.success(
      result, 
      'Admin login successful'
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /admin/me:
 *   get:
 *     tags:
 *       - Admin Profile
 *     summary: Get admin profile
 *     description: Retrieve current admin user profile information
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
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
 *                     admin:
 *                       $ref: '#/components/schemas/Admin'
 *                 message:
 *                   type: string
 *                   example: Admin profile retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Admin not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exports.getAdminProfile = async (req, res, next) => {
  try {
    const admin = await adminService.getAdminProfile(req.user.id);
    
    return res.json(ApiResponse.success(
      { admin }, 
      'Admin profile retrieved successfully'
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /admin/analytics:
 *   get:
 *     tags:
 *       - Admin Dashboard
 *     summary: Get dashboard analytics with time filtering
 *     description: Retrieve comprehensive admin dashboard analytics including stats, charts, and recent reviews
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [weekly, monthly, yearly]
 *           default: weekly
 *         description: Time period for analytics filtering
 *         example: weekly
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
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
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: integer
 *                           description: Total number of users in the time period
 *                           example: 1250
 *                         totalVendors:
 *                           type: integer
 *                           description: Total number of vendors in the time period
 *                           example: 89
 *                         totalReviews:
 *                           type: integer
 *                           description: Total number of reviews in the time period
 *                           example: 3456
 *                         pendingVendors:
 *                           type: integer
 *                           description: Number of unverified vendors
 *                           example: 12
 *                     charts:
 *                       type: object
 *                       properties:
 *                         userGrowth:
 *                           type: array
 *                           description: User growth data over time
 *                           items:
 *                             type: object
 *                             properties:
 *                               period:
 *                                 type: string
 *                                 description: Time period label
 *                                 example: "2024-01-01"
 *                               users:
 *                                 type: integer
 *                                 description: Number of new users in this period
 *                                 example: 45
 *                               vendors:
 *                                 type: integer
 *                                 description: Number of new vendors in this period
 *                                 example: 12
 *                         reviewTrends:
 *                           type: array
 *                           description: Review trends data with status breakdown
 *                           items:
 *                             type: object
 *                             properties:
 *                               period:
 *                                 type: string
 *                                 description: Time period label
 *                                 example: "2024-01-01"
 *                               total:
 *                                 type: integer
 *                                 description: Total reviews in this period
 *                                 example: 123
 *                               approved:
 *                                 type: integer
 *                                 description: Approved reviews
 *                                 example: 100
 *                               pending:
 *                                 type: integer
 *                                 description: Pending reviews
 *                                 example: 15
 *                               rejected:
 *                                 type: integer
 *                                 description: Rejected reviews
 *                                 example: 5
 *                               flagged:
 *                                 type: integer
 *                                 description: Flagged reviews
 *                                 example: 3
 *                     recentReviews:
 *                       type: array
 *                       description: Most recent reviews
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Review ID
 *                             example: "60d21b4667d0d8992e610c85"
 *                           title:
 *                             type: string
 *                             description: Review title
 *                             example: "Excellent product!"
 *                           content:
 *                             type: string
 *                             description: Review content (truncated)
 *                             example: "This product exceeded my expectations..."
 *                           overallRating:
 *                             type: integer
 *                             description: Overall rating (1-5)
 *                             example: 5
 *                           status:
 *                             type: string
 *                             enum: [pending, approved, rejected, flagged]
 *                             description: Review status
 *                             example: "approved"
 *                           submittedAt:
 *                             type: string
 *                             format: date-time
 *                             description: Review submission date
 *                             example: "2024-01-01T10:30:00.000Z"
 *                           reviewer:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 description: Reviewer full name
 *                                 example: "John Doe"
 *                               avatar:
 *                                 type: string
 *                                 description: Reviewer avatar URL
 *                                 example: "https://example.com/avatar.jpg"
 *                               email:
 *                                 type: string
 *                                 description: Reviewer email
 *                                 example: "john@example.com"
 *                           product:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 description: Product name
 *                                 example: "Amazing Software"
 *                               slug:
 *                                 type: string
 *                                 description: Product slug
 *                                 example: "amazing-software"
 *                               logoUrl:
 *                                 type: string
 *                                 description: Product logo URL
 *                                 example: "https://example.com/logo.jpg"
 *                 message:
 *                   type: string
 *                   example: Analytics retrieved successfully
 *       400:
 *         description: Invalid period parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    const { period = 'weekly' } = req.query;
    
    // Validate period parameter
    const validPeriods = ['weekly', 'monthly', 'yearly'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json(ApiResponse.error(
        'Invalid period parameter. Must be one of: weekly, monthly, yearly',
        'INVALID_PERIOD',
        400
      ));
    }
    
    const analytics = await adminService.getDashboardAnalytics(period);
    
    return res.json(ApiResponse.success(
      analytics, 
      'Analytics retrieved successfully'
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags:
 *       - Admin User Management
 *     summary: Get all users with filtering
 *     description: Retrieve a paginated list of users with optional filtering and sorting
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of users per page
 *         example: 20
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, vendor]
 *         description: Filter by user role
 *         example: vendor
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *         description: Filter by verification status
 *         example: true
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search term for user name or email
 *         example: john
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, firstName, lastName, email, role]
 *           default: createdAt
 *         description: Field to sort by
 *         example: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *         example: desc
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
 *                     $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: Users retrieved successfully
 *                 meta:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exports.getUsers = async (req, res, next) => {
  try {
    const options = {
      page: req.query.page,
      limit: req.query.limit,
      role: req.query.role,
      isVerified: req.query.isVerified !== undefined ? req.query.isVerified === 'true' : undefined,
      status: req.query.status, // Support new status filtering
      search: req.query.search,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      // Date filtering parameters
      period: req.query.period,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };

    const result = await adminService.getUsers(options);
    
    return res.json(ApiResponse.success(
      result.users, 
      'Users retrieved successfully',
      { pagination: result.pagination }
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /admin/users/{id}/verify:
 *   patch:
 *     tags:
 *       - Admin User Management
 *     summary: Verify vendor profile
 *     description: Verify a vendor profile by admin
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: MongoDB ObjectId of the user to verify
 *         example: 60d21b4667d0d8992e610c85
 *     responses:
 *       200:
 *         description: Vendor profile verified successfully
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
 *                       $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: Vendor profile verified successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Invalid user ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exports.verifyVendorProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await adminService.verifyVendorProfile(userId, req.user);
    
    return res.json(ApiResponse.success(
      { user }, 
      'Vendor profile verified successfully'
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /admin/users/{id}/approve:
 *   patch:
 *     tags:
 *       - Admin User Management
 *     summary: Approve vendor profile
 *     description: Approve a pending vendor profile by admin
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: MongoDB ObjectId of the user to approve
 *         example: 60d21b4667d0d8992e610c85
 *     responses:
 *       200:
 *         description: Vendor profile approved successfully
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
 *                       $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: Vendor profile approved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 *       400:
 *         description: Invalid user ID format or user is not a vendor
 */
exports.approveVendor = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await adminService.approveVendor(userId, req.user);
    
    return res.json(ApiResponse.success(
      { user }, 
      'Vendor profile approved successfully'
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /admin/users/{id}/reject:
 *   patch:
 *     tags:
 *       - Admin User Management
 *     summary: Reject vendor profile
 *     description: Reject a pending vendor profile by admin
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: MongoDB ObjectId of the user to reject
 *         example: 60d21b4667d0d8992e610c85
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Optional reason for rejection
 *                 example: Incomplete profile information
 *     responses:
 *       200:
 *         description: Vendor profile rejected successfully
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
 *                       $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: Vendor profile rejected successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 *       400:
 *         description: Invalid user ID format or user is not a vendor
 */
exports.rejectVendor = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const reason = req.body.reason;
    const result = await adminService.rejectVendor(userId, req.user, reason);
    
    return res.json(ApiResponse.success(
      { user: result }, 
      'Vendor profile rejected and deleted successfully'
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /admin/users/{id}/block:
 *   patch:
 *     tags:
 *       - Admin User Management
 *     summary: Block vendor profile
 *     description: Block a vendor profile by admin
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: MongoDB ObjectId of the user to block
 *         example: 60d21b4667d0d8992e610c85
 *     responses:
 *       200:
 *         description: Vendor profile blocked successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 *       400:
 *         description: Invalid user ID format or user is not a vendor
 */
exports.blockVendor = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await adminService.blockVendor(userId, req.user);
    
    return res.json(ApiResponse.success(
      { user }, 
      'Vendor profile blocked successfully'
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /admin/users/{id}/unblock:
 *   patch:
 *     tags:
 *       - Admin User Management
 *     summary: Unblock vendor profile
 *     description: Unblock a vendor profile by admin
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: MongoDB ObjectId of the user to unblock
 *         example: 60d21b4667d0d8992e610c85
 *     responses:
 *       200:
 *         description: Vendor profile unblocked successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 *       400:
 *         description: Invalid user ID format or user is not a vendor
 */
exports.unblockVendor = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await adminService.unblockVendor(userId, req.user);
    
    return res.json(ApiResponse.success(
      { user }, 
      'Vendor profile unblocked successfully'
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /admin/users/{id}:
 *   delete:
 *     tags:
 *       - Admin User Management
 *     summary: Delete vendor profile
 *     description: Permanently delete a vendor profile by admin
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: MongoDB ObjectId of the user to delete
 *         example: 60d21b4667d0d8992e610c85
 *     responses:
 *       200:
 *         description: Vendor profile deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 *       400:
 *         description: Invalid user ID format or user is not a vendor
 */
exports.deleteVendor = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const result = await adminService.deleteVendor(userId, req.user);
    
    return res.json(ApiResponse.success(
      { user: result }, 
      'Vendor profile deleted successfully'
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /admin/profile:
 *   patch:
 *     tags:
 *       - Admin Profile
 *     summary: Update admin profile
 *     description: Update admin profile information including optional avatar upload
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 pattern: ^[a-zA-Z\s]+$
 *                 description: Admin first name
 *                 example: John
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 pattern: ^[a-zA-Z\s]+$
 *                 description: Admin last name
 *                 example: Doe
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 description: Admin notes
 *                 example: Senior administrator for platform management
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Profile avatar image file (optional)
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 pattern: ^[a-zA-Z\s]+$
 *                 description: Admin first name
 *                 example: John
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 pattern: ^[a-zA-Z\s]+$
 *                 description: Admin last name
 *                 example: Doe
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 description: Admin notes
 *                 example: Senior administrator for platform management
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
 *                     admin:
 *                       $ref: '#/components/schemas/Admin'
 *                 message:
 *                   type: string
 *                   example: Admin profile updated successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Validation error or no valid fields to update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       413:
 *         description: File too large (max 100MB)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exports.updateAdminProfile = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const updateData = req.body;
    
    // If file was uploaded, add avatar URL to update data
    if (req.file && req.file.location) {
      updateData.avatar = req.file.location;
    }
    
    const admin = await adminService.updateAdminProfile(adminId, updateData);
    
    return res.json(ApiResponse.success(
      { admin }, 
      'Admin profile updated successfully'
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /admin/change-password:
 *   patch:
 *     tags:
 *       - Admin Authentication
 *     summary: Change admin password
 *     description: Change admin password with current password verification
 *     security:
 *       - AdminBearerAuth: []
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
 *                 description: Current admin password
 *                 example: CurrentPassword123!
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 128
 *                 pattern: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)
 *                 description: New password (must contain lowercase, uppercase, and number)
 *                 example: NewPassword123!
 *               confirmNewPassword:
 *                 type: string
 *                 description: Confirmation of new password
 *                 example: NewPassword123!
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: null
 *                   example: null
 *                 message:
 *                   type: string
 *                   example: Password changed successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Invalid current password or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exports.changeAdminPassword = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    await adminService.changeAdminPassword(adminId, currentPassword, newPassword);
    
    return res.json(ApiResponse.success(
      null, 
      'Password changed successfully'
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /admin/auth/forgot-password:
 *   post:
 *     tags:
 *       - Admin Authentication
 *     summary: Admin forgot password
 *     description: Send password reset email to admin user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 255
 *                 description: Admin email address
 *                 example: admin@xuthority.com
 *     responses:
 *       200:
 *         description: Password reset email sent (if email exists)
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
 *                   example: {}
 *                 message:
 *                   type: string
 *                   example: If this email exists in our admin system, you will receive a password reset link
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Email send failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exports.forgotAdminPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    console.log(email);
    await adminService.forgotAdminPassword(email);
    
    return res.json(ApiResponse.success(
      {}, 
      'If this email exists in our admin system, you will receive a password reset link'
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /admin/auth/reset-password:
 *   post:
 *     tags:
 *       - Admin Authentication
 *     summary: Admin reset password
 *     description: Reset admin password using reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *               - confirmNewPassword
 *             properties:
 *               token:
 *                 type: string
 *                 minLength: 64
 *                 maxLength: 64
 *                 description: Password reset token from email
 *                 example: abc123def456ghi789jkl012mno345pqr678stu901vwx234yzab567cdef890
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 128
 *                 pattern: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)
 *                 description: New password (must contain lowercase, uppercase, and number)
 *                 example: NewPassword123!
 *               confirmNewPassword:
 *                 type: string
 *                 description: Confirmation of new password
 *                 example: NewPassword123!
 *     responses:
 *       200:
 *         description: Password reset successfully
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
 *                   example: {}
 *                 message:
 *                   type: string
 *                   example: Password has been reset successfully. You can now login with your new password.
 *       400:
 *         description: Invalid token, validation error, or same password not allowed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exports.resetAdminPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    
    await adminService.resetAdminPassword(token, newPassword);
    
    return res.json(ApiResponse.success(
      {}, 
      'Password has been reset successfully. You can now login with your new password.'
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /admin/auth/verify-reset-token:
 *   post:
 *     tags:
 *       - Admin Authentication
 *     summary: Verify admin reset token
 *     description: Verify if admin password reset token is valid and not expired
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 minLength: 64
 *                 maxLength: 64
 *                 description: Password reset token to verify
 *                 example: abc123def456ghi789jkl012mno345pqr678stu901vwx234yzab567cdef890
 *     responses:
 *       200:
 *         description: Reset token is valid
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
 *                     adminId:
 *                       type: string
 *                       description: Admin MongoDB ObjectId
 *                       example: 60d21b4667d0d8992e610c85
 *                     firstName:
 *                       type: string
 *                       description: Admin first name
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       description: Admin last name
 *                       example: Doe
 *                     email:
 *                       type: string
 *                       format: email
 *                       description: Admin email
 *                       example: admin@xuthority.com
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       description: Token expiration date
 *                       example: 2023-12-01T10:30:00.000Z
 *                 message:
 *                   type: string
 *                   example: Reset token is valid
 *       400:
 *         description: Invalid or expired reset token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exports.verifyAdminResetToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    
    const adminData = await adminService.verifyAdminResetToken(token);
    
    return res.json(ApiResponse.success(
      adminData, 
      'Reset token is valid'
    ));
  } catch (err) {
    next(err);
  }
};
