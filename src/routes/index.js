const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const fileRoutes = require('./files');
const healthRoutes = require('./health');
const adminRoutes = require('./admin');
const followRoutes = require('./follow');
const productRoutes = require('./products');
const softwareRoutes = require('./software');
const solutionRoutes = require('./solutions');
const languageRoutes = require('./languages');
const marketSegmentRoutes = require('./marketSegments');
const integrationRoutes = require('./integrations');
const industryRoutes = require('./industries');
const userRoleRoutes = require('./userRoles');
const blogRoutes = require('./blogs');
const resourceCategoryRoutes = require('./resourceCategories');
const productReviewRoutes = require('./productReviews');
const reviewReplyRoutes = require('./reviewReplies');
const communityRoutes = require('./community');
const disputeRoutes = require('./disputes');
const badgeRoutes = require('./badges');
const userBadgeRoutes = require('./userBadges');
const notifications = require('./notifications');
const searchRoutes = require('./search');
const otpRoutes = require('./otp');
const favoritesRoutes = require('./favorites');
const { API_PREFIX } = require('../config/constants');

// Register all routes
router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/users`, userRoutes);
router.use(`${API_PREFIX}/files`, fileRoutes);
router.use(`${API_PREFIX}/health`, healthRoutes);
router.use(`${API_PREFIX}/admin`, adminRoutes);
router.use(`${API_PREFIX}/products`, productRoutes);
router.use(`${API_PREFIX}/software`, softwareRoutes);
router.use(`${API_PREFIX}/solutions`, solutionRoutes);
router.use(`${API_PREFIX}/follow`, followRoutes);
router.use(`${API_PREFIX}/languages`, languageRoutes);
router.use(`${API_PREFIX}/market-segments`, marketSegmentRoutes);
router.use(`${API_PREFIX}/integrations`, integrationRoutes);
router.use(`${API_PREFIX}/industries`, industryRoutes);
router.use(`${API_PREFIX}/user-roles`, userRoleRoutes);
router.use(`${API_PREFIX}/blogs`, blogRoutes);
router.use(`${API_PREFIX}/resource-categories`, resourceCategoryRoutes);
router.use(`${API_PREFIX}/product-reviews`, productReviewRoutes);
router.use(`${API_PREFIX}`, reviewReplyRoutes);
router.use(`${API_PREFIX}/community`, communityRoutes);
router.use(`${API_PREFIX}/disputes`, disputeRoutes);
router.use(`${API_PREFIX}/badges`, badgeRoutes);
router.use(`${API_PREFIX}/user-badges`, userBadgeRoutes);
router.use(`${API_PREFIX}/notifications`, notifications);
router.use(`${API_PREFIX}/search`, searchRoutes);
router.use(`${API_PREFIX}/otp`, otpRoutes);
router.use(`${API_PREFIX}/favorites`, favoritesRoutes);

// API documentation route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Xuthority API v1.0.0',
    documentation: '/api-docs',
    endpoints: {
      auth: `${API_PREFIX}/auth`,
      users: `${API_PREFIX}/users`,
      files: `${API_PREFIX}/files`,
      admin: `${API_PREFIX}/admin`,
      health: `${API_PREFIX}/health`,
      products: `${API_PREFIX}/products`,
      software: `${API_PREFIX}/software`,
      solutions: `${API_PREFIX}/solutions`,
      follow: `${API_PREFIX}/follow`,
      followers: `${API_PREFIX}/followers`,
      following: `${API_PREFIX}/following`,
      community: `${API_PREFIX}/community`,
      disputes: `${API_PREFIX}/disputes`,
      notifications: `${API_PREFIX}/notifications`,
    },
  });
});

module.exports = router;
