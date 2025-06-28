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
        loginUrl: `${config?.app?.frontendUrl || 'http://localhost:3001'}/login`,
        dashboardUrl: `${config?.app?.frontendUrl || 'http://localhost:3001'}/dashboard`,
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
}

module.exports = new EmailService();
