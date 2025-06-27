const express = require('express');
const router = express.Router();
const userBadgeController = require('../controllers/userBadgeController');
const { auth, authorize } = require('../middleware');

// Vendor: Request a badge
router.post('/request', auth, authorize(['vendor']), userBadgeController.requestBadge);
// Vendor: Cancel badge request
router.patch('/:id/cancel', auth, authorize(['vendor']), userBadgeController.cancelBadgeRequest);
// Admin: Approve badge request
router.patch('/:id/approve', auth, authorize(['admin']), userBadgeController.approveBadgeRequest);
// Get badges for a user (profile/public profile)
router.get('/user/:userId', userBadgeController.getUserBadges);
// Get badges for current user
router.get('/me', auth, userBadgeController.getUserBadges);

module.exports = router; 