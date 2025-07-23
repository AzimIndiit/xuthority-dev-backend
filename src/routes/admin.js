const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');
const { uploadMiddleware } = require('../middleware/upload');
const { 
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
} = require('../validators/adminValidator');

// Authentication routes (no auth required)
router.post('/auth/login', validateAdminLogin, adminController.adminLogin);
router.post('/auth/forgot-password', validateAdminForgotPassword, adminController.forgotAdminPassword);
router.post('/auth/reset-password', validateAdminResetPassword, adminController.resetAdminPassword);
router.post('/auth/verify-reset-token', validateAdminVerifyResetToken, adminController.verifyAdminResetToken);

// Protected admin routes (require admin auth)
router.get('/me', adminAuth, adminController.getAdminProfile);
router.patch('/profile', adminAuth, uploadMiddleware('avatar'), validateAdminProfileUpdate, adminController.updateAdminProfile);
router.patch('/change-password', adminAuth, validateAdminPasswordChange, adminController.changeAdminPassword);
router.get('/analytics', adminAuth, adminController.getDashboardAnalytics);
router.get('/users', adminAuth, validateUserQuery, adminController.getUsers);
router.get('/users/:id', adminAuth, adminController.getUserById);
router.get('/users/:id/profile-stats', adminAuth, adminController.getUserProfileStats);
router.get('/users/:id/reviews', adminAuth, adminController.getUserReviews);
router.get('/users/slug/:slug', adminAuth, adminController.getUserBySlug);
router.get('/users/slug/:slug/profile-stats', adminAuth, adminController.getUserProfileStatsBySlug);
router.get('/users/slug/:slug/reviews', adminAuth, adminController.getUserReviewsBySlug);
router.patch('/users/:id/verify', adminAuth, validateVerifyVendor, adminController.verifyVendorProfile);
router.patch('/users/:id/approve', adminAuth, validateApproveVendor, adminController.approveVendor);
router.patch('/users/:id/reject', adminAuth, validateRejectVendor, adminController.rejectVendor);
router.patch('/users/:id/block', adminAuth, validateBlockVendor, adminController.blockVendor);
router.patch('/users/:id/unblock', adminAuth, validateUnblockVendor, adminController.unblockVendor);

// Product management routes
router.post('/products/:id/recalculate-stats', adminAuth, adminController.recalculateProductStats);
router.delete('/users/:id', adminAuth, validateDeleteVendor, adminController.deleteVendor);

module.exports = router;
