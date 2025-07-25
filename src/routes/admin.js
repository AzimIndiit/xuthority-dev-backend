const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { productReviewController, badgeController, blogController } = require('../controllers');
const adminAuth = require('../middleware/adminAuth');
const upload = require('../middleware/upload');
const { validate } = require('../middleware/validation');
const { productReviewValidator, blogValidator } = require('../validators');
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

const {
  validateAdminBadgeQuery,
  validateAdminBadgeRequestQuery,
  validateCreateBadge,
  validateUpdateBadge,
  validateUpdateBadgeStatus,
  validateBadgeId,
  validateRejectBadgeRequest,
  validateRequestId
} = require('../validators/badgeValidator');

// Authentication routes (no auth required)
router.post('/auth/login', validateAdminLogin, adminController.adminLogin);
router.post('/auth/forgot-password', validateAdminForgotPassword, adminController.forgotAdminPassword);
router.post('/auth/verify-reset-token', validateAdminVerifyResetToken, adminController.verifyAdminResetToken);
router.post('/auth/reset-password', validateAdminResetPassword, adminController.resetAdminPassword);

// TEMPORARY: Test badge route without auth for debugging
router.get('/test-badges', validateAdminBadgeQuery, badgeController.getAdminBadges);

// All routes below this middleware require admin authentication
router.use(adminAuth);

// Admin profile routes
router.get('/me', adminController.getAdminProfile);
router.patch('/profile', upload.single('avatar'), validateAdminProfileUpdate, adminController.updateAdminProfile);
router.patch('/change-password', validateAdminPasswordChange, adminController.changeAdminPassword);

// Dashboard and analytics
router.get('/analytics', adminController.getDashboardAnalytics);

// User management routes
router.get('/users', validateUserQuery, adminController.getUsers);
router.get('/users/slug/:slug', adminController.getUserBySlug);
router.get('/users/slug/:slug/profile-stats', adminController.getUserProfileStatsBySlug);
router.get('/users/slug/:slug/reviews', adminController.getUserReviewsBySlug);

// User actions
router.patch('/users/:id/verify', validateVerifyVendor, adminController.verifyVendorProfile);
router.patch('/users/:id/approve', validateApproveVendor, adminController.approveVendor);
router.patch('/users/:id/reject', validateRejectVendor, adminController.rejectVendor);
router.patch('/users/:id/block', validateBlockVendor, adminController.blockUser);
router.patch('/users/:id/unblock', validateUnblockVendor, adminController.unblockUser);
router.delete('/users/:id', validateDeleteVendor, adminController.deleteVendor);

// Vendor-specific routes (for backward compatibility)
router.get('/vendors/:slug/profile-stats', adminController.getVendorProfileStatsBySlug);
router.patch('/vendors/:id/block', validateBlockVendor, adminController.blockVendor);
router.patch('/vendors/:id/unblock', validateUnblockVendor, adminController.unblockVendor);

// Product review management routes
// TODO: Implement admin methods in productReviewController
// router.get('/reviews', validate(productReviewValidator.getReviews), productReviewController.getAdminReviews);
// router.get('/reviews/:id', validate(productReviewValidator.getReviewById), productReviewController.getAdminReviewById);
// router.patch('/reviews/:id/approve', validate(productReviewValidator.updateReviewStatus), productReviewController.approveReview);
// router.patch('/reviews/:id/reject', validate(productReviewValidator.updateReviewStatus), productReviewController.rejectReview);
// router.patch('/reviews/:id/flag', validate(productReviewValidator.updateReviewStatus), productReviewController.flagReview);
// router.delete('/reviews/:id', validate(productReviewValidator.deleteReview), productReviewController.deleteReview);

// Badge management routes
router.get('/badges', validateAdminBadgeQuery, badgeController.getAdminBadges);
router.get('/badges/:id', validateBadgeId, badgeController.getAdminBadgeById);
router.post('/badges', validateCreateBadge, badgeController.createAdminBadge);
router.patch('/badges/:id', validateUpdateBadge, badgeController.updateAdminBadge);
router.patch('/badges/:id/status', validateUpdateBadgeStatus, badgeController.updateAdminBadgeStatus);
router.delete('/badges/:id', validateBadgeId, badgeController.deleteAdminBadge);

// Badge request management routes
router.get('/badge-requests', validateAdminBadgeRequestQuery, badgeController.getAdminBadgeRequests);
router.get('/badge-requests/:id', validateRequestId, badgeController.getAdminBadgeRequestDetails);
router.patch('/badge-requests/:id/approve', validateRequestId, badgeController.approveAdminBadgeRequest);
router.patch('/badge-requests/:id/reject', validateRejectBadgeRequest, badgeController.rejectAdminBadgeRequest);

// Dispute management routes
router.get('/disputes', adminController.getAdminDisputes);
router.get('/disputes/:id', adminController.getAdminDisputeById);
router.put('/disputes/:id', adminController.updateAdminDispute);

// Blog management routes (Admin only)
router.get('/blogs', adminAuth, validate(blogValidator.list), blogController.getAdminBlogs);
router.post('/blogs', adminAuth, validate(blogValidator.create), blogController.createBlog);
router.get('/blogs/:id', adminAuth, validate(blogValidator.getById), blogController.getBlogById);
router.put('/blogs/:id', adminAuth, validate(blogValidator.update), blogController.updateBlog);
router.delete('/blogs/:id', adminAuth, validate(blogValidator.delete), blogController.deleteBlog);

// Resource Categories management routes (Admin only)
router.get('/resource-categories', adminAuth, require('../controllers/resourceCategoryController').getAllResourceCategories);

module.exports = router;
