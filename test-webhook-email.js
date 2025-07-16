require('dotenv').config();
const mongoose = require('mongoose');
const { User, SubscriptionPlan } = require('./src/models');
const emailService = require('./src/services/emailService');

async function testWebhookEmail() {
  const userEmail = process.argv[2];
  
  if (!userEmail) {
    console.log('Usage: node test-webhook-email.js user-email@example.com');
    process.exit(1);
  }
  
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Find user by email
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.log('❌ User not found with email:', userEmail);
      process.exit(1);
    }
    
    console.log('✅ Found user:', user.firstName, user.lastName);
    
    // Find a standard plan
    const plan = await SubscriptionPlan.findOne({ planType: 'standard' });
    if (!plan) {
      console.log('❌ No standard plan found');
      process.exit(1);
    }
    
    console.log('✅ Found plan:', plan.name);
    
    // Test the email sending logic (same as webhook)
    const planFeatures = plan.features || [
      'Enhanced branding and profile customization',
      'Advanced analytics and business insights',
      'Priority customer support', 
      'Unlimited product listings',
      'Lead generation and marketing tools'
    ];

    const actualCurrentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    const emailData = {
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'User',
      planName: plan.name,
      planPrice: `$${(plan.price / 100).toFixed(2)}/${plan.billingInterval}`,
      billingCycle: `${plan.billingIntervalCount} ${plan.billingInterval}${plan.billingIntervalCount > 1 ? 's' : ''}`,
      nextBillingDate: actualCurrentPeriodEnd.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      }),
      isTrialing: false,
      trialDays: plan.trialPeriodDays,
      trialEndDate: null,
      features: planFeatures
    };

    console.log('📧 Sending subscription activation email...');
    console.log('Email data:', {
      email: user.email,
      planName: emailData.planName,
      planPrice: emailData.planPrice,
      userName: emailData.userName
    });

    const emailResult = await emailService.sendSubscriptionActivatedEmail(user.email, emailData);
    
    console.log('✅ Email sent successfully!');
    console.log('📧 Email details:', {
      messageId: emailResult.messageId,
      response: emailResult.response
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testWebhookEmail().catch(console.error); 