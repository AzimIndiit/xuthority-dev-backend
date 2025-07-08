const { SubscriptionPlan, UserSubscription, User } = require('../models');
const { stripe, stripeConfig } = require('../config/stripe');
const ApiError = require('../utils/apiError');
const logger = require('../config/logger');
const emailService = require('./emailService');
const { createNotification } = require('./notificationService');

/**
 * Get all available subscription plans
 * @returns {Promise<Array>}
 */
exports.getSubscriptionPlans = async () => {
  const plans = await SubscriptionPlan.find({ isActive: true })
    .sort({ sortOrder: 1, displayOrder: 1 });
  
  return plans;
};

/**
 * Get a specific subscription plan by ID
 * @param {string} planId - Plan ID
 * @returns {Promise<SubscriptionPlan>}
 */
exports.getSubscriptionPlan = async (planId) => {
  const plan = await SubscriptionPlan.findById(planId);
  
  if (!plan) {
    throw new ApiError('Subscription plan not found', 'PLAN_NOT_FOUND', 404);
  }
  
  if (!plan.isActive) {
    throw new ApiError('Subscription plan is not active', 'PLAN_NOT_ACTIVE', 400);
  }
  
  return plan;
};

/**
 * Get user's current active subscription
 * @param {string} userId - User ID
 * @returns {Promise<UserSubscription|null>}
 */
exports.getCurrentSubscription = async (userId) => {
  const subscription = await UserSubscription.findActiveSubscription(userId);
  return subscription;
};

/**
 * Create a new subscription with trial period
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID
 * @param {object} options - Additional options
 * @returns {Promise<UserSubscription>}
 */
exports.createSubscription = async (userId, planId, options = {}) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
  }

  const plan = await exports.getSubscriptionPlan(planId);
  
  // Check if user already has an active subscription
  const existingSubscription = await exports.getCurrentSubscription(userId);
  if (existingSubscription) {
    throw new ApiError('User already has an active subscription', 'SUBSCRIPTION_EXISTS', 400);
  }

  // For free plans, create local subscription only
  if (plan.planType === 'free') {
    return await exports.createFreeSubscription(userId, plan);
  }

  // For paid plans, create Stripe subscription
  return await exports.createStripeSubscription(userId, plan, options);
};

/**
 * Create a free subscription (no Stripe involvement)
 * @param {string} userId - User ID
 * @param {SubscriptionPlan} plan - Plan object
 * @returns {Promise<UserSubscription>}
 */
exports.createFreeSubscription = async (userId, plan) => {
  const now = new Date();
  const trialEnd = new Date(now.getTime() + (plan.trialPeriodDays * 24 * 60 * 60 * 1000));
  
  const subscription = new UserSubscription({
    user: userId,
    subscriptionPlan: plan._id,
    status: plan.trialPeriodDays > 0 ? 'trialing' : 'active',
    currentPeriodStart: now,
    currentPeriodEnd: plan.trialPeriodDays > 0 ? trialEnd : new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)), // 30 days for free
    trialStart: plan.trialPeriodDays > 0 ? now : null,
    trialEnd: plan.trialPeriodDays > 0 ? trialEnd : null,
    priceAmount: plan.price,
    currency: plan.currency,
    billingInterval: plan.billingInterval,
    billingIntervalCount: plan.billingIntervalCount,
  });

  await subscription.save();
  
  // Send welcome notification
  await createNotification({
    userId,
    type: 'SUBSCRIPTION_STARTED',
    title: 'Welcome to Xuthority!',
    message: plan.trialPeriodDays > 0 
      ? `Your ${plan.trialPeriodDays}-day trial has started` 
      : 'Your free account is now active',
    actionUrl: '/profile/my-subscription'
  });

  return subscription.populate('subscriptionPlan');
};

/**
 * Create a Stripe subscription
 * @param {string} userId - User ID
 * @param {SubscriptionPlan} plan - Plan object
 * @param {object} options - Additional options
 * @returns {Promise<UserSubscription>}
 */
exports.createStripeSubscription = async (userId, plan, options = {}) => {
  const user = await User.findById(userId);
  
  try {
    // Create or get Stripe customer
    let customer = await exports.getOrCreateStripeCustomer(user);
    
    // Create Stripe subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: plan.stripePriceId }],
      trial_period_days: plan.trialPeriodDays,
      metadata: {
        userId: String(userId), // Ensure it's a string
        planId: String(plan._id), // Ensure it's a string
      },
      ...options,
    });

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
    
    // Send welcome notification
    await createNotification({
      userId,
      type: 'SUBSCRIPTION_STARTED',
      title: 'Subscription Started!',
      message: plan.trialPeriodDays > 0 
        ? `Your ${plan.trialPeriodDays}-day trial has started` 
        : 'Your subscription is now active',
      actionUrl: '/profile/my-subscription'
    });

    return subscription.populate('subscriptionPlan');
  } catch (error) {
    logger.error('Error creating Stripe subscription:', error);
    throw new ApiError('Failed to create subscription', 'SUBSCRIPTION_CREATE_FAILED', 500);
  }
};

/**
 * Get or create Stripe customer
 * @param {User} user - User object
 * @returns {Promise<object>}
 */
exports.getOrCreateStripeCustomer = async (user) => {
  try {
    // Check if user already has a customer ID stored
    if (user.stripeCustomerId) {
      try {
        // Verify the customer still exists in Stripe
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        return customer;
      } catch (error) {
        // If customer doesn't exist in Stripe, clear the stored ID
        logger.warn(`Stripe customer ${user.stripeCustomerId} not found, creating new one`);
        user.stripeCustomerId = null;
      }
    }

    // Check if customer already exists in Stripe by email
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customer;
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user._id.toString(),
        },
      });
    }

    // Store customer ID in user model for future use
    user.stripeCustomerId = customer.id;
    await user.save();

    return customer;
  } catch (error) {
    logger.error('Error creating/retrieving Stripe customer:', error);
    throw new ApiError('Failed to create customer', 'CUSTOMER_CREATE_FAILED', 500);
  }
};

/**
 * Create Stripe checkout session
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID
 * @param {object} options - Additional options
 * @returns {Promise<object>}
 */
exports.createCheckoutSession = async (userId, planId, options = {}) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
  }

  const plan = await exports.getSubscriptionPlan(planId);
  
  // Check if user already has an active subscription
  const existingSubscription = await exports.getCurrentSubscription(userId);
  if (existingSubscription) {
    throw new ApiError('User already has an active subscription', 'SUBSCRIPTION_EXISTS', 400);
  }

  // For free plans, create subscription directly
  if (plan.planType === 'free') {
    const subscription = await exports.createFreeSubscription(userId, plan);
    return {
      sessionId: null,
      url: `${process.env.FRONTEND_URL}/profile/my-subscription?success=true`,
      subscription,
    };
  }

  try {
    // Create or get Stripe customer
    let customer = await exports.getOrCreateStripeCustomer(user);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: options.successUrl || stripeConfig.checkout.successUrl,
      cancel_url: options.cancelUrl || stripeConfig.checkout.cancelUrl,
      allow_promotion_codes: stripeConfig.checkout.allowPromotionCodes,
      subscription_data: {
        trial_period_days: plan.trialPeriodDays,
        metadata: {
          userId: String(userId), // Ensure it's a string
          planId: String(plan._id), // Ensure it's a string
        },
      },
      metadata: {
        userId: String(userId), // Ensure it's a string
        planId: String(plan._id), // Ensure it's a string
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    logger.error('Error creating checkout session:', error);
    throw new ApiError('Failed to create checkout session', 'CHECKOUT_SESSION_FAILED', 500);
  }
};

/**
 * Create billing portal session
 * @param {string} userId - User ID
 * @returns {Promise<object>}
 */
exports.createBillingPortalSession = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
  }

  const subscription = await exports.getCurrentSubscription(userId);
  if (!subscription) {
    throw new ApiError('No active subscription found', 'NO_ACTIVE_SUBSCRIPTION', 404);
  }

  try {
    // Get or create Stripe customer
    const customer = await exports.getOrCreateStripeCustomer(user);

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: stripeConfig.billingPortal.returnUrl,
    });

    return {
      url: session.url,
    };
  } catch (error) {
    logger.error('Error creating billing portal session:', error);
    throw new ApiError('Failed to create billing portal session', 'BILLING_PORTAL_FAILED', 500);
  }
};

/**
 * Update subscription plan
 * @param {string} userId - User ID
 * @param {string} newPlanId - New plan ID
 * @returns {Promise<UserSubscription>}
 */
exports.updateSubscription = async (userId, newPlanId) => {
  const currentSubscription = await exports.getCurrentSubscription(userId);
  
  if (!currentSubscription) {
    throw new ApiError('No active subscription found', 'NO_ACTIVE_SUBSCRIPTION', 404);
  }

  const newPlan = await exports.getSubscriptionPlan(newPlanId);
  
  // If it's the same plan, no need to update
  if (currentSubscription.subscriptionPlan._id.toString() === newPlanId) {
    return currentSubscription;
  }

  try {
    // Update Stripe subscription if it exists
    if (currentSubscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(currentSubscription.stripeSubscriptionId, {
        items: [
          {
            id: currentSubscription.stripeSubscriptionId,
            price: newPlan.stripePriceId,
          },
        ],
        proration_behavior: 'always_invoice',
      });
    }

    // Update local subscription
    currentSubscription.subscriptionPlan = newPlan._id;
    currentSubscription.stripePriceId = newPlan.stripePriceId;
    currentSubscription.priceAmount = newPlan.price;
    currentSubscription.billingInterval = newPlan.billingInterval;
    currentSubscription.billingIntervalCount = newPlan.billingIntervalCount;
    
    await currentSubscription.save();

    // Send notification
    await createNotification({
      userId,
      type: 'SUBSCRIPTION_UPDATED',
      title: 'Subscription Updated',
      message: `Your subscription has been updated to ${newPlan.name}`,
      actionUrl: '/profile/my-subscription'
    });

    return currentSubscription.populate('subscriptionPlan');
  } catch (error) {
    logger.error('Error updating subscription:', error);
    throw new ApiError('Failed to update subscription', 'SUBSCRIPTION_UPDATE_FAILED', 500);
  }
};

/**
 * Cancel subscription
 * @param {string} userId - User ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<UserSubscription>}
 */
exports.cancelSubscription = async (userId, reason = '') => {
  const subscription = await exports.getCurrentSubscription(userId);
  
  if (!subscription) {
    throw new ApiError('No active subscription found', 'NO_ACTIVE_SUBSCRIPTION', 404);
  }

  try {
    // Cancel Stripe subscription if it exists
    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    // Update local subscription
    subscription.cancelAtPeriodEnd = true;
    subscription.cancellationReason = reason;
    
    await subscription.save();

    // Send notification
    await createNotification({
      userId,
      type: 'SUBSCRIPTION_CANCELED',
      title: 'Subscription Canceled',
      message: 'Your subscription has been canceled and will end at the current period end',
      actionUrl: '/profile/my-subscription'
    });

    return subscription.populate('subscriptionPlan');
  } catch (error) {
    logger.error('Error canceling subscription:', error);
    throw new ApiError('Failed to cancel subscription', 'SUBSCRIPTION_CANCEL_FAILED', 500);
  }
};

/**
 * Resume canceled subscription
 * @param {string} userId - User ID
 * @returns {Promise<UserSubscription>}
 */
exports.resumeSubscription = async (userId) => {
  const subscription = await exports.getCurrentSubscription(userId);
  
  if (!subscription) {
    throw new ApiError('No active subscription found', 'NO_ACTIVE_SUBSCRIPTION', 404);
  }

  if (!subscription.cancelAtPeriodEnd) {
    throw new ApiError('Subscription is not canceled', 'SUBSCRIPTION_NOT_CANCELED', 400);
  }

  try {
    // Resume Stripe subscription if it exists
    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });
    }

    // Update local subscription
    subscription.cancelAtPeriodEnd = false;
    subscription.cancellationReason = '';
    subscription.resumedAt = new Date();
    
    await subscription.save();

    // Send notification
    await createNotification({
      userId,
      type: 'SUBSCRIPTION_RESUMED',
      title: 'Subscription Resumed',
      message: 'Your subscription has been resumed successfully',
      actionUrl: '/profile/my-subscription'
    });

    return subscription.populate('subscriptionPlan');
  } catch (error) {
    logger.error('Error resuming subscription:', error);
    throw new ApiError('Failed to resume subscription', 'SUBSCRIPTION_RESUME_FAILED', 500);
  }
};

/**
 * Handle expired trial subscriptions
 * @returns {Promise<void>}
 */
exports.handleExpiredTrials = async () => {
  try {
    const now = new Date();
    
    // Find all expired trial subscriptions
    const expiredTrials = await UserSubscription.find({
      status: 'trialing',
      trialEnd: { $lt: now },
    }).populate(['user', 'subscriptionPlan']);

    for (const subscription of expiredTrials) {
      // For free plans, expire the subscription
      if (subscription.subscriptionPlan.planType === 'free') {
        subscription.status = 'canceled';
        subscription.canceledAt = now;
        await subscription.save();

        // Create default free subscription
        await exports.createDefaultFreeSubscription(subscription.user._id);
      }
      
      // Send trial expired notification
      await createNotification({
        userId: subscription.user._id,
        type: 'TRIAL_EXPIRED',
        title: 'Trial Expired',
        message: 'Your trial period has ended. Please upgrade to continue using premium features.',
        actionUrl: '/profile/my-subscription'
      });
    }

    logger.info(`Processed ${expiredTrials.length} expired trial subscriptions`);
  } catch (error) {
    logger.error('Error handling expired trials:', error);
  }
};

/**
 * Create default free subscription for user
 * @param {string} userId - User ID
 * @returns {Promise<UserSubscription>}
 */
exports.createDefaultFreeSubscription = async (userId) => {
  // Find default free plan
  const freePlan = await SubscriptionPlan.findOne({
    planType: 'free',
    isActive: true,
    trialPeriodDays: 0,
  });

  if (!freePlan) {
    throw new ApiError('Default free plan not found', 'FREE_PLAN_NOT_FOUND', 404);
  }

  const now = new Date();
  const subscription = new UserSubscription({
    user: userId,
    subscriptionPlan: freePlan._id,
    status: 'active',
    currentPeriodStart: now,
    currentPeriodEnd: new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)), // 1 year
    priceAmount: freePlan.price,
    currency: freePlan.currency,
    billingInterval: freePlan.billingInterval,
    billingIntervalCount: freePlan.billingIntervalCount,
  });

  await subscription.save();
  return subscription.populate('subscriptionPlan');
};

/**
 * Get subscription analytics for admin
 * @param {object} options - Query options
 * @returns {Promise<object>}
 */
exports.getSubscriptionAnalytics = async (options = {}) => {
  const { startDate, endDate } = options;
  
  const matchQuery = {};
  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
    if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
  }

  const [
    totalSubscriptions,
    activeSubscriptions,
    canceledSubscriptions,
    trialSubscriptions,
    revenueAnalytics,
    planDistribution,
  ] = await Promise.all([
    UserSubscription.countDocuments(matchQuery),
    UserSubscription.countDocuments({ ...matchQuery, status: 'active' }),
    UserSubscription.countDocuments({ ...matchQuery, status: 'canceled' }),
    UserSubscription.countDocuments({ ...matchQuery, status: 'trialing' }),
    UserSubscription.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, totalRevenue: { $sum: '$priceAmount' } } },
    ]),
    UserSubscription.aggregate([
      { $match: matchQuery },
      { $lookup: { from: 'subscriptionplans', localField: 'subscriptionPlan', foreignField: '_id', as: 'plan' } },
      { $unwind: '$plan' },
      { $group: { _id: '$plan.name', count: { $sum: 1 } } },
    ]),
  ]);

  return {
    totalSubscriptions,
    activeSubscriptions,
    canceledSubscriptions,
    trialSubscriptions,
    totalRevenue: revenueAnalytics[0]?.totalRevenue || 0,
    planDistribution,
  };
};

module.exports = exports; 