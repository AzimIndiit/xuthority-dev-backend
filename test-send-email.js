require('dotenv').config();
const emailService = require('./src/services/emailService');

async function sendTestEmail() {
  const testEmail = process.argv[2];
  
  if (!testEmail) {
    console.log('Usage: node test-send-email.js your-email@example.com');
    process.exit(1);
  }
  
  console.log(`📧 Sending test subscription activation email to: ${testEmail}`);
  
  try {
    // Test subscription activation email
    const emailData = {
      userName: 'Test User',
      planName: 'Standard (Test)',
      planPrice: '$12.00/month',
      billingCycle: '1 month',
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      }),
      isTrialing: false,
      trialDays: 0,
      trialEndDate: null,
      features: [
        'Enhanced branding and profile customization',
        'Advanced analytics and business insights',
        'Priority customer support', 
        'Unlimited product listings',
        'Lead generation and marketing tools'
      ]
    };

    console.log('📄 Email data:', {
      email: testEmail,
      planName: emailData.planName,
      planPrice: emailData.planPrice,
      userName: emailData.userName
    });

    const result = await emailService.sendSubscriptionActivatedEmail(testEmail, emailData);
    
    console.log('✅ Test email sent successfully!');
    console.log('📧 Email details:', {
      messageId: result.messageId,
      response: result.response
    });
    
    console.log('\n🔍 If you didn\'t receive the email, check:');
    console.log('1. Spam/junk folder');
    console.log('2. Gmail app password is correct');
    console.log('3. 2FA is enabled on your Gmail account');
    console.log('4. Server logs for any errors');

  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    console.error('Full error:', error);
    
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check your .env file has MAIL_USERNAME and MAIL_PASSWORD');
    console.log('2. Verify Gmail app password (not regular password)');
    console.log('3. Ensure 2FA is enabled on Gmail');
    console.log('4. Check network connectivity');
  }
}

sendTestEmail().catch(console.error); 