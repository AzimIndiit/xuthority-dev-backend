const logger = require('./logger');

// Stripe configuration
const stripeConfig = {
  // Stripe API keys
  secretKey: process.env.STRIPE_SECRET_KEY,
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  
  // Webhook configuration
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  
  // API version
  apiVersion: '2023-10-16',
  
  // App info
  appInfo: {
    name: 'Xuthority',
    version: '1.0.0',
    url: 'https://xuthority.com',
  },
  
  // Checkout session configuration
  checkout: {
    mode: 'subscription',
    successUrl: process.env.STRIPE_SUCCESS_URL || `${process.env.FRONTEND_URL}/profile/my-subscription?success=true`,
    cancelUrl: process.env.STRIPE_CANCEL_URL || `${process.env.FRONTEND_URL}/profile/my-subscription?canceled=true`,
    allowPromotionCodes: true,
  },
  
  // Billing portal configuration
  billingPortal: {
    returnUrl: process.env.STRIPE_RETURN_URL || `${process.env.FRONTEND_URL}/profile/my-subscription`,
  },
  
  // Tax configuration
  tax: {
    automaticTax: process.env.STRIPE_AUTOMATIC_TAX === 'true',
  },
  
  // Currency settings
  currency: process.env.STRIPE_CURRENCY || 'usd',
  
  // Trial period settings
  trialPeriodDays: {
    standard: 7,
    premium: 14,
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.error(`Missing required Stripe environment variables: ${missingEnvVars.join(', ')}`);
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required Stripe environment variables: ${missingEnvVars.join(', ')}`);
  }
}

// Initialize Stripe
let stripe;
if (stripeConfig.secretKey) {
  stripe = require('stripe')(stripeConfig.secretKey, {
    apiVersion: stripeConfig.apiVersion,
    appInfo: stripeConfig.appInfo,
  });
  
  logger.info('Stripe initialized successfully');
} else {
  logger.warn('Stripe not initialized - missing secret key');
}

module.exports = {
  stripeConfig,
  stripe,
}; 