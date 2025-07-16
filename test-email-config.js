require('dotenv').config();
const emailService = require('./src/services/emailService');

async function testEmailConfiguration() {
  console.log('🔍 Testing Email Configuration...\n');
  
  // 1. Check environment variables
  console.log('📋 Environment Variables:');
  console.log('MAIL_USERNAME:', process.env.MAIL_USERNAME ? '✓ Set' : '❌ Missing');
  console.log('MAIL_PASSWORD:', process.env.MAIL_PASSWORD ? '✓ Set' : '❌ Missing');
  console.log('EMAIL_FROM_NAME:', process.env.EMAIL_FROM_NAME || 'Using default');
  console.log('SUPPORT_EMAIL:', process.env.SUPPORT_EMAIL || 'Using default');
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Using default');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
  
  // 2. Check if required variables are present
  if (!process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD) {
    console.log('\n❌ Missing required email configuration!');
    console.log('Please set MAIL_USERNAME and MAIL_PASSWORD in your .env file');
    console.log('\nExample .env file:');
    console.log('MAIL_USERNAME=your-gmail-address@gmail.com');
    console.log('MAIL_PASSWORD=your-16-character-app-password');
    console.log('EMAIL_FROM_NAME=Xuthority');
    console.log('SUPPORT_EMAIL=support@xuthority.com');
    return;
  }
  
  console.log('\n✅ Required environment variables are set');
  
  // 3. Test email service initialization
  console.log('\n🔧 Testing Email Service Initialization...');
  try {
    // Force re-initialization if needed
    emailService.initializeTransporter();
    console.log('✅ Email service initialized successfully');
  } catch (error) {
    console.log('❌ Email service initialization failed:', error.message);
    return;
  }
  
  // 4. Test email template rendering
  console.log('\n📄 Testing Email Template Rendering...');
  try {
    const testData = {
      userName: 'Test User',
      planName: 'Standard',
      planPrice: '$12.00/month',
      billingCycle: '1 month',
      nextBillingDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      }),
      isTrialing: false,
      trialDays: 0,
      trialEndDate: null,
      features: [
        'Enhanced branding and profile customization',
        'Advanced analytics and business insights'
      ],
      dashboardUrl: 'http://localhost:3001/',
      subscriptionUrl: 'http://localhost:3001/profile/my-subscription',
      currentYear: new Date().getFullYear(),
      supportEmail: 'support@xuthority.com',
      companyName: 'Xuthority Inc.',
      companyAddress: '123 Business St, Tech City, TC 12345'
    };
    
    const html = await emailService.renderTemplate('subscription-activated.ejs', testData);
    console.log('✅ Email template rendered successfully');
    console.log('Template length:', html.length, 'characters');
  } catch (error) {
    console.log('❌ Email template rendering failed:', error.message);
    return;
  }
  
  // 5. Offer to send test email
  console.log('\n📧 Test Email Sending');
  console.log('To test actual email sending, you can:');
  console.log('1. Use the API endpoint: POST /api/v1/subscription/test-email');
  console.log('2. Or run: node test-send-email.js your-email@example.com');
  
  console.log('\n✅ Email configuration appears to be working correctly!');
  console.log('\n🔍 Next Steps to Debug:');
  console.log('1. Check your server logs for webhook execution');
  console.log('2. Verify Stripe webhook is configured and firing');
  console.log('3. Test email sending with the /api/v1/subscription/test-email endpoint');
  console.log('4. Check Gmail spam folder');
  console.log('5. Verify Gmail app password is correct');
}

// Run the test
testEmailConfiguration().catch(console.error); 