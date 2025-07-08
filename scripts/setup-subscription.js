#!/usr/bin/env node

/**
 * Subscription System Setup Script
 * 
 * This script sets up the subscription system by:
 * - Validating Stripe environment variables
 * - Creating subscription plans in database
 * - Creating Stripe products and prices
 * - Providing setup instructions
 * 
 * Usage:
 *   node scripts/setup-subscription.js
 *   npm run setup:subscription
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Import seeders
const { seedSubscriptionPlans } = require('../src/database/seeds/subscriptionPlanSeeder');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xuthority-dev';

/**
 * Check if Stripe environment variables are configured
 */
const checkStripeConfiguration = () => {
  console.log('🔍 Checking Stripe configuration...');
  
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('⚠️  Missing Stripe environment variables:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    
    console.log('\n📝 Please add these to your .env file:');
    console.log('STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here');
    console.log('STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here');
    console.log('STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here');
    console.log('FRONTEND_URL=http://localhost:3000');
    
    console.log('\n📖 To get these values:');
    console.log('1. Sign up at https://stripe.com');
    console.log('2. Go to Developers > API keys for secret/publishable keys');
    console.log('3. Go to Developers > Webhooks to create webhook and get secret');
    console.log('4. Set webhook URL to: http://localhost:8081/api/v1/subscription/webhook');
    
    return false;
  }
  
  console.log('✅ Stripe configuration looks good!');
  return true;
};

/**
 * Display setup instructions
 */
const displaySetupInstructions = () => {
  console.log('\n' + '='.repeat(60));
  console.log('🎉 SUBSCRIPTION SYSTEM SETUP COMPLETE!');
  console.log('='.repeat(60));
  
  console.log('\n📋 Next Steps:');
  console.log('1. Start your development server:');
  console.log('   npm run dev');
  
  console.log('\n2. Test the subscription endpoints:');
  console.log('   GET  http://localhost:8081/api/v1/subscription/plans');
  console.log('   GET  http://localhost:8081/api/v1/subscription/current');
  
  console.log('\n3. Set up Stripe webhooks:');
  console.log('   - Go to Stripe Dashboard > Developers > Webhooks');
  console.log('   - Add endpoint: http://localhost:8081/api/v1/subscription/webhook');
  console.log('   - Select these events:');
  console.log('     • checkout.session.completed');
  console.log('     • customer.subscription.created');
  console.log('     • customer.subscription.updated');
  console.log('     • customer.subscription.deleted');
  console.log('     • invoice.payment_succeeded');
  console.log('     • invoice.payment_failed');
  console.log('     • customer.subscription.trial_will_end');
  
  console.log('\n4. Test subscription flow:');
  console.log('   - Visit frontend: http://localhost:3000/profile/my-subscription');
  console.log('   - Try subscribing to Standard plan');
  console.log('   - Use Stripe test card: 4242 4242 4242 4242');
  
  console.log('\n📚 Documentation:');
  console.log('   - Setup guide: docs/SUBSCRIPTION_SETUP.md');
  console.log('   - API docs: http://localhost:8081/api-docs (when server is running)');
  
  console.log('\n🎯 Available Plans:');
  console.log('   - Basic (Free): 7-day trial with basic features');
  console.log('   - Standard ($12/month): 7-day trial with enhanced features');
  console.log('   - Free (Permanent): Limited features, no trial');
  
  console.log('\n' + '='.repeat(60));
};

/**
 * Main setup function
 */
const main = async () => {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Setting up Subscription System...');
    console.log(`📅 ${new Date().toISOString()}`);
    
    // Check Stripe configuration
    const stripeConfigured = checkStripeConfiguration();
    
    // Connect to database
    console.log('\n🔌 Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Seed subscription plans
    console.log('\n🌱 Creating subscription plans...');
    const plans = await seedSubscriptionPlans();
    
    console.log(`✅ Created ${plans.length} subscription plans`);
    
    // Display results
    plans.forEach(plan => {
      const stripeInfo = plan.stripePriceId ? ` (Stripe: ${plan.stripePriceId})` : '';
      console.log(`   - ${plan.name}: ${plan.formattedPrice}/${plan.billingPeriodText}${stripeInfo}`);
    });
    
    const totalDuration = Date.now() - startTime;
    console.log(`\n⏱️  Setup completed in ${totalDuration}ms`);
    
    // Display setup instructions
    displaySetupInstructions();
    
    if (!stripeConfigured) {
      console.log('\n⚠️  Note: Some Stripe environment variables are missing.');
      console.log('Standard plan will be created in database only until Stripe is configured.');
    }
    
  } catch (error) {
    console.error('\n💥 Setup failed:', error);
    
    if (error.message.includes('connect') && error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Tip: Make sure MongoDB is running:');
      console.log('   - Using MongoDB Atlas: Check your connection string');
      console.log('   - Using local MongoDB: Run `mongod` command');
    }
    
    process.exit(1);
  } finally {
    // Close database connection
    try {
      await mongoose.connection.close();
      console.log('\n🔌 Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }
};

/**
 * Handle graceful shutdown
 */
process.on('SIGINT', async () => {
  console.log('\n⚠️  Received SIGINT. Gracefully shutting down...');
  try {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled rejection:', error);
  process.exit(1);
});

// Run the setup script
if (require.main === module) {
  main();
}

module.exports = {
  main,
  checkStripeConfiguration,
}; 