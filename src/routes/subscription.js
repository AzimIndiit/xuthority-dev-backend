const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const rateLimiter = require('../middleware/rateLimiter');
const { validationResult } = require('express-validator');
const { body, param } = require('express-validator');
const ApiError = require('../utils/apiError');

/**
 * Validation middleware for subscription routes
 */
const planIdValidator = [
  body('planId')
    .isMongoId()
    .withMessage('Plan ID must be a valid MongoDB ObjectId'),
];

const checkoutValidator = [
  body('planId')
    .isMongoId()
    .withMessage('Plan ID must be a valid MongoDB ObjectId'),
  body('successUrl')
    .optional()
    .isURL()
    .withMessage('Success URL must be a valid URL'),
  body('cancelUrl')
    .optional()
    .isURL()
    .withMessage('Cancel URL must be a valid URL'),
];

const updateSubscriptionValidator = [
  body('newPlanId')
    .isMongoId()
    .withMessage('New plan ID must be a valid MongoDB ObjectId'),
];

const cancelSubscriptionValidator = [
  body('reason')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Reason must be a string with maximum 500 characters'),
];

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ApiError('Validation error', 'VALIDATION_ERROR', 400, { errors: errors.array() })
    );
  }
  next();
};

/**
 * @openapi
 * /subscription/plans:
 *   get:
 *     tags:
 *       - Subscription
 *     summary: Get all subscription plans
 *     description: Retrieve all available subscription plans
 *     responses:
 *       200:
 *         description: Subscription plans retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "507f1f77bcf86cd799439011"
 *                       name:
 *                         type: string
 *                         example: "Standard"
 *                       description:
 *                         type: string
 *                         example: "Perfect for growing businesses"
 *                       price:
 *                         type: number
 *                         example: 12.00
 *                       currency:
 *                         type: string
 *                         example: "USD"
 *                       period:
 *                         type: string
 *                         example: "monthly"
 *                       isFree:
 *                         type: boolean
 *                         example: false
 *                       trialDays:
 *                         type: number
 *                         example: 7
 *                       features:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["Enhanced branding", "Advanced analytics", "Review management"]
 *                       buttonText:
 *                         type: string
 *                         example: "Start Trial"
 *                       formattedPrice:
 *                         type: string
 *                         example: "$12.00"
 *                 message:
 *                   type: string
 *                   example: "Subscription plans retrieved successfully"
 */
// GET /api/subscription/plans - Get all subscription plans (public)
router.get('/plans', rateLimiter, subscriptionController.getSubscriptionPlans);

/**
 * @openapi
 * /subscription/current:
 *   get:
 *     tags:
 *       - Subscription
 *     summary: Get current user subscription
 *     description: Retrieve the authenticated user's current active subscription
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current subscription retrieved successfully
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
 *                     id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     plan:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439012"
 *                         name:
 *                           type: string
 *                           example: "Standard"
 *                         price:
 *                           type: number
 *                           example: 12.00
 *                         features:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["Enhanced branding", "Advanced analytics"]
 *                     status:
 *                       type: string
 *                       enum: ["active", "trialing", "canceled", "past_due"]
 *                       example: "active"
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     isTrialing:
 *                       type: boolean
 *                       example: false
 *                     currentPeriodStart:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-01T00:00:00.000Z"
 *                     currentPeriodEnd:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-02-01T00:00:00.000Z"
 *                     daysUntilExpiry:
 *                       type: number
 *                       example: 15
 *                 message:
 *                   type: string
 *                   example: "Current subscription retrieved successfully"
 *       401:
 *         description: Authentication required
 *       404:
 *         description: No active subscription found
 */
// GET /api/subscription/current - Get current user's subscription (authenticated)
router.get('/current', rateLimiter, auth, subscriptionController.getCurrentSubscription);

/**
 * @openapi
 * /subscription/checkout:
 *   post:
 *     tags:
 *       - Subscription
 *     summary: Create Stripe checkout session
 *     description: Create a new Stripe checkout session for subscription purchase
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 pattern: '^[0-9a-fA-F]{24}$'
 *                 description: Subscription plan ID
 *                 example: "507f1f77bcf86cd799439011"
 *               successUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL to redirect to after successful payment
 *                 example: "https://example.com/success"
 *               cancelUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL to redirect to after canceled payment
 *                 example: "https://example.com/cancel"
 *     responses:
 *       200:
 *         description: Checkout session created successfully
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
 *                     sessionId:
 *                       type: string
 *                       description: Stripe checkout session ID
 *                       example: "cs_test_1234567890"
 *                     url:
 *                       type: string
 *                       description: Stripe checkout URL
 *                       example: "https://checkout.stripe.com/pay/cs_test_1234567890#fidkdWxOYHwnPyd1blpxYHZxWjA0T0lLNUNIbWJ3MHRgNGhLU18w="
 *                 message:
 *                   type: string
 *                   example: "Checkout session created successfully"
 *       400:
 *         description: Invalid request data or user already has subscription
 *       401:
 *         description: Authentication required
 */
// POST /api/subscription/checkout - Create checkout session (authenticated)
router.post(
  '/checkout',
  rateLimiter,
  auth,
  checkoutValidator,
  handleValidationErrors,
  subscriptionController.createCheckoutSession
);

/**
 * @openapi
 * /subscription/billing-portal:
 *   post:
 *     tags:
 *       - Subscription
 *     summary: Create billing portal session
 *     description: Create a Stripe billing portal session for subscription management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Billing portal session created successfully
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
 *                     url:
 *                       type: string
 *                       description: Stripe billing portal URL
 *                       example: "https://billing.stripe.com/session/bps_1234567890"
 *                 message:
 *                   type: string
 *                   example: "Billing portal session created successfully"
 *       401:
 *         description: Authentication required
 *       404:
 *         description: No active subscription found
 */
// POST /api/subscription/billing-portal - Create billing portal session (authenticated)
router.post('/billing-portal', rateLimiter, auth, subscriptionController.createBillingPortalSession);

/**
 * @openapi
 * /subscription/update:
 *   put:
 *     tags:
 *       - Subscription
 *     summary: Update subscription plan
 *     description: Update the user's current subscription to a different plan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPlanId
 *             properties:
 *               newPlanId:
 *                 type: string
 *                 pattern: '^[0-9a-fA-F]{24}$'
 *                 description: New subscription plan ID
 *                 example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Subscription updated successfully
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
 *                   description: Updated subscription object
 *                 message:
 *                   type: string
 *                   example: "Subscription updated successfully"
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 *       404:
 *         description: No active subscription found
 */
// PUT /api/subscription/update - Update subscription plan (authenticated)
router.put(
  '/update',
  rateLimiter,
  auth,
  updateSubscriptionValidator,
  handleValidationErrors,
  subscriptionController.updateSubscription
);

/**
 * @openapi
 * /subscription/cancel:
 *   delete:
 *     tags:
 *       - Subscription
 *     summary: Cancel subscription
 *     description: Cancel the user's current subscription (will remain active until period end)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional cancellation reason
 *                 example: "No longer needed"
 *     responses:
 *       200:
 *         description: Subscription canceled successfully
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
 *                   description: Updated subscription object
 *                 message:
 *                   type: string
 *                   example: "Subscription canceled successfully"
 *       401:
 *         description: Authentication required
 *       404:
 *         description: No active subscription found
 */
// DELETE /api/subscription/cancel - Cancel subscription (authenticated)
router.delete(
  '/cancel',
  rateLimiter,
  auth,
  cancelSubscriptionValidator,
  handleValidationErrors,
  subscriptionController.cancelSubscription
);

/**
 * @openapi
 * /subscription/resume:
 *   post:
 *     tags:
 *       - Subscription
 *     summary: Resume canceled subscription
 *     description: Resume a previously canceled subscription
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription resumed successfully
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
 *                   description: Updated subscription object
 *                 message:
 *                   type: string
 *                   example: "Subscription resumed successfully"
 *       400:
 *         description: Subscription is not canceled
 *       401:
 *         description: Authentication required
 *       404:
 *         description: No active subscription found
 */
// POST /api/subscription/resume - Resume canceled subscription (authenticated)
router.post('/resume', rateLimiter, auth, subscriptionController.resumeSubscription);

/**
 * @openapi
 * /subscription/process-pending:
 *   post:
 *     tags:
 *       - Subscription
 *     summary: Process pending checkout sessions (Development)
 *     description: Check for completed Stripe checkout sessions and create local subscription records
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending checkouts processed successfully
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
 *                     processedCount:
 *                       type: number
 *                       example: 1
 *                     totalCompleted:
 *                       type: number
 *                       example: 1
 *                 message:
 *                   type: string
 *                   example: "Processed 1 pending checkout sessions"
 *       401:
 *         description: Authentication required
 */
// POST /api/subscription/process-pending - Process pending checkout sessions (Development helper)
router.post('/process-pending', rateLimiter, auth, subscriptionController.processPendingCheckouts);

/**
 * @openapi
 * /subscription/complete-checkout:
 *   post:
 *     tags:
 *       - Subscription
 *     summary: Complete open checkout session manually (Development)
 *     description: Manually complete an open Stripe checkout session for development
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: Optional specific session ID to complete
 *                 example: "cs_test_1234567890"
 *     responses:
 *       200:
 *         description: Checkout session completed successfully
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
 *                     sessionId:
 *                       type: string
 *                       example: "cs_test_1234567890"
 *                     subscriptionId:
 *                       type: string
 *                       example: "sub_1234567890"
 *                 message:
 *                   type: string
 *                   example: "Checkout session completed manually"
 *       401:
 *         description: Authentication required
 *       404:
 *         description: No open session found
 */
// POST /api/subscription/complete-checkout - Complete open checkout session manually (Development helper)
router.post('/complete-checkout', rateLimiter, auth, subscriptionController.completeCheckoutManually);

/**
 * @openapi
 * /subscription/cleanup-test:
 *   delete:
 *     tags:
 *       - Subscription
 *     summary: Clean up test subscriptions (Development)
 *     description: Remove all test subscriptions for the authenticated user (development only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Test subscriptions cleaned up successfully
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
 *                     cleanedCount:
 *                       type: number
 *                       example: 1
 *                 message:
 *                   type: string
 *                   example: "Cleaned up 1 test subscriptions"
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not allowed in production
 */
// DELETE /api/subscription/cleanup-test - Clean up test subscriptions (Development helper)
router.delete('/cleanup-test', rateLimiter, auth, subscriptionController.cleanupTestSubscriptions);

/**
 * @openapi
 * /subscription/webhook:
 *   post:
 *     tags:
 *       - Subscription
 *     summary: Stripe webhook endpoint
 *     description: Handle Stripe webhook events for subscription management
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Stripe webhook event data
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid webhook signature
 *       500:
 *         description: Webhook processing failed
 */
// POST /api/subscription/webhook - Stripe webhook handler (public, but verified by Stripe signature)
router.post('/webhook', subscriptionController.handleWebhook);

/**
 * @openapi
 * /subscription/analytics:
 *   get:
 *     tags:
 *       - Subscription
 *     summary: Get subscription analytics
 *     description: Get subscription analytics and statistics (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics period
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics period
 *         example: "2024-12-31"
 *     responses:
 *       200:
 *         description: Subscription analytics retrieved successfully
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
 *                     totalSubscriptions:
 *                       type: number
 *                       example: 150
 *                     activeSubscriptions:
 *                       type: number
 *                       example: 120
 *                     canceledSubscriptions:
 *                       type: number
 *                       example: 25
 *                     trialSubscriptions:
 *                       type: number
 *                       example: 15
 *                     totalRevenue:
 *                       type: number
 *                       example: 1800.00
 *                     planDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "Standard"
 *                           count:
 *                             type: number
 *                             example: 85
 *                 message:
 *                   type: string
 *                   example: "Subscription analytics retrieved successfully"
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
// GET /api/subscription/analytics - Get subscription analytics (admin only)
router.get('/analytics', rateLimiter, auth, authorize(['admin']), subscriptionController.getSubscriptionAnalytics);

module.exports = router; 