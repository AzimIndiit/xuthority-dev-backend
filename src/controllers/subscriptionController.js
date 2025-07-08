const subscriptionService = require('../services/subscriptionService');
const apiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const logger = require('../config/logger');
const { stripe } = require('../config/stripe');

/**
 * Get all available subscription plans
 * @route GET /api/subscription/plans
 * @access Public
 */
exports.getSubscriptionPlans = async (req, res, next) => {
  try {
    const plans = await subscriptionService.getSubscriptionPlans();
    
    // Transform plans for frontend display
    const transformedPlans = plans.map(plan => ({
      id: plan._id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      period: plan.billingPeriodText,
      isActive: false, // Will be set by frontend based on user's subscription
      isFree: plan.planType === 'free',
      trialDays: plan.trialPeriodDays,
      features: plan.features,
      buttonText: plan.trialPeriodDays > 0 ? 'Start Trial' : (plan.price === 0 ? 'Get Started' : 'Subscribe'),
      buttonVariant: 'default',
      planType: plan.planType,
      formattedPrice: plan.formattedPrice,
    }));
    
    return res.json(apiResponse.success(transformedPlans, 'Subscription plans retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * Get user's current subscription
 * @route GET /api/subscription/current
 * @access Private
 */
exports.getCurrentSubscription = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const subscription = await subscriptionService.getCurrentSubscription(userId);
    
    if (!subscription) {
      return res.json(apiResponse.success(null, 'No active subscription found'));
    }

    // Transform subscription for frontend
    const transformedSubscription = {
      id: subscription._id,
      plan: {
        id: subscription.subscriptionPlan._id,
        name: subscription.subscriptionPlan.name,
        price: subscription.subscriptionPlan.price,
        features: subscription.subscriptionPlan.features,
      },
      status: subscription.status,
      isActive: subscription.isActive,
      isTrialing: subscription.isTrialing,
      isCanceled: subscription.isCanceled,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialEnd: subscription.trialEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      daysUntilExpiry: subscription.daysUntilExpiry,
      trialDaysRemaining: subscription.trialDaysRemaining,
    };
    
    return res.json(apiResponse.success(transformedSubscription, 'Current subscription retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * Create Stripe checkout session
 * @route POST /api/subscription/checkout
 * @access Private
 */
exports.createCheckoutSession = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { planId, successUrl, cancelUrl } = req.body;
    
    if (!planId) {
      throw new ApiError('Plan ID is required', 'PLAN_ID_REQUIRED', 400);
    }
    
    const result = await subscriptionService.createCheckoutSession(userId, planId, {
      successUrl,
      cancelUrl,
    });
    
    // Log the checkout session creation
    await require('../services/auditService').logEvent({
      user: req.user,
      action: 'create_checkout_session',
      target: 'Subscription',
      targetId: planId,
      details: { planId },
      req,
    });
    
    return res.json(apiResponse.success(result, 'Checkout session created successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * Create billing portal session
 * @route POST /api/subscription/billing-portal
 * @access Private
 */
exports.createBillingPortalSession = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const result = await subscriptionService.createBillingPortalSession(userId);
    
    // Log the billing portal access
    await require('../services/auditService').logEvent({
      user: req.user,
      action: 'access_billing_portal',
      target: 'Subscription',
      targetId: userId,
      details: {},
      req,
    });
    
    return res.json(apiResponse.success(result, 'Billing portal session created successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * Update subscription plan
 * @route PUT /api/subscription/update
 * @access Private
 */
exports.updateSubscription = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { newPlanId } = req.body;
    
    if (!newPlanId) {
      throw new ApiError('New plan ID is required', 'NEW_PLAN_ID_REQUIRED', 400);
    }
    
    const subscription = await subscriptionService.updateSubscription(userId, newPlanId);
    
    // Log the subscription update
    await require('../services/auditService').logEvent({
      user: req.user,
      action: 'update_subscription',
      target: 'Subscription',
      targetId: subscription._id,
      details: { newPlanId },
      req,
    });
    
    return res.json(apiResponse.success(subscription, 'Subscription updated successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * Cancel subscription
 * @route DELETE /api/subscription/cancel
 * @access Private
 */
exports.cancelSubscription = async (req, res, next) => {
  try {
    const userId = req.user._id;
    // Handle undefined req.body for DELETE requests
    const { reason } = req.body || {};
    
    const subscription = await subscriptionService.cancelSubscription(userId, reason || 'User requested cancellation');
    
    // Log the subscription cancellation
    await require('../services/auditService').logEvent({
      user: req.user,
      action: 'cancel_subscription',
      target: 'Subscription',
      targetId: subscription._id,
      details: { reason: reason || 'User requested cancellation' },
      req,
    });
    
    return res.json(apiResponse.success(subscription, 'Subscription canceled successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * Resume canceled subscription
 * @route POST /api/subscription/resume
 * @access Private
 */
exports.resumeSubscription = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const subscription = await subscriptionService.resumeSubscription(userId);
    
    // Log the subscription resumption
    await require('../services/auditService').logEvent({
      user: req.user,
      action: 'resume_subscription',
      target: 'Subscription',
      targetId: subscription._id,
      details: {},
      req,
    });
    
    return res.json(apiResponse.success(subscription, 'Subscription resumed successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * Handle Stripe webhooks
 * @route POST /api/subscription/webhook
 * @access Public (but verified by Stripe signature)
 */
exports.handleWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  // Debug logging
  console.log('=== WEBHOOK DEBUG ===');
  console.log('Headers:', req.headers);
  console.log('Body type:', typeof req.body);
  console.log('Body is Buffer:', Buffer.isBuffer(req.body));
  console.log('Body length:', req.body ? req.body.length : 'No body');
  console.log('Stripe signature:', sig);
  console.log('Webhook secret exists:', !!webhookSecret);
  console.log('===================');
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log(`Received webhook event: >>>>>>>>>>>>>>>>>>>> ${event.type}`);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  try {
    await handleStripeWebhookEvent(event);
    logger.info(`Processed webhook event: ${event.type}`);
    res.json({ received: true });
  } catch (err) {
    logger.error('Error processing webhook:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * Handle different Stripe webhook events
 * @param {object} event - Stripe webhook event
 */
const handleStripeWebhookEvent = async (event) => {
  const { UserSubscription } = require('../models');
  
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;
      
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
      
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
      
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
      
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
      
    case 'customer.subscription.trial_will_end':
      await handleTrialWillEnd(event.data.object);
      break;
      
    default:
      logger.info(`Unhandled webhook event: ${event.type}`);
  }
};

/**
 * Handle checkout session completed
 */
const handleCheckoutSessionCompleted = async (session) => {
  const { UserSubscription } = require('../models');
  const { createNotification } = require('../services/notificationService');
  const subscriptionService = require('../services/subscriptionService');
  
  if (session.mode === 'subscription' && session.subscription) {
    const userId = session.metadata.userId;
    const planId = session.metadata.planId;
    
    logger.info(`Checkout completed for user ${userId}, plan ${planId}, subscription: ${session.subscription}`);
    
    try {
      // Check if subscription already exists
      const existingSubscription = await UserSubscription.findOne({
        stripeSubscriptionId: session.subscription
      });
      
      if (existingSubscription) {
        logger.info(`Subscription ${session.subscription} already exists in database`);
        return;
      }
      
      // Get the subscription details from Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
      logger.info(`Retrieved Stripe subscription: ${stripeSubscription.id}, status: ${stripeSubscription.status}`);
      
      // Get the subscription plan from database
      const plan = await subscriptionService.getSubscriptionPlan(planId);
      
      // Create the user subscription record
      const userSubscription = new UserSubscription({
        user: userId,
        subscriptionPlan: plan._id,
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: stripeSubscription.customer,
        stripePriceId: plan.stripePriceId,
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        trialStart: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : null,
        trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
        priceAmount: plan.price,
        currency: plan.currency,
        billingInterval: plan.billingInterval,
        billingIntervalCount: plan.billingIntervalCount,
        defaultPaymentMethod: stripeSubscription.default_payment_method,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        latestInvoiceId: stripeSubscription.latest_invoice,
      });
      
      await userSubscription.save();
      
      logger.info(`Created subscription record for user ${userId} with status: ${stripeSubscription.status}`);
      
      // Send success notification
      await createNotification({
        userId,
        type: 'SUBSCRIPTION_STARTED',
        title: 'Subscription Activated',
        message: `Your ${plan.name} subscription has been activated successfully.`,
        actionUrl: '/profile/my-subscription'
      });
      
      logger.info(`Sent subscription activation notification to user ${userId}`);
      
    } catch (error) {
      logger.error(`Error creating subscription for user ${userId}:`, error);
      
      // Send error notification
      await createNotification({
        userId,
        type: 'SUBSCRIPTION_ERROR',
        title: 'Subscription Setup Issue',
        message: 'There was an issue setting up your subscription. Please contact support.',
        actionUrl: '/profile/my-subscription'
      });
    }
  }
};

/**
 * Handle subscription created
 */
const handleSubscriptionCreated = async (subscription) => {
  const { UserSubscription } = require('../models');
  
  // Update local subscription record with Stripe data
  const localSubscription = await UserSubscription.findOne({
    stripeSubscriptionId: subscription.id
  });
  
  if (localSubscription) {
    localSubscription.status = subscription.status;
    localSubscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
    localSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    localSubscription.defaultPaymentMethod = subscription.default_payment_method;
    
    await localSubscription.save();
    logger.info(`Updated subscription ${subscription.id} with Stripe data`);
  }
};

/**
 * Handle subscription updated
 */
const handleSubscriptionUpdated = async (subscription) => {
  const { UserSubscription } = require('../models');
  const { createNotification } = require('../services/notificationService');
  
  const localSubscription = await UserSubscription.findOne({
    stripeSubscriptionId: subscription.id
  });
  
  if (localSubscription) {
    const oldStatus = localSubscription.status;
    
    localSubscription.status = subscription.status;
    localSubscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
    localSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    localSubscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;
    localSubscription.defaultPaymentMethod = subscription.default_payment_method;
    
    await localSubscription.save();
    
    // Send notification for status changes
    if (oldStatus !== subscription.status) {
      await createNotification({
        userId: localSubscription.user,
        type: 'SUBSCRIPTION_UPDATED',
        title: 'Subscription Status Changed',
        message: `Your subscription status has changed to ${subscription.status}`,
        actionUrl: '/profile/my-subscription'
      });
    }
    
    logger.info(`Updated subscription ${subscription.id} status to ${subscription.status}`);
  }
};

/**
 * Handle subscription deleted
 */
const handleSubscriptionDeleted = async (subscription) => {
  const { UserSubscription } = require('../models');
  const { createNotification } = require('../services/notificationService');
  
  const localSubscription = await UserSubscription.findOne({
    stripeSubscriptionId: subscription.id
  });
  
  if (localSubscription) {
    localSubscription.status = 'canceled';
    localSubscription.canceledAt = new Date();
    
    await localSubscription.save();
    
    // Create default free subscription for the user
    await subscriptionService.createDefaultFreeSubscription(localSubscription.user);
    
    // Send notification
    await createNotification({
      userId: localSubscription.user,
      type: 'SUBSCRIPTION_ENDED',
      title: 'Subscription Ended',
      message: 'Your subscription has ended. You have been moved to the free plan.',
      actionUrl: '/profile/my-subscription'
    });
    
    logger.info(`Subscription ${subscription.id} has been canceled and user moved to free plan`);
  }
};

/**
 * Handle payment succeeded
 */
const handlePaymentSucceeded = async (invoice) => {
  const { UserSubscription } = require('../models');
  const { createNotification } = require('../services/notificationService');
  
  if (invoice.subscription) {
    const localSubscription = await UserSubscription.findOne({
      stripeSubscriptionId: invoice.subscription
    });
    
    if (localSubscription) {
      localSubscription.latestInvoiceId = invoice.id;
      localSubscription.notifications.paymentFailed = false; // Reset payment failed flag
      
      await localSubscription.save();
      
      // Send payment success notification
      await createNotification({
        userId: localSubscription.user,
        type: 'PAYMENT_SUCCESS',
        title: 'Payment Successful',
        message: `Your payment of ${invoice.amount_paid / 100} ${invoice.currency.toUpperCase()} was processed successfully.`,
        actionUrl: '/profile/my-subscription'
      });
      
      logger.info(`Payment succeeded for subscription ${invoice.subscription}`);
    }
  }
};

/**
 * Handle payment failed
 */
const handlePaymentFailed = async (invoice) => {
  const { UserSubscription } = require('../models');
  const { createNotification } = require('../services/notificationService');
  
  if (invoice.subscription) {
    const localSubscription = await UserSubscription.findOne({
      stripeSubscriptionId: invoice.subscription
    });
    
    if (localSubscription) {
      localSubscription.notifications.paymentFailed = true;
      
      await localSubscription.save();
      
      // Send payment failed notification
      await createNotification({
        userId: localSubscription.user,
        type: 'PAYMENT_FAILED',
        title: 'Payment Failed',
        message: 'Your subscription payment failed. Please update your payment method.',
        actionUrl: '/profile/my-subscription'
      });
      
      logger.info(`Payment failed for subscription ${invoice.subscription}`);
    }
  }
};

/**
 * Handle trial will end
 */
const handleTrialWillEnd = async (subscription) => {
  const { UserSubscription } = require('../models');
  const { createNotification } = require('../services/notificationService');
  
  const localSubscription = await UserSubscription.findOne({
    stripeSubscriptionId: subscription.id
  });
  
  if (localSubscription) {
    localSubscription.notifications.trialEndingSoon = true;
    
    await localSubscription.save();
    
    // Send trial ending notification
    await createNotification({
      userId: localSubscription.user,
      type: 'TRIAL_ENDING',
      title: 'Trial Ending Soon',
      message: 'Your trial period is ending soon. Please add a payment method to continue.',
      actionUrl: '/profile/my-subscription'
    });
    
    logger.info(`Trial ending soon for subscription ${subscription.id}`);
  }
};

/**
 * Check and process pending checkout sessions (Development helper)
 * @route POST /api/subscription/process-pending
 * @access Private
 */
exports.processPendingCheckouts = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Get user's recent checkout sessions from Stripe
    const { stripe } = require('../config/stripe');
    const { User, UserSubscription } = require('../models');
    const subscriptionService = require('../services/subscriptionService');
    const apiResponse = require('../utils/apiResponse');
    const logger = require('../config/logger');
    const ApiError = require('../utils/apiError');
    
    const user = await User.findById(userId);
    
    if (!user) {
      throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Find Stripe customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return res.json(apiResponse.success(null, 'No customer found'));
    }

    const customer = customers.data[0];

    // Get recent checkout sessions for this customer
    const sessions = await stripe.checkout.sessions.list({
      customer: customer.id,
      limit: 10,
    });

    const completedSessions = sessions.data.filter(session => 
      session.status === 'complete' && 
      session.mode === 'subscription' &&
      session.metadata.userId === userId.toString()
    );

    let processedCount = 0;

    for (const session of completedSessions) {
      // Check if we already have a subscription for this session
      const existingSubscription = await UserSubscription.findOne({
        stripeSubscriptionId: session.subscription,
      });

      if (!existingSubscription && session.subscription) {
        // Get the Stripe subscription
        const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
        
        // Get the plan from metadata
        const planId = session.metadata.planId;
        const plan = await subscriptionService.getSubscriptionPlan(planId);

        // Create local subscription record
        const subscription = new UserSubscription({
          user: userId,
          subscriptionPlan: plan._id,
          stripeSubscriptionId: stripeSubscription.id,
          stripeCustomerId: customer.id,
          stripePriceId: plan.stripePriceId,
          status: stripeSubscription.status,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          trialStart: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : null,
          trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
          priceAmount: plan.price,
          currency: plan.currency,
          billingInterval: plan.billingInterval,
          billingIntervalCount: plan.billingIntervalCount,
          defaultPaymentMethod: stripeSubscription.default_payment_method,
        });

        await subscription.save();
        processedCount++;

        logger.info(`Processed pending checkout session: ${session.id} for user: ${userId}`);
      }
    }

    return res.json(apiResponse.success(
      { processedCount, totalCompleted: completedSessions.length },
      `Processed ${processedCount} pending checkout sessions`
    ));
  } catch (err) {
    logger.error('Error processing pending checkouts:', err);
    next(err);
  }
};

/**
 * Complete open checkout sessions manually (Development helper)
 * @route POST /api/subscription/complete-checkout
 * @access Private
 */
exports.completeCheckoutManually = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.body;
    
    const { stripe } = require('../config/stripe');
    const { User, UserSubscription } = require('../models');
    const subscriptionService = require('../services/subscriptionService');
    const apiResponse = require('../utils/apiResponse');
    const logger = require('../config/logger');
    const ApiError = require('../utils/apiError');
    
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
    }

    let targetSession;
    
    if (sessionId) {
      // Complete specific session
      targetSession = await stripe.checkout.sessions.retrieve(sessionId);
      if (targetSession.metadata.userId !== userId.toString()) {
        throw new ApiError('Session does not belong to user', 'UNAUTHORIZED', 403);
      }
    } else {
      // Find user's open sessions
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (customers.data.length === 0) {
        throw new ApiError('No Stripe customer found', 'CUSTOMER_NOT_FOUND', 404);
      }

      const customer = customers.data[0];
      const sessions = await stripe.checkout.sessions.list({
        customer: customer.id,
        limit: 10,
      });

      const openSession = sessions.data.find(session => 
        session.status === 'open' && 
        session.mode === 'subscription' &&
        session.metadata.userId === userId.toString()
      );

      if (!openSession) {
        throw new ApiError('No open checkout session found', 'NO_OPEN_SESSION', 404);
      }

      targetSession = openSession;
    }

    if (targetSession.status !== 'open') {
      throw new ApiError('Session is not open', 'SESSION_NOT_OPEN', 400);
    }

    // For development, we'll simulate completing the checkout by creating the subscription directly
    const planId = targetSession.metadata.planId;
    const plan = await subscriptionService.getSubscriptionPlan(planId);

    // Check if subscription already exists
    const existingSubscription = await subscriptionService.getCurrentSubscription(userId);
    if (existingSubscription) {
      throw new ApiError('User already has an active subscription', 'SUBSCRIPTION_EXISTS', 400);
    }

    // Create subscription using Stripe
    const subscription = await subscriptionService.createStripeSubscription(userId, plan, {
      trial_period_days: plan.trialPeriodDays,
    });

    logger.info(`Manually completed checkout session: ${targetSession.id} for user: ${userId}`);

    return res.json(apiResponse.success(
      {
        sessionId: targetSession.id,
        subscriptionId: subscription.stripeSubscriptionId,
        subscription: subscription
      },
      'Checkout session completed manually'
    ));
  } catch (err) {
    logger.error('Error completing checkout manually:', err);
    next(err);
  }
};

/**
 * Clean up test subscriptions (Development helper)
 * @route DELETE /api/subscription/cleanup-test
 * @access Private
 */
exports.cleanupTestSubscriptions = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new ApiError('Cleanup not allowed in production', 'NOT_ALLOWED_IN_PRODUCTION', 403);
    }

    const userId = req.user._id;
    
    const { User, UserSubscription } = require('../models');
    const { stripe } = require('../config/stripe');
    const apiResponse = require('../utils/apiResponse');
    const logger = require('../config/logger');
    const ApiError = require('../utils/apiError');
    
    // Find user's subscriptions
    const subscriptions = await UserSubscription.find({ user: userId });
    
    let canceledCount = 0;
    
    for (const subscription of subscriptions) {
      try {
        // Cancel in Stripe if it exists
        if (subscription.stripeSubscriptionId) {
          await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
          logger.info(`Canceled Stripe subscription: ${subscription.stripeSubscriptionId}`);
        }
        
        // Delete from database
        await UserSubscription.findByIdAndDelete(subscription._id);
        canceledCount++;
        
        logger.info(`Cleaned up test subscription: ${subscription._id}`);
      } catch (error) {
        logger.warn(`Failed to cleanup subscription ${subscription._id}:`, error.message);
      }
    }

    return res.json(apiResponse.success(
      { cleanedCount: canceledCount },
      `Cleaned up ${canceledCount} test subscriptions`
    ));
  } catch (err) {
    logger.error('Error cleaning up test subscriptions:', err);
    next(err);
  }
};

/**
 * Get subscription analytics (Admin only)
 * @route GET /api/subscription/analytics
 * @access Private (Admin)
 */
exports.getSubscriptionAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const analytics = await subscriptionService.getSubscriptionAnalytics({
      startDate,
      endDate,
    });
    
    return res.json(apiResponse.success(analytics, 'Subscription analytics retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = exports; 