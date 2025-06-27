const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');
const { auth, authorize, optionalAuth } = require('../middleware');

// Public: Get all badges (with optional auth for user-specific flags)
router.get('/', optionalAuth, badgeController.getAllBadges);
// Public: Get badge by ID (with optional auth)
router.get('/:id', optionalAuth, badgeController.getBadgeById);
// Admin: Create badge
router.post('/', auth, authorize(['admin']), badgeController.createBadge);
// Admin: Update badge
router.put('/:id', auth, authorize(['admin']), badgeController.updateBadge);
// Admin: Delete badge
router.delete('/:id', auth, authorize(['admin']), badgeController.deleteBadge);

module.exports = router; 