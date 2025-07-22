const adminService = require('../services/adminService');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * Admin login
 * POST /api/v1/admin/auth/login
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
 * Get admin profile
 * GET /api/v1/admin/me
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
 * Get admin dashboard analytics
 * GET /api/v1/admin/analytics
 */
exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    const analytics = await adminService.getDashboardAnalytics();
    
    return res.json(ApiResponse.success(
      analytics, 
      'Analytics retrieved successfully'
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * Get all users with admin filtering
 * GET /api/v1/admin/users
 */
exports.getUsers = async (req, res, next) => {
  try {
    const options = {
      page: req.query.page,
      limit: req.query.limit,
      role: req.query.role,
      isVerified: req.query.isVerified !== undefined ? req.query.isVerified === 'true' : undefined,
      search: req.query.search,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
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
 * Verify vendor profile
 * PATCH /api/v1/admin/users/:id/verify
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
 * Update admin profile
 * PATCH /api/v1/admin/profile
 */
exports.updateAdminProfile = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const updateData = req.body;
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
 * Change admin password
 * PATCH /api/v1/admin/change-password
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
 * Admin forgot password
 * POST /api/v1/admin/auth/forgot-password
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
 * Admin reset password
 * POST /api/v1/admin/auth/reset-password
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
 * Verify admin reset token
 * POST /api/v1/admin/auth/verify-reset-token
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
