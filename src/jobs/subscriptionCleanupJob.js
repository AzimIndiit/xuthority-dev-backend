const cron = require('node-cron');
const { UserSubscription } = require('../models');
const subscriptionService = require('../services/subscriptionService');
const logger = require('../config/logger');

/**
 * Check for expired subscriptions and downgrade to free plan
 */
const checkExpiredSubscriptions = async () => {
  try {
    logger.info('Starting expired subscription cleanup job...');
    
    const now = new Date();
    
    // Find subscriptions that have expired (currentPeriodEnd has passed)
    const expiredSubscriptions = await UserSubscription.find({
      status: { $in: ['active', 'trialing', 'past_due'] },
      currentPeriodEnd: { $lt: now },
      // Only check paid subscriptions (exclude free plans)
      stripeSubscriptionId: { $exists: true, $ne: null }
    }).populate(['subscriptionPlan', 'user']);

    logger.info(`Found ${expiredSubscriptions.length} expired subscriptions to process`);

    let downgradeCount = 0;
    let errorCount = 0;

    for (const subscription of expiredSubscriptions) {
      try {
        // Check if subscription plan is not free
        if (subscription.subscriptionPlan?.planType !== 'free') {
          logger.info(`Processing expired subscription for user ${subscription.user._id}: ${subscription.stripeSubscriptionId}`);
          
          // Mark the expired subscription as canceled first
          subscription.status = 'canceled';
          subscription.canceledAt = now;
          subscription.cancellationReason = 'Subscription expired - automatic cleanup';
          await subscription.save();

          // Downgrade to free plan
          await subscriptionService.downgradeToFreePlan(
            subscription.user._id,
            'subscription_expired',
            subscription
          );

          downgradeCount++;
          logger.info(`Successfully downgraded user ${subscription.user._id} from expired ${subscription.subscriptionPlan.name} subscription`);
        }
      } catch (error) {
        errorCount++;
        logger.error(`Failed to downgrade expired subscription for user ${subscription.user._id}:`, error);
      }
    }

    logger.info(`Expired subscription cleanup completed: ${downgradeCount} downgrades, ${errorCount} errors`);
    
    return { 
      processed: expiredSubscriptions.length,
      downgraded: downgradeCount,
      errors: errorCount 
    };

  } catch (error) {
    logger.error('Error in expired subscription cleanup job:', error);
    throw error;
  }
};

/**
 * Check for subscriptions past due for extended periods
 */
const checkOverduePastDueSubscriptions = async () => {
  try {
    logger.info('Checking for overdue past-due subscriptions...');
    
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Find subscriptions that have been past_due for more than 7 days
    const pastDueSubscriptions = await UserSubscription.find({
      status: 'past_due',
      updatedAt: { $lt: sevenDaysAgo },
      stripeSubscriptionId: { $exists: true, $ne: null }
    }).populate(['subscriptionPlan', 'user']);

    logger.info(`Found ${pastDueSubscriptions.length} overdue past-due subscriptions`);

    let downgradeCount = 0;

    for (const subscription of pastDueSubscriptions) {
      try {
        if (subscription.subscriptionPlan?.planType !== 'free') {
          // Check metadata for past_due_since date
          const pastDueSince = subscription.metadata?.get('past_due_since');
          if (pastDueSince) {
            const daysPastDue = Math.floor((new Date() - new Date(pastDueSince)) / (1000 * 60 * 60 * 24));
            
            if (daysPastDue >= 7) {
              logger.info(`Downgrading subscription past due for ${daysPastDue} days: user ${subscription.user._id}`);
              
              await subscriptionService.downgradeToFreePlan(
                subscription.user._id,
                'payment_failed',
                subscription
              );

              downgradeCount++;
            }
          }
        }
      } catch (error) {
        logger.error(`Failed to process past-due subscription for user ${subscription.user._id}:`, error);
      }
    }

    logger.info(`Past-due cleanup completed: ${downgradeCount} downgrades`);
    
    return { processed: pastDueSubscriptions.length, downgraded: downgradeCount };

  } catch (error) {
    logger.error('Error in past-due subscription cleanup:', error);
    throw error;
  }
};

/**
 * Start the subscription cleanup cron jobs
 */
const startSubscriptionCleanupJobs = () => {
  // Run expired subscription check every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('Running daily subscription cleanup job');
    try {
      await checkExpiredSubscriptions();
      await checkOverduePastDueSubscriptions();
    } catch (error) {
      logger.error('Daily subscription cleanup job failed:', error);
    }
  }, {
    timezone: 'UTC'
  });

  // Run past-due check every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Running past-due subscription check');
    try {
      await checkOverduePastDueSubscriptions();
    } catch (error) {
      logger.error('Past-due subscription check failed:', error);
    }
  }, {
    timezone: 'UTC'
  });

  logger.info('Subscription cleanup cron jobs started');
};

module.exports = {
  checkExpiredSubscriptions,
  checkOverduePastDueSubscriptions,
  startSubscriptionCleanupJobs
}; 