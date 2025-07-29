const express = require('express');
const router = express.Router();
const landingPageController = require('../controllers/landingPageController');
const adminAuth = require('../middleware/adminAuth');

// Public routes - to get landing page data
router.get('/:pageType', landingPageController.getLandingPage);
router.get('/:pageType/sections/:sectionName', landingPageController.getSection);

// Admin routes - require authentication
router.use(adminAuth);

// Get all landing pages summary (admin only)
router.get('/', landingPageController.getAllLandingPages);

// Update specific section
router.put('/:pageType/sections/:sectionName', landingPageController.updateSection);

// Update entire landing page
router.put('/:pageType', landingPageController.updateLandingPage);

// Reset section to default
router.delete('/:pageType/sections/:sectionName', landingPageController.resetSection);

module.exports = router;