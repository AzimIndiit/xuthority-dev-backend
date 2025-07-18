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
  
  // Check if user already has an active subscription (allow upgrades from free plans)
  const existingSubscription = await exports.getCurrentSubscription(userId);
  if (existingSubscription) {
    // Allow upgrade from free plans to paid plans
    const currentPlan = await exports.getSubscriptionPlan(existingSubscription.subscriptionPlan);
    if (currentPlan.planType !== 'free' && currentPlan.price > 0) {
      throw new ApiError('User already has an active paid subscription', 'SUBSCRIPTION_EXISTS', 400);
    }
    
    // If user has a free plan and wants to upgrade, cancel the free subscription first
    if (currentPlan.planType === 'free' && plan.planType !== 'free') {
      logger.info(`User ${userId} upgrading from free plan to ${plan.name}`);
      await UserSubscription.findByIdAndUpdate(existingSubscription._id, {
        status: 'canceled',
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
        metadata: new Map([
          ['cancellation_reason', 'Upgraded to paid plan'],
          ['upgrade_to_plan', plan.name]
        ])
      });
    }
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
  
  // Set lifetime validity for free plans - 100 years from now (effectively permanent)
  const lifetimeEnd = new Date();
  lifetimeEnd.setFullYear(lifetimeEnd.getFullYear() + 100);
  
  const subscription = new UserSubscription({
    user: userId,
    subscriptionPlan: plan._id,
    status: 'active', // Free plans are always active, no trial
    currentPeriodStart: now,
    currentPeriodEnd: lifetimeEnd, // Lifetime validity
    trialStart: null, // No trial for free plans
    trialEnd: null, // No trial for free plans
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
    let actualCurrentPeriodEnd;
    
    // For trial subscriptions, calculate the actual billing period end date
    if (stripeSubscription.trial_end && plan.trialPeriodDays > 0) {
      // The actual subscription billing period starts after the trial ends
      const trialEndDate = new Date(stripeSubscription.trial_end * 1000);
      
      // Calculate the subscription period end based on billing interval
      switch (plan.billingInterval) {
        case 'day':
          actualCurrentPeriodEnd = new Date(trialEndDate.getTime() + (plan.billingIntervalCount * 24 * 60 * 60 * 1000));
          break;
        case 'week':
          actualCurrentPeriodEnd = new Date(trialEndDate.getTime() + (plan.billingIntervalCount * 7 * 24 * 60 * 60 * 1000));
          break;
        case 'month':
          actualCurrentPeriodEnd = new Date(trialEndDate);
          actualCurrentPeriodEnd.setMonth(actualCurrentPeriodEnd.getMonth() + plan.billingIntervalCount);
          break;
        case 'year':
          actualCurrentPeriodEnd = new Date(trialEndDate);
          actualCurrentPeriodEnd.setFullYear(actualCurrentPeriodEnd.getFullYear() + plan.billingIntervalCount);
          break;
        default:
          actualCurrentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
      }
    } else {
      // For non-trial subscriptions, use Stripe's period end
      actualCurrentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
    }

    const subscription = new UserSubscription({
      user: userId,
      subscriptionPlan: plan._id,
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId: customer.id,
      stripePriceId: plan.stripePriceId,
      status: stripeSubscription.status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: actualCurrentPeriodEnd,
      trialStart: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : null,
      trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
      priceAmount: plan.price,
      currency: plan.currency,
      billingInterval: plan.billingInterval,
      billingIntervalCount: plan.billingIntervalCount,
      defaultPaymentMethod: stripeSubscription.default_payment_method,
    });

    await subscription.save();
    
    // Send activation email and notification (handle errors separately)
    try {
      if (user && user.email) {
        const planFeatures = plan.features || [
          'Enhanced branding and profile customization',
          'Advanced analytics and business insights',
          'Priority customer support', 
          'Unlimited product listings',
          'Lead generation and marketing tools'
        ];

        const emailData = {
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'User',
          planName: plan.name,
          planType: plan.planType,
          planPrice: `$${(plan.price / 100).toFixed(2)}/${plan.billingInterval}`,
          billingCycle: `${plan.billingIntervalCount} ${plan.billingInterval}${plan.billingIntervalCount > 1 ? 's' : ''}`,
          nextBillingDate: actualCurrentPeriodEnd.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
          }),
          isTrialing: subscription.status === 'trialing',
          trialDays: plan.trialPeriodDays,
          trialEndDate: subscription.trialEnd ? subscription.trialEnd.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : null,
          features: planFeatures
        };

        await emailService.sendSubscriptionActivatedEmail(user.email, emailData);
      }
    } catch (emailError) {
      console.error('Subscription activation email error (non-blocking):', emailError);
      // Continue even if email fails - subscription was created successfully
    }

    // Send notification
    try {
      await createNotification({
        userId,
        type: 'SUBSCRIPTION_ACTIVATED',
        title: 'Subscription Activated',
        message: `Your ${plan.name} subscription has been activated successfully.`,
        actionUrl: '/subscription'
      });
    } catch (notificationError) {
      console.error('Subscription activation notification error (non-blocking):', notificationError);
    }

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
  
  // Check if user already has an active subscription (allow upgrades from free plans)
  const existingSubscription = await exports.getCurrentSubscription(userId);
  if (existingSubscription) {
    // Allow upgrade from free plans to paid plans
    const currentPlan = await exports.getSubscriptionPlan(existingSubscription.subscriptionPlan);
    if (currentPlan.planType !== 'free' && currentPlan.price > 0) {
      throw new ApiError('User already has an active paid subscription', 'SUBSCRIPTION_EXISTS', 400);
    }
    
    // If user has a free plan and wants to upgrade, cancel the free subscription first
    if (currentPlan.planType === 'free' && plan.planType !== 'free') {
      logger.info(`User ${userId} upgrading from free plan to ${plan.name}`);
      await UserSubscription.findByIdAndUpdate(existingSubscription._id, {
        status: 'canceled',
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
        metadata: new Map([
          ['cancellation_reason', 'Upgraded to paid plan'],
          ['upgrade_to_plan', plan.name]
        ])
      });
    }
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

  // Validate that paid plan has Stripe integration
  if (!plan.stripePriceId) {
    logger.error('Plan missing Stripe price ID:', { 
      planId: plan._id, 
      planName: plan.name, 
      planType: plan.planType 
    });
    throw new ApiError('Plan is not configured for payments', 'PLAN_NOT_CONFIGURED', 400);
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
        ...(plan.trialPeriodDays > 0 && { trial_period_days: plan.trialPeriodDays }),
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
    logger.error('Plan details:', { 
      id: plan._id, 
      name: plan.name, 
      stripePriceId: plan.stripePriceId,
      planType: plan.planType 
    });
    throw new ApiError(`Failed to create checkout session: ${error.message}`, 'CHECKOUT_SESSION_FAILED', 500);
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
 * Cancel a user's subscription
 * @param {string} userId - User ID
 * @param {string} reason - Cancellation reason (optional)
 * @returns {Promise<UserSubscription>}
 */
exports.cancelSubscription = async (userId, reason = null) => {
  const subscription = await UserSubscription.findActiveSubscription(userId);
  
  if (!subscription) {
    throw new ApiError('No active subscription found', 'NO_ACTIVE_SUBSCRIPTION', 404);
  }

  try {
    // Cancel the Stripe subscription
    const stripeSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
      metadata: {
        cancellation_reason: reason || 'User requested cancellation',
        canceled_by: 'user'
      }
    });

    // Update local subscription record
    subscription.cancelAtPeriodEnd = true;
    subscription.canceledAt = new Date();
    subscription.cancelReason = reason;
    await subscription.save();

    // Get user and plan information for email
    const user = await require('../models/User').findById(userId);
    const plan = subscription.subscriptionPlan;

    // Send cancellation email (handle errors separately)
    try {
      if (user && user.email) {
        const emailData = {
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'User',
          planName: plan.name,
          canceledDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          accessUntilDate: subscription.currentPeriodEnd ? subscription.currentPeriodEnd.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : null,
          cancelReason: reason
        };

        await emailService.sendSubscriptionCanceledEmail(user.email, emailData);
      }
    } catch (emailError) {
      console.error('Subscription cancellation email error (non-blocking):', emailError);
    }

    // Send notification
    try {
      await createNotification({
        userId,
        type: 'SUBSCRIPTION_CANCELED',
        title: 'Subscription Canceled',
        message: subscription.currentPeriodEnd 
          ? `Your subscription has been canceled and will end on ${subscription.currentPeriodEnd.toLocaleDateString()}.`
          : 'Your subscription has been canceled.',
        actionUrl: '/subscription'
      });
    } catch (notificationError) {
      console.error('Subscription cancellation notification error (non-blocking):', notificationError);
    }

    return subscription.populate('subscriptionPlan');
    
  } catch (error) {
    if (error.type === 'StripeCardError' || error.type === 'StripeInvalidRequestError') {
      throw new ApiError('Failed to cancel subscription with payment provider', 'STRIPE_CANCELLATION_ERROR', 400);
    }
    
    if (error instanceof ApiError) throw error;
    
    logger.error('Error canceling subscription:', error);
    throw new ApiError('Failed to cancel subscription', 'CANCELLATION_ERROR', 500);
  }
};

/**
 * Reactivate a canceled subscription
 * @param {string} userId - User ID  
 * @returns {Promise<UserSubscription>}
 */
exports.reactivateSubscription = async (userId) => {
  logger.info('Looking for subscription to reactivate for user:', userId);
  
  // Check what subscriptions exist for this user
  const allUserSubscriptions = await UserSubscription.find({ user: userId });
  logger.info('All subscriptions for user:', allUserSubscriptions.map(s => ({
    id: s._id,
    status: s.status,
    cancelAtPeriodEnd: s.cancelAtPeriodEnd,
    stripeSubscriptionId: s.stripeSubscriptionId
  })));

  const subscription = await UserSubscription.findOne({
    user: userId,
    $or: [
      // Subscription scheduled for cancellation
      {
        status: { $in: ['active', 'trialing'] },
        cancelAtPeriodEnd: true
      },
      // Subscription already canceled but can be reactivated
      {
        status: 'canceled',
        canceledAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Within last 30 days
      }
    ]
  }).populate('subscriptionPlan');
  
  if (!subscription) {
    throw new ApiError('No subscription found that can be reactivated. Subscription must be either scheduled for cancellation or canceled within the last 30 days.', 'NO_REACTIVATABLE_SUBSCRIPTION', 404);
  }

  logger.info('Found subscription to reactivate:', {
    id: subscription._id,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    stripeSubscriptionId: subscription.stripeSubscriptionId
  });

  try {
    // First, verify the subscription exists in Stripe and get its current state
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
    
    logger.info('Stripe subscription current state:', {
      id: stripeSubscription.id,
      status: stripeSubscription.status,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      current_period_end: stripeSubscription.current_period_end
    });

    // Check if subscription is already active and not set to cancel
    if (stripeSubscription.status === 'active' && !stripeSubscription.cancel_at_period_end) {
      throw new ApiError('Subscription is already active and not scheduled for cancellation', 'SUBSCRIPTION_ALREADY_ACTIVE', 400);
    }

    let updatedStripeSubscription;

    // Handle different subscription states
    if (stripeSubscription.status === 'canceled') {
      // If subscription is fully canceled, create a new one
      logger.info('Subscription is fully canceled, creating new subscription');
      
      // Get user information for new subscription
      const user = await require('../models/User').findById(userId);
      if (!user) {
        throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
      }

      if (!user.stripeCustomerId) {
        throw new ApiError('User does not have a Stripe customer account. Please contact support.', 'NO_STRIPE_CUSTOMER', 400);
      }

      // Check if customer has valid payment methods
      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });

      const customer = await stripe.customers.retrieve(user.stripeCustomerId);

      if (!customer.default_source && !customer.invoice_settings.default_payment_method && paymentMethods.data.length === 0) {
        throw new ApiError(
          'No payment method found. Please add a payment method to reactivate your subscription.',
          'NO_PAYMENT_METHOD',
          400,
          {
            action: 'add_payment_method',
            message: 'You need to add a payment method before reactivating your subscription.',
            redirectUrl: '/subscription/payment-methods'
          }
        );
      }

      // Create new subscription with same plan
      const subscriptionParams = {
        customer: user.stripeCustomerId,
        items: [{
          price: subscription.subscriptionPlan.stripePriceId,
        }],
        metadata: {
          userId: userId,
          planId: subscription.subscriptionPlan._id.toString(),
          reactivated_from: subscription.stripeSubscriptionId,
          reactivated_at: new Date().toISOString(),
          reactivated_by: 'user'
        }
      };

      // If customer has a default payment method, use it
      if (customer.invoice_settings.default_payment_method) {
        subscriptionParams.default_payment_method = customer.invoice_settings.default_payment_method;
      } else if (paymentMethods.data.length > 0) {
        // Use the most recent payment method
        subscriptionParams.default_payment_method = paymentMethods.data[0].id;
      }

      updatedStripeSubscription = await stripe.subscriptions.create(subscriptionParams);

      // Update local subscription record with new Stripe subscription ID
      subscription.stripeSubscriptionId = updatedStripeSubscription.id;
      subscription.status = updatedStripeSubscription.status;
      subscription.currentPeriodStart = new Date(updatedStripeSubscription.current_period_start * 1000);
      subscription.currentPeriodEnd = new Date(updatedStripeSubscription.current_period_end * 1000);
      
    } else {
      // If subscription is just scheduled for cancellation, reactivate it
      logger.info('Subscription is scheduled for cancellation, reactivating');
      
      updatedStripeSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false,
        metadata: {
          reactivated_at: new Date().toISOString(),
          reactivated_by: 'user'
        }
      });
    }

    // Update local subscription record
    subscription.cancelAtPeriodEnd = false;
    subscription.canceledAt = null;
    subscription.cancelReason = null;
    subscription.status = updatedStripeSubscription.status;
    await subscription.save();

    // Get user information for email
    const user = await require('../models/User').findById(userId);
    const plan = subscription.subscriptionPlan;

    // Send reactivation email (handle errors separately)
    try {
      if (user && user.email) {
        const planFeatures = plan.features || [
          'Enhanced branding and profile customization',
          'Advanced analytics and business insights',
          'Priority customer support',
          'Unlimited product listings', 
          'Lead generation and marketing tools'
        ];

        const emailData = {
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'User',
          planName: plan.name,
          planPrice: `$${(plan.price / 100).toFixed(2)}/${plan.billingInterval}`,
          reactivatedDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          nextBillingDate: subscription.currentPeriodEnd ? subscription.currentPeriodEnd.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : null,
          billingCycle: `${plan.billingIntervalCount} ${plan.billingInterval}${plan.billingIntervalCount > 1 ? 's' : ''}`,
          features: planFeatures,
          wasDowntime: true // Since they're reactivating, there was some downtime
        };

        await emailService.sendSubscriptionReactivatedEmail(user.email, emailData);
      }
    } catch (emailError) {
      console.error('Subscription reactivation email error (non-blocking):', emailError);
    }

    // Send notification
    try {
      await createNotification({
        userId,
        type: 'SUBSCRIPTION_REACTIVATED',
        title: 'Subscription Reactivated',
        message: `Your ${plan.name} subscription has been reactivated successfully.`,
        actionUrl: '/subscription'
      });
    } catch (notificationError) {
      console.error('Subscription reactivation notification error (non-blocking):', notificationError);
    }

    return subscription;
    
  } catch (error) {
    logger.error('Stripe reactivation error details:', {
      type: error.type,
      code: error.code,
      message: error.message,
      stripeSubscriptionId: subscription?.stripeSubscriptionId,
      subscriptionStatus: subscription?.status,
      userId: userId
    });

    if (error.type === 'StripeCardError' || error.type === 'StripeInvalidRequestError') {
      // Provide more specific error message based on Stripe error
      let errorMessage = error.message || 'Failed to reactivate subscription with payment provider';
      let errorCode = 'STRIPE_REACTIVATION_ERROR';
      let details = {
        stripeError: error.code,
        stripeMessage: error.message
      };

      // Handle specific payment method related errors
      if (error.code === 'resource_missing' && error.message?.includes('payment')) {
        errorMessage = 'No payment method found. Please add a payment method to reactivate your subscription.';
        errorCode = 'NO_PAYMENT_METHOD';
        details.action = 'add_payment_method';
        details.redirectUrl = '/subscription/payment-methods';
      } else if (error.code === 'card_declined' || error.type === 'StripeCardError') {
        errorMessage = 'Your payment method was declined. Please update your payment method and try again.';
        errorCode = 'PAYMENT_DECLINED';
        details.action = 'update_payment_method';
        details.redirectUrl = '/subscription/payment-methods';
      }

      throw new ApiError(errorMessage, errorCode, 400, details);
    }
    
    if (error instanceof ApiError) throw error;
    
    logger.error('Error reactivating subscription:', error);
    throw new ApiError('Failed to reactivate subscription', 'REACTIVATION_ERROR', 500);
  }
};

/**
 * Create default free plan subscription for new vendors
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
exports.createDefaultFreeSubscription = async (userId) => {
  try {
    const user = await require('../models/User').findById(userId);
    if (!user) {
      throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Only create subscription for vendors
    if (user.role !== 'vendor') {
      logger.info(`Skipping free subscription creation for user ${userId} - not a vendor`);
      return null;
    }

    // Check if user already has a subscription
    const existingSubscription = await UserSubscription.findOne({ user: userId });
    if (existingSubscription) {
      logger.info(`User ${userId} already has a subscription, skipping free plan creation`);
      return existingSubscription;
    }

    // Find the free plan
    let freePlan = await require('../models/SubscriptionPlan').findOne({ 
      planType: 'free',
      isActive: true 
    });

    // Log if free plan is found

    // If no free plan exists, create a basic one
    if (!freePlan) {
      logger.warn('No active free plan found, creating a default one...');
      
      try {
        const SubscriptionPlan = require('../models/SubscriptionPlan');
        freePlan = await SubscriptionPlan.create({
          name: 'Free',
          description: 'Basic functionality for new vendors',
          planType: 'free',
          price: 0,
          currency: 'USD',
          billingInterval: 'month',
          billingIntervalCount: 1,
          trialPeriodDays: 0,
          features: [
            'Basic Product Listing',
            'Basic Analytics',
            'Standard Branding'
          ],
          maxProducts: 1,
          maxReviews: 5,
          maxDisputes: 1,
          isActive: true,
          isPopular: false,
          sortOrder: 0,
          displayOrder: 0
        });
        
        logger.info(`[DEBUG] Created default free plan:`, {
          id: freePlan._id,
          name: freePlan.name,
          planType: freePlan.planType
        });
      } catch (createError) {
        logger.error('[DEBUG] Failed to create default free plan:', createError);
        return null;
      }
    }

    // Create Stripe customer if not exists  
    const customer = await exports.getOrCreateStripeCustomer(user);

    // Create local subscription record (no Stripe subscription needed for free plan)
    // Set lifetime validity - 100 years from now (effectively permanent)
    const lifetimeEnd = new Date();
    lifetimeEnd.setFullYear(lifetimeEnd.getFullYear() + 100);

    // Create the UserSubscription record

    const subscription = await UserSubscription.create({
      user: userId,
      subscriptionPlan: freePlan._id,
      status: 'active',
      stripeCustomerId: customer.id,
      stripeSubscriptionId: null, // No Stripe subscription for free plans
      stripePriceId: null, // No Stripe price for free plans
      currentPeriodStart: new Date(),
      currentPeriodEnd: lifetimeEnd, // Lifetime validity
      cancelAtPeriodEnd: false,
      priceAmount: freePlan.price,
      currency: freePlan.currency,
      billingInterval: freePlan.billingInterval,
      billingIntervalCount: freePlan.billingIntervalCount
    });

    logger.info(`Successfully created free plan subscription for vendor: ${userId}`);

    // Send subscription activation email
    try {
      const emailData = {
        firstName: user.firstName,
        lastName: user.lastName,
        planName: freePlan.name,
        planType: freePlan.planType,
        planPrice: freePlan.formattedPrice,
        planFeatures: freePlan.features,
        currentPeriodStart: subscription.currentPeriodStart.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        currentPeriodEnd: 'Lifetime validity', // Special text for free plans
        trialEndDate: null, // No trial for free plans
        features: freePlan.features
      };

      await emailService.sendSubscriptionActivatedEmail(user.email, emailData);
    } catch (emailError) {
      logger.error('Free subscription activation email error (non-blocking):', emailError);
      // Continue even if email fails - subscription was created successfully
    }

    // Send notification about free plan
    try {
      await createNotification({
        userId,
        type: 'SUBSCRIPTION_STARTED',
        title: 'Free Plan Activated',
        message: 'Your free plan has been activated! Start adding your products and building your profile.',
        actionUrl: '/subscription'
      });
    } catch (notificationError) {
      logger.error('Failed to send free plan notification:', notificationError);
      // Don't throw error as subscription creation was successful
    }

    return subscription.populate('subscriptionPlan');

  } catch (error) {
    if (error instanceof ApiError) throw error;
    
    logger.error('Error creating default free subscription:', error);
    // Don't throw error to avoid breaking registration flow
    return null;
  }
};

/**
 * Downgrade user to free plan when standard plan fails/expires
 * @param {string} userId - User ID
 * @param {string} reason - Reason for downgrade ('payment_failed', 'subscription_expired', 'manual')
 * @param {Object} originalSubscription - Original subscription details
 * @returns {Promise<Object>}
 */
exports.downgradeToFreePlan = async (userId, reason = 'subscription_expired', originalSubscription = null) => {
  try {
    const user = await require('../models/User').findById(userId);
    if (!user) {
      throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Only create subscription for vendors
    if (user.role !== 'vendor') {
      logger.info(`Skipping free plan downgrade for user ${userId} - not a vendor`);
      return null;
    }

    // Cancel/deactivate existing subscription if it exists
    const existingSubscription = await UserSubscription.findOne({ 
      user: userId, 
      status: { $in: ['active', 'trialing', 'past_due'] } 
    });

    if (existingSubscription) {
      existingSubscription.status = 'canceled';
      existingSubscription.canceledAt = new Date();
      existingSubscription.cancellationReason = `Downgraded to free plan: ${reason}`;
      await existingSubscription.save();
      logger.info(`Deactivated existing subscription for user ${userId}`);
    }

    // Find the free plan
    const freePlan = await require('../models/SubscriptionPlan').findOne({ 
      planType: 'free',
      isActive: true 
    });

    if (!freePlan) {
      logger.error('No active free plan found, cannot downgrade user');
      throw new ApiError('No free plan available for downgrade', 'NO_FREE_PLAN', 500);
    }

    // Create Stripe customer if not exists
    const customer = await exports.getOrCreateStripeCustomer(user);

    // Create new free subscription
    const lifetimeEnd = new Date();
    lifetimeEnd.setFullYear(lifetimeEnd.getFullYear() + 100);

    const freeSubscription = await UserSubscription.create({
      user: userId,
      subscriptionPlan: freePlan._id,
      status: 'active',
      stripeCustomerId: customer.id,
      stripeSubscriptionId: null, // No Stripe subscription for free plans
      stripePriceId: null, // No Stripe price for free plans
      currentPeriodStart: new Date(),
      currentPeriodEnd: lifetimeEnd,
      cancelAtPeriodEnd: false,
      priceAmount: freePlan.price,
      currency: freePlan.currency,
      billingInterval: freePlan.billingInterval,
      billingIntervalCount: freePlan.billingIntervalCount,
      metadata: new Map([
        ['downgrade_reason', reason],
        ['downgrade_date', new Date().toISOString()],
        ['original_plan', originalSubscription?.subscriptionPlan?.name || 'Unknown']
      ])
    });

    logger.info(`Downgraded user ${userId} to free plan due to: ${reason}`);

    // Send downgrade email
    try {
      await emailService.sendSubscriptionDowngradeEmail(user.email, {
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'User',
        reason: reason,
        originalPlanName: originalSubscription?.subscriptionPlan?.name || 'Standard',
        downgradedDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        freePlanFeatures: freePlan.features,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@xuthority.com'
      });
    } catch (emailError) {
      logger.error('Failed to send downgrade email:', emailError);
      // Don't throw error as downgrade was successful
    }

    // Send notification
    try {
      const reasonMessages = {
        'payment_failed': 'Your payment failed and your subscription has been downgraded to the free plan.',
        'subscription_expired': 'Your subscription has expired and you have been moved to the free plan.',
        'manual': 'Your subscription has been downgraded to the free plan.'
      };

      await createNotification({
        userId,
        type: 'SUBSCRIPTION_DOWNGRADED',
        title: 'Subscription Downgraded',
        message: reasonMessages[reason] || reasonMessages['subscription_expired'],
        actionUrl: '/subscription'
      });
    } catch (notificationError) {
      logger.error('Failed to send downgrade notification:', notificationError);
      // Don't throw error as downgrade was successful
    }

    return freeSubscription.populate('subscriptionPlan');

  } catch (error) {
    if (error instanceof ApiError) throw error;
    
    logger.error('Error downgrading user to free plan:', error);
    throw new ApiError('Failed to downgrade to free plan', 'DOWNGRADE_ERROR', 500);
  }
};

/**
 * Create setup intent for adding payment method
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
exports.createPaymentMethodSetupIntent = async (userId) => {
  try {
    const user = await require('../models/User').findById(userId);
    if (!user) {
      throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
    }

    if (!user.stripeCustomerId) {
      throw new ApiError('User does not have a Stripe customer account', 'NO_STRIPE_CUSTOMER', 400);
    }

    // Create setup intent for future payments
    const setupIntent = await stripe.setupIntents.create({
      customer: user.stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        userId: userId,
        purpose: 'subscription_reactivation'
      }
    });

    return {
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id
    };

  } catch (error) {
    if (error instanceof ApiError) throw error;
    
    logger.error('Error creating payment method setup intent:', error);
    throw new ApiError('Failed to create payment method setup', 'SETUP_INTENT_ERROR', 500);
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