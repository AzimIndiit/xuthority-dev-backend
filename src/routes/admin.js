const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');
const { 
  validateAdminLogin, 
  validateUserQuery, 
  validateVerifyVendor,
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
router.patch('/profile', adminAuth, validateAdminProfileUpdate, adminController.updateAdminProfile);
router.patch('/change-password', adminAuth, validateAdminPasswordChange, adminController.changeAdminPassword);
router.get('/analytics', adminAuth, adminController.getDashboardAnalytics);
router.get('/users', adminAuth, validateUserQuery, adminController.getUsers);
router.patch('/users/:id/verify', adminAuth, validateVerifyVendor, adminController.verifyVendorProfile);

module.exports = router;
