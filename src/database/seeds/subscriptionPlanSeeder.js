const { SubscriptionPlan } = require('../../models');
const logger = require('../../config/logger');
const { stripe } = require('../../config/stripe');

/**
 * Create Stripe product and price for a subscription plan
 */
const createStripeProductAndPrice = async (planData) => {
  try {
    // Create Stripe product
    const product = await stripe.products.create({
      name: planData.name,
      description: planData.description,
      metadata: {
        planType: planData.planType,
      },
    });

    // Create Stripe price
    const price = await stripe.prices.create({
      unit_amount: Math.round(planData.price * 100), // Convert to cents
      currency: planData.currency.toLowerCase(),
      recurring: {
        interval: planData.billingInterval,
        interval_count: planData.billingIntervalCount,
        trial_period_days: planData.trialPeriodDays,
      },
      product: product.id,
      metadata: {
        planType: planData.planType,
      },
    });

    logger.info(`Created Stripe product: ${product.id} and price: ${price.id} for ${planData.name}`);

    return {
      stripeProductId: product.id,
      stripePriceId: price.id,
    };
  } catch (error) {
    logger.error(`Error creating Stripe product/price for ${planData.name}:`, error);
    throw error;
  }
};

/**
 * Subscription plans configuration
 */
const getSubscriptionPlansConfig = () => [
  {
    name: 'Basic',
    description: 'Collaborate and optimize your team processes',
    planType: 'free',
    price: 0,
    currency: 'USD',
    billingInterval: 'month',
    billingIntervalCount: 1,
    trialPeriodDays: 7,
    features: [
      'Basic Product Listing',
      'Basic Analytics',
      'Standard Branding',
      'Review Response'
    ],
    stripePriceId: null, // No Stripe for free plans
    stripeProductId: null,
    maxProducts: 1,
    maxReviews: -1, // Unlimited
    maxDisputes: -1, // Unlimited
    isActive: true,
    isPopular: false,
    sortOrder: 1,
    displayOrder: 1,
    needsStripe: false, // This plan doesn't need Stripe
  },
  {
    name: 'Standard',
    description: 'Collaborate and optimize your team processes',
    planType: 'standard',
    price: 12.00,
    currency: 'USD',
    billingInterval: 'month',
    billingIntervalCount: 1,
    trialPeriodDays: 7,
    features: [
      'Enhanced branding',
      'Advanced analytics.',
      'Review management.',
      'Dispute management.'
    ],
    stripePriceId: null, // Will be set after Stripe creation
    stripeProductId: null, // Will be set after Stripe creation
    maxProducts: -1, // Unlimited
    maxReviews: -1, // Unlimited
    maxDisputes: -1, // Unlimited
    isActive: true,
    isPopular: true,
    sortOrder: 2,
    displayOrder: 2,
    needsStripe: true, // This plan needs Stripe
  },
  {
    name: 'Free',
    description: 'Basic functionality for new users',
    planType: 'free',
    price: 0,
    currency: 'USD',
    billingInterval: 'month',
    billingIntervalCount: 1,
    trialPeriodDays: 0, // No trial for permanent free plan
    features: [
      'Limited Product Listing',
      'Basic Analytics',
      'Standard Branding'
    ],
    stripePriceId: null,
    stripeProductId: null,
    maxProducts: 1,
    maxReviews: 5,
    maxDisputes: 1,
    isActive: true,
    isPopular: false,
    sortOrder: 0,
    displayOrder: 0,
    needsStripe: false, // This plan doesn't need Stripe
  }
];

/**
 * Seed subscription plans
 */
const seedSubscriptionPlans = async (adminUserId = null) => {
  try {
    logger.info('Starting subscription plans seeding...');
    
    const subscriptionPlans = getSubscriptionPlansConfig();
    const createdPlans = [];
    
    // Process each plan
    for (const planData of subscriptionPlans) {
      try {
        // Check if plan already exists
        const existingPlan = await SubscriptionPlan.findOne({ 
          name: planData.name,
          planType: planData.planType 
        });
        
        if (existingPlan) {
          logger.info(`Subscription plan already exists: ${planData.name}`);
          createdPlans.push(existingPlan);
          continue;
        }
        
        // Create Stripe product/price if needed
        if (planData.needsStripe && stripe) {
          try {
            const stripeData = await createStripeProductAndPrice(planData);
            planData.stripeProductId = stripeData.stripeProductId;
            planData.stripePriceId = stripeData.stripePriceId;
            
            logger.info(`Created Stripe resources for ${planData.name}`);
          } catch (stripeError) {
            logger.warn(`Failed to create Stripe resources for ${planData.name}. Continuing without Stripe integration.`);
            logger.warn('Error:', stripeError.message);
            // Continue without Stripe - the plan will be created but won't have Stripe integration
          }
        }
        
        // Remove internal flags before saving to database
        const { needsStripe, ...planDataToSave } = planData;
        
        // Create database record
        const plan = await SubscriptionPlan.create(planDataToSave);
        createdPlans.push(plan);
        
        logger.info(`Created subscription plan: ${plan.name} (${plan.planType})`);
        
      } catch (error) {
        logger.error(`Error creating subscription plan ${planData.name}:`, error);
        // Continue with other plans even if one fails
      }
    }
    
    logger.info(`Subscription plans seeding completed. Created ${createdPlans.length} plans.`);
    
    // Log summary
    const plans = await SubscriptionPlan.find({}).sort({ sortOrder: 1 });
    logger.info(`Total subscription plans in database: ${plans.length}`);
    
    plans.forEach(plan => {
      const stripeInfo = plan.stripePriceId ? ` (Stripe: ${plan.stripePriceId})` : '';
      logger.info(`- ${plan.name} (${plan.planType}): ${plan.formattedPrice}/${plan.billingPeriodText}${stripeInfo}`);
    });
    
    return createdPlans;
    
  } catch (error) {
    logger.error('Error seeding subscription plans:', error);
    throw error;
  }
};

/**
 * Clean up subscription plans and associated Stripe resources
 */
const cleanupSubscriptionPlans = async () => {
  try {
    logger.info('Cleaning up subscription plans...');
    
    // Get all plans with Stripe resources
    const plansWithStripe = await SubscriptionPlan.find({
      $or: [
        { stripePriceId: { $ne: null } },
        { stripeProductId: { $ne: null } }
      ]
    });
    
    // Clean up Stripe resources
    for (const plan of plansWithStripe) {
      try {
        if (plan.stripePriceId && stripe) {
          // Archive the price (can't delete prices in Stripe)
          await stripe.prices.update(plan.stripePriceId, { active: false });
          logger.info(`Archived Stripe price: ${plan.stripePriceId}`);
        }
        
        if (plan.stripeProductId && stripe) {
          // Archive the product
          await stripe.products.update(plan.stripeProductId, { active: false });
          logger.info(`Archived Stripe product: ${plan.stripeProductId}`);
        }
      } catch (stripeError) {
        logger.warn(`Failed to cleanup Stripe resources for ${plan.name}:`, stripeError.message);
      }
    }
    
    // Delete from database
    await SubscriptionPlan.deleteMany({});
    logger.info('Cleaned up all subscription plans from database');
    
  } catch (error) {
    logger.error('Error cleaning up subscription plans:', error);
    throw error;
  }
};

/**
 * Get or create default free plan for users
 */
const getDefaultFreePlan = async () => {
  try {
    let freePlan = await SubscriptionPlan.findOne({
      planType: 'free',
      name: 'Free',
      trialPeriodDays: 0,
      isActive: true,
    });
    
    if (!freePlan) {
      logger.warn('Default free plan not found, creating one...');
      const freePlanConfig = getSubscriptionPlansConfig().find(p => p.name === 'Free');
      const { needsStripe, ...planData } = freePlanConfig;
      freePlan = await SubscriptionPlan.create(planData);
      logger.info('Created default free plan');
    }
    
    return freePlan;
  } catch (error) {
    logger.error('Error getting/creating default free plan:', error);
    throw error;
  }
};

module.exports = {
  seedSubscriptionPlans,
  cleanupSubscriptionPlans,
  getDefaultFreePlan,
  getSubscriptionPlansConfig,
}; 