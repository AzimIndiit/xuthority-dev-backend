const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
const config = require('../config');
const logger = require('../config/logger');

class EmailService {
  constructor() {
    // Don't initialize transporter in test environment
    if (process.env.NODE_ENV !== 'test') {
      this.initializeTransporter();
    }
  }

  initializeTransporter() {
    try {
             // Configure Nodemailer with Gmail
       this.transporter = nodemailer.createTransport({
         service: "gmail",
         auth: {
           user: config?.email?.gmail?.auth?.user || process.env.MAIL_USERNAME,
           pass: config?.email?.gmail?.auth?.pass || process.env.MAIL_PASSWORD,
         },
       });

      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('Email service configuration error:', error);
        } else {
          logger.info('Email service is ready to send messages');
        }
      });

    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  /**
   * Render EJS template with data
   * @param {string} templatePath - Path to the EJS template
   * @param {object} data - Data to render in template
   * @returns {Promise<string>} - Rendered HTML
   */
  async renderTemplate(templatePath, data) {
    try {
      const fullPath = path.join(__dirname, '..', 'templates', 'emails', templatePath);
      const html = await ejs.renderFile(fullPath, data);
      return html;
    } catch (error) {
      logger.error('Error rendering email template:', error);
      throw new Error('Failed to render email template');
    }
  }

  /**
   * Send email using template
   * @param {object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.template - Template filename
   * @param {object} options.data - Template data
   * @returns {Promise<object>} - Email send result
   */
  async sendTemplatedEmail(options) {
    try {
      const { to, subject, template, data } = options;

      // In test environment, just log and return mock response
      if (process.env.NODE_ENV === 'test') {
        console.log(`[TEST] Email would be sent to: ${to} with subject: ${subject}`);
        return {
          success: true,
          messageId: 'test-message-id',
          response: 'Email sent successfully (test mode)'
        };
      }

      // Ensure transporter is initialized
      if (!this.transporter) {
        this.initializeTransporter();
      }

      // Render the email template
      const html = await this.renderTemplate(template, {
        ...data,
        companyName: config?.app?.companyName || 'Xuthority Inc.',
        companyAddress: config?.app?.companyAddress || '123 Business St, Tech City, TC 12345',
        supportEmail: config?.email?.supportEmail || 'support@xuthority.com',
        frontendUrl: config?.app?.frontendUrl || 'http://localhost:3001'
      });

      // Email options
      const mailOptions = {
        from: `"${config?.email?.fromName || 'Xuthority'}" <${config?.email?.fromEmail || process.env.MAIL_USERNAME}>`,
        to,
        subject,
        html,
        // Add plain text version
        text: data.message || 'Please view this email in HTML format'
      };

      // Send email
      const result = await this.transporter.sendMail(mailOptions);

      logger.info(`Email sent successfully to ${to}`, {
        messageId: result.messageId,
        response: result.response
      });

      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };

    } catch (error) {
      logger.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @param {string} resetToken - Password reset token
   * @param {string} userName - User's name
   * @returns {Promise<object>} - Email send result
   */
  async sendPasswordResetEmail(email, resetToken, userName) {
    try {
      const frontendUrl = config?.app?.frontendUrl || 'http://localhost:3001';
      const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

      const templateData = {
        userName: userName || 'User',
        email: email,
        resetUrl,
        resetToken,
        expirationTime: '1 hour',
        appName: config?.app?.name || 'Xuthority',
        currentYear: new Date().getFullYear(),
        message: `You have requested a password reset for your account. Click the link below to reset your password. This link will expire in 1 hour.`
      };

      return await this.sendTemplatedEmail({
        to: email,
        subject: `Password Reset Request - ${config?.app?.name || 'Xuthority'}`,
        template: 'forgot-password.ejs',
        data: templateData
      });

    } catch (error) {
      logger.error('Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Send password change confirmation email
   * @param {string} email - User email
   * @param {string} userName - User's name
   * @returns {Promise<object>} - Email send result
   */
  async sendPasswordChangeConfirmation(email, userName) {
    try {
      const templateData = {
        userName: userName || 'User',
        changeDate: new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        }),
        message: 'Your password has been successfully changed. If you did not make this change, please contact our support team immediately.',
        loginUrl: `${config?.app?.frontendUrl || 'http://localhost:3001'}/login`,
        currentYear: new Date().getFullYear()
      };

      return await this.sendTemplatedEmail({
        to: email,
        subject: `Password Changed - ${config?.app?.name || 'Xuthority'}`,
        template: 'password-changed.ejs',
        data: templateData
      });

    } catch (error) {
      logger.error('Error sending password change confirmation email:', error);
      throw error;
    }
  }

  /**
   * Send welcome email to new users
   * @param {string} email - User email
   * @param {string} userName - User's name
   * @returns {Promise<object>} - Email send result
   */
  async sendWelcomeEmail(email, userName) {
    try {
      const templateData = {
        userName: userName || 'User',
        message: 'Welcome to our platform! We\'re excited to have you on board.',
        loginUrl: `${config?.app?.frontendUrl || 'http://localhost:3001'}/`,
        dashboardUrl: `${config?.app?.frontendUrl || 'http://localhost:3001'}/`,
        currentYear: new Date().getFullYear()
      };

      return await this.sendTemplatedEmail({
        to: email,
        subject: `Welcome to ${config?.app?.name || 'Xuthority'}!`,
        template: 'welcome.ejs',
        data: templateData
      });

    } catch (error) {
      logger.error('Error sending welcome email:', error);
      throw error;
    }
  }

  async sendReviewVerificationOTP(email, otp) {
    try {
     

      await this.sendTemplatedEmail({
        to: email,
        subject: 'Review Verification OTP',
        template: 'review-verification-otp.ejs',
        data: { otp }
      });
    } catch (error) {
      logger.error('Error sending review verification OTP email:', error);
      throw new Error('Failed to send review verification OTP email');
    }
  }

  /**
   * Send dispute explanation email
   * @param {string} email - Recipient email
   * @param {object} disputeData - Dispute data
   * @returns {Promise<object>} - Email send result
   */
  async sendDisputeExplanationEmail(email, disputeData) {
    try {
      const {
        userName,
        authorName,
        explanationContent,
        reviewTitle,
        productName,
        disputeId,
        disputeUrl
      } = disputeData;

      const templateData = {
        userName: userName || 'User',
        authorName: authorName || 'Someone',
        explanationContent,
        reviewTitle: reviewTitle || 'Review',
        productName: productName || 'Product',
        disputeId,
        disputeUrl,
        currentDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        }),
        currentYear: new Date().getFullYear()
      };

      return await this.sendTemplatedEmail({
        to: email,
        subject: `New Explanation Added to Dispute #${disputeId} - ${config?.app?.name || 'Xuthority'}`,
        template: 'dispute-explanation.ejs',
        data: templateData
      });

    } catch (error) {
      logger.error('Error sending dispute explanation email:', error);
      throw new Error('Failed to send dispute explanation email');
    }
  }

  /**
   * Send dispute explanation update email
   * @param {string} email - Recipient email
   * @param {object} disputeData - Dispute data
   * @returns {Promise<object>} - Email send result
   */
  async sendDisputeExplanationUpdateEmail(email, disputeData) {
    try {
      const {
        userName,
        authorName,
        explanationContent,
        reviewTitle,
        productName,
        disputeId,
        disputeUrl
      } = disputeData;

      const templateData = {
        userName: userName || 'User',
        authorName: authorName || 'Someone',
        explanationContent,
        reviewTitle: reviewTitle || 'Review',
        productName: productName || 'Product',
        disputeId,
        disputeUrl,
        currentDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        }),
        currentYear: new Date().getFullYear()
      };

      return await this.sendTemplatedEmail({
        to: email,
        subject: `Explanation Updated in Dispute #${disputeId} - ${config?.app?.name || 'Xuthority'}`,
        template: 'dispute-explanation.ejs',
        data: templateData
      });

    } catch (error) {
      logger.error('Error sending dispute explanation update email:', error);
      throw new Error('Failed to send dispute explanation update email');
    }
  }

  /**
   * Send dispute status update email
   * @param {string} email - Recipient email
   * @param {object} disputeData - Dispute status update data
   * @returns {Promise<object>} - Email send result
   */
  async sendDisputeStatusUpdateEmail(email, disputeData) {
    try {
      const {
        userName,
        disputeId,
        productName,
        reviewTitle,
        oldStatus,
        newStatus,
        updatedBy,
        createdDate,
        disputeUrl
      } = disputeData;

      // Define status-specific styling and messages
      const statusConfig = {
        'active': {
          color: '#28a745',
          backgroundColor: '#d4edda',
          textColor: '#155724',
          icon: '🔍',
          message: 'Dispute is now under active review and investigation.'
        },
        'resolved': {
          color: '#007bff',
          backgroundColor: '#d1ecf1',
          textColor: '#0c5460',
          icon: '✅',
          message: 'Dispute has been resolved. Thank you for your patience.'
        },
        'pending': {
          color: '#ffc107',
          backgroundColor: '#fff3cd',
          textColor: '#856404',
          icon: '⏳',
          message: 'Dispute is pending review and will be addressed soon.'
        }
      };

      const config = statusConfig[newStatus] || statusConfig['pending'];

      const templateData = {
        userName: userName || 'User',
        disputeId,
        productName: productName || 'Product',
        reviewTitle: reviewTitle || 'Review',
        oldStatus: oldStatus || 'Unknown',
        newStatus,
        updatedBy,
        createdDate,
        updatedDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        }),
        disputeUrl,
        statusColor: config.color,
        statusBackgroundColor: config.backgroundColor,
        statusTextColor: config.textColor,
        statusIcon: config.icon,
        statusMessage: config.message,
        currentYear: new Date().getFullYear()
      };

      return await this.sendTemplatedEmail({
        to: email,
        subject: `Dispute Status Update #${disputeId} - ${config.icon} ${newStatus.toUpperCase()} - ${config?.app?.name || 'Xuthority'}`,
        template: 'dispute-status-update.ejs',
        data: templateData
      });

    } catch (error) {
      logger.error('Error sending dispute status update email:', error);
      throw new Error('Failed to send dispute status update email');
    }
  }

  /**
   * Send subscription activated email
   * @param {string} email - User email
   * @param {object} subscriptionData - Subscription data
   * @returns {Promise<object>} - Email send result
   */
  async sendSubscriptionActivatedEmail(email, subscriptionData) {
    try {
      const {
        userName,
        planName,
        planPrice,
        billingCycle,
        nextBillingDate,
        isTrialing,
        trialDays,
        trialEndDate,
        features
      } = subscriptionData;

      const templateData = {
        userName: userName || 'User',
        planName,
        planPrice,
        billingCycle,
        nextBillingDate,
        isTrialing: isTrialing || false,
        trialDays: trialDays || 0,
        trialEndDate,
        features: features || [
          'Enhanced branding and profile customization',
          'Advanced analytics and business insights', 
          'Priority customer support',
          'Unlimited product listings',
          'Lead generation and marketing tools'
        ],
        dashboardUrl: `${config?.app?.frontendUrl || 'http://localhost:3001'}/`,
        subscriptionUrl: `${config?.app?.frontendUrl || 'http://localhost:3001'}/profile/my-subscription`,
        currentYear: new Date().getFullYear()
      };

      return await this.sendTemplatedEmail({
        to: email,
        subject: `Subscription Activated - Welcome to ${planName}! - ${config?.app?.name || 'Xuthority'}`,
        template: 'subscription-activated.ejs',
        data: templateData
      });

    } catch (error) {
      logger.error('Error sending subscription activated email:', error);
      throw new Error('Failed to send subscription activated email');
    }
  }

  /**
   * Send subscription canceled email
   * @param {string} email - User email
   * @param {object} subscriptionData - Subscription data
   * @returns {Promise<object>} - Email send result
   */
  async sendSubscriptionCanceledEmail(email, subscriptionData) {
    try {
      const {
        userName,
        planName,
        canceledDate,
        accessUntilDate,
        cancelReason
      } = subscriptionData;

      const templateData = {
        userName: userName || 'User',
        planName,
        canceledDate,
        accessUntilDate,
        cancelReason,
        dashboardUrl: `${config?.app?.frontendUrl || 'http://localhost:3001'}/`,
        reactivateUrl: `${config?.app?.frontendUrl || 'http://localhost:3001'}/profile/my-subscription`,
        currentYear: new Date().getFullYear()
      };

      return await this.sendTemplatedEmail({
        to: email,
        subject: `Subscription Canceled - ${config?.app?.name || 'Xuthority'}`,
        template: 'subscription-canceled.ejs',
        data: templateData
      });

    } catch (error) {
      logger.error('Error sending subscription canceled email:', error);
      throw new Error('Failed to send subscription canceled email');
    }
  }

  /**
   * Send subscription expired email
   * @param {string} email - User email
   * @param {object} subscriptionData - Subscription data
   * @returns {Promise<object>} - Email send result
   */
  async sendSubscriptionExpiredEmail(email, subscriptionData) {
    try {
      const {
        userName,
        planName,
        expiredDate,
        reasonForExpiry,
        lostFeatures,
        specialOffer
      } = subscriptionData;

      const templateData = {
        userName: userName || 'User',
        planName,
        expiredDate,
        reasonForExpiry,
        lostFeatures: lostFeatures || [
          'Enhanced branding and profile customization',
          'Advanced analytics and insights',
          'Priority customer support',
          'Unlimited product listings',
          'Lead generation tools'
        ],
        specialOffer,
        dashboardUrl: `${config?.app?.frontendUrl || 'http://localhost:3001'}/`,
        upgradeUrl: `${config?.app?.frontendUrl || 'http://localhost:3001'}/profile/my-subscription`,
        currentYear: new Date().getFullYear()
      };

      return await this.sendTemplatedEmail({
        to: email,
        subject: `Subscription Expired - Reactivate Your Premium Access - ${config?.app?.name || 'Xuthority'}`,
        template: 'subscription-expired.ejs',
        data: templateData
      });

    } catch (error) {
      logger.error('Error sending subscription expired email:', error);
      throw new Error('Failed to send subscription expired email');
    }
  }

  /**
   * Send subscription reactivated email
   * @param {string} email - User email
   * @param {object} subscriptionData - Subscription data
   * @returns {Promise<object>} - Email send result
   */
  async sendSubscriptionReactivatedEmail(email, subscriptionData) {
    try {
      const {
        userName,
        planName,
        planPrice,
        reactivatedDate,
        nextBillingDate,
        billingCycle,
        features,
        wasDowntime,
        specialWelcomeBack
      } = subscriptionData;

      const templateData = {
        userName: userName || 'User',
        planName,
        planPrice,
        reactivatedDate,
        nextBillingDate,
        billingCycle,
        features: features || [
          'Enhanced branding and profile customization',
          'Advanced analytics and business insights',
          'Priority customer support',
          'Unlimited product listings',
          'Lead generation and marketing tools',
          'Advanced search and filtering options',
          'Detailed performance reports'
        ],
        wasDowntime: wasDowntime || false,
        specialWelcomeBack,
        dashboardUrl: `${config?.app?.frontendUrl || 'http://localhost:3001'}/`,
        subscriptionUrl: `${config?.app?.frontendUrl || 'http://localhost:3001'}/profile/my-subscription`,
        currentYear: new Date().getFullYear()
      };

      return await this.sendTemplatedEmail({
        to: email,
        subject: `Welcome Back! Subscription Reactivated - ${config?.app?.name || 'Xuthority'}`,
        template: 'subscription-reactivated.ejs',
        data: templateData
      });

    } catch (error) {
      logger.error('Error sending subscription reactivated email:', error);
      throw new Error('Failed to send subscription reactivated email');
    }
  }

  /**
   * Send subscription downgrade email
   * @param {string} email - User email
   * @param {object} downgradeData - Downgrade data
   * @returns {Promise<object>} - Email send result
   */
  async sendSubscriptionDowngradeEmail(email, downgradeData) {
    try {
      const {
        userName,
        reason,
        originalPlanName,
        downgradedDate,
        freePlanFeatures,
        supportEmail
      } = downgradeData;

      const reasonMessages = {
        'payment_failed': 'due to a payment failure',
        'subscription_expired': 'because your subscription has expired',
        'manual': 'as requested'
      };

      const templateData = {
        userName: userName || 'User',
        reason: reasonMessages[reason] || reasonMessages['subscription_expired'],
        originalPlanName: originalPlanName || 'Standard',
        downgradedDate,
        freePlanFeatures: freePlanFeatures || [
          'Basic Product Listing',
          'Basic Analytics', 
          'Standard Branding'
        ],
        supportEmail: supportEmail || 'support@xuthority.com',
        upgradeUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/subscription` : 'https://xuthority.com/subscription',
        loginUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login` : 'https://xuthority.com/login'
      };

      // For now, send a simple email (you can create an EJS template later)
      const subject = `Your Subscription Has Been Downgraded - XUTHORITY`;
      
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Subscription Downgraded</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">XUTHORITY</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Subscription Update</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        
        <h2 style="color: #333; margin-bottom: 20px;">Hi ${templateData.userName},</h2>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
            We're writing to inform you that your <strong>${templateData.originalPlanName}</strong> subscription has been downgraded to our Free plan ${templateData.reason}.
        </p>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #856404; margin-top: 0;">📅 Downgrade Details</h3>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${templateData.downgradedDate}</p>
            <p style="margin: 5px 0;"><strong>Previous Plan:</strong> ${templateData.originalPlanName}</p>
            <p style="margin: 5px 0;"><strong>Current Plan:</strong> Free Plan</p>
        </div>
        
        <h3 style="color: #333; margin-top: 30px;">✨ Your Free Plan Includes:</h3>
        <ul style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 15px 0;">
            ${templateData.freePlanFeatures.map(feature => `<li style="margin: 8px 0;">${feature}</li>`).join('')}
        </ul>
        
        <p style="font-size: 16px; margin: 25px 0;">
            Don't worry - you can upgrade back to a paid plan at any time to restore all your premium features.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${templateData.upgradeUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                Upgrade Your Plan
            </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
            <strong>Need help?</strong> Our support team is here to assist you.
        </p>
        
        <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
            Contact us at <a href="mailto:${templateData.supportEmail}" style="color: #667eea;">${templateData.supportEmail}</a>
        </p>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
            <p style="font-size: 12px; color: #999; margin: 0;">
                © ${new Date().getFullYear()} XUTHORITY. All rights reserved.
            </p>
            <p style="font-size: 12px; color: #999; margin: 5px 0 0 0;">
                <a href="${templateData.loginUrl}" style="color: #667eea;">Visit Your Dashboard</a>
            </p>
        </div>
        
    </div>
    
</body>
</html>`;

      return await this.sendEmail({
        to: email,
        subject,
        html: htmlContent,
        data: templateData
      });

    } catch (error) {
      logger.error('Error sending subscription downgrade email:', error);
      throw new Error('Failed to send subscription downgrade email');
    }
  }
}

module.exports = new EmailService();
