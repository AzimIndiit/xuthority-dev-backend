const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminNotificationController = require('../controllers/adminNotificationController');
const { 
  productReviewController, 
  badgeController, 
  blogController, 
  userRoleController, 
  softwareController,
  solutionController,
  industryController,
  languageController,
  marketSegmentController,
  integrationController
} = require('../controllers');
const adminAuth = require('../middleware/adminAuth');
const upload = require('../middleware/upload');
const { validate } = require('../middleware/validation');
const { 
  productReviewValidator, 
  blogValidator, 
  userRoleValidator, 
  softwareValidator,
  solutionValidator,
  industryValidator,
  languageValidator,
  marketSegmentValidator,
  integrationValidator,
  productValidator
} = require('../validators');
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

// Notification routes
router.get('/notifications', adminNotificationController.listAdminNotifications);
router.get('/notifications/unread-count', adminNotificationController.getAdminUnreadCount);
router.patch('/notifications/:id/read', adminNotificationController.markAdminNotificationAsRead);
router.patch('/notifications/read-all', adminNotificationController.markAllAdminNotificationsAsRead);

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
router.delete('/product-reviews/:id', validate(productReviewValidator.delete), adminController.deleteReview);

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

// User Roles management routes (Admin only)
router.get('/user-roles', validate(userRoleValidator.query, 'query'), userRoleController.getAllUserRoles);
router.post('/user-roles', validate(userRoleValidator.create, 'body'), userRoleController.createUserRole);
router.get('/user-roles/:id', validate(userRoleValidator.getById, 'params'), userRoleController.getUserRoleById);
router.put('/user-roles/:id', validate(userRoleValidator.update, 'body'), userRoleController.updateUserRole);
router.delete('/user-roles/:id', validate(userRoleValidator.delete, 'params'), userRoleController.deleteUserRole);
router.patch('/user-roles/:id/toggle-status', validate(userRoleValidator.toggleStatus, 'params'), userRoleController.toggleUserRoleStatus);
router.delete('/user-roles/bulk', userRoleController.bulkDeleteUserRoles);

// Software management routes (Admin only)
router.get('/software', validate(softwareValidator.validateGetSoftwareList, 'query'), softwareController.getAllSoftware);
router.post('/software', validate(softwareValidator.validateCreateSoftware, 'body'), softwareController.createSoftware);
router.get('/software/:id', validate(softwareValidator.validateGetSoftwareById, 'params'), softwareController.getSoftwareById);
router.put('/software/:id', validate(softwareValidator.validateUpdateSoftware, 'body'), softwareController.updateSoftware);
router.delete('/software/:id', validate(softwareValidator.validateDeleteSoftware, 'params'), softwareController.deleteSoftware);
router.patch('/software/:id/toggle-status', validate(softwareValidator.validateToggleSoftwareStatus, 'params'), softwareController.toggleSoftwareStatus);
router.delete('/software/bulk', softwareController.bulkDeleteSoftware);

// Solutions management routes (Admin only)
router.get('/solutions', validate(solutionValidator.query, 'query'), solutionController.getAllSolutions);
router.post('/solutions', validate(solutionValidator.create, 'body'), solutionController.createSolution);
router.get('/solutions/:id', validate(solutionValidator.getById, 'params'), solutionController.getSolutionById);
router.put('/solutions/:id', validate(solutionValidator.update, 'body'), solutionController.updateSolution);
router.delete('/solutions/:id', validate(solutionValidator.delete, 'params'), solutionController.deleteSolution);
router.patch('/solutions/:id/toggle-status', validate(solutionValidator.toggleStatus, 'params'), solutionController.toggleSolutionStatus);

// Industries management routes (Admin only)
router.get('/industries', validate(industryValidator.query, 'query'), industryController.getAllIndustries);
router.post('/industries', validate(industryValidator.create, 'body'), industryController.createIndustry);
router.get('/industries/:id', validate(industryValidator.getById, 'params'), industryController.getIndustryById);
router.put('/industries/:id', validate(industryValidator.update, 'body'), industryController.updateIndustry);
router.delete('/industries/:id', validate(industryValidator.delete, 'params'), industryController.deleteIndustry);
router.patch('/industries/:id/toggle-status', validate(industryValidator.toggleStatus, 'params'), industryController.toggleIndustryStatus);

// Languages management routes (Admin only)
router.get('/languages', validate(languageValidator.query, 'query'), languageController.getAllLanguages);
router.post('/languages', validate(languageValidator.create, 'body'), languageController.createLanguage);
router.get('/languages/:id', validate(languageValidator.getById, 'params'), languageController.getLanguageById);
router.put('/languages/:id', validate(languageValidator.update, 'body'), languageController.updateLanguage);
router.delete('/languages/:id', validate(languageValidator.delete, 'params'), languageController.deleteLanguage);
router.patch('/languages/:id/toggle-status', validate(languageValidator.toggleStatus, 'params'), languageController.toggleLanguageStatus);

// Market Segments management routes (Admin only)
router.get('/market-segments', validate(marketSegmentValidator.query, 'query'), marketSegmentController.getAllMarketSegments);
router.post('/market-segments', validate(marketSegmentValidator.create, 'body'), marketSegmentController.createMarketSegment);
router.get('/market-segments/:id', validate(marketSegmentValidator.getById, 'params'), marketSegmentController.getMarketSegmentById);
router.put('/market-segments/:id', validate(marketSegmentValidator.update, 'body'), marketSegmentController.updateMarketSegment);
router.delete('/market-segments/:id', validate(marketSegmentValidator.delete, 'params'), marketSegmentController.deleteMarketSegment);
router.patch('/market-segments/:id/toggle-status', validate(marketSegmentValidator.toggleStatus, 'params'), marketSegmentController.toggleMarketSegmentStatus);

// Integrations management routes (Admin only)
router.get('/integrations', validate(integrationValidator.query, 'query'), integrationController.getAllIntegrations);
router.post('/integrations', validate(integrationValidator.create, 'body'), integrationController.createIntegration);
router.get('/integrations/:id', validate(integrationValidator.getById, 'params'), integrationController.getIntegrationById);
router.put('/integrations/:id', validate(integrationValidator.update, 'body'), integrationController.updateIntegration);
router.delete('/integrations/:id', validate(integrationValidator.delete, 'params'), integrationController.deleteIntegration);
router.patch('/integrations/:id/toggle-status', validate(integrationValidator.toggleStatus, 'params'), integrationController.toggleIntegrationStatus);

// Pages management routes (Admin only)
const { pageController } = require('../controllers');
router.get('/pages', pageController.getAllPages);
router.post('/pages', pageController.createPage);
router.get('/pages/:id', pageController.getPageById);
router.put('/pages/:id', pageController.updatePage);
router.delete('/pages/:id', pageController.deletePage);
router.patch('/pages/:id/toggle-status', pageController.togglePageStatus);
router.delete('/pages/bulk', pageController.bulkDeletePages);

// Meta Tags management routes (Admin only)
const { metaTagController } = require('../controllers');
router.get('/meta-tags', metaTagController.getAllMetaTags);
router.post('/meta-tags', metaTagController.createMetaTag);
router.get('/meta-tags/:id', metaTagController.getMetaTagById);
router.put('/meta-tags/:id', metaTagController.updateMetaTag);
router.delete('/meta-tags/:id', metaTagController.deleteMetaTag);
router.patch('/meta-tags/:id/toggle-status', metaTagController.toggleMetaTagStatus);
router.delete('/meta-tags/bulk', metaTagController.bulkDeleteMetaTags);

// Products management routes (Admin only)
const { productController } = require('../controllers');
router.get('/products', validate(productValidator.query, 'query'), productController.getProducts);
router.patch('/products/:id/approve', adminAuth, require('../controllers/adminController').approveProduct);
router.patch('/products/:id/reject', adminAuth, require('../controllers/adminController').rejectProduct);
router.patch('/products/:id/approve-update', adminAuth, require('../controllers/adminController').approveProductUpdate);
router.patch('/products/:id/reject-update', adminAuth, require('../controllers/adminController').rejectProductUpdate);
router.get('/products/:slug', adminAuth, require('../controllers/adminController').getAdminProductBySlug);

module.exports = router;
