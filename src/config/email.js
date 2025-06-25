module.exports = {
  // Gmail/Nodemailer configuration
  gmail: {
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    }
  },
  fromName: process.env.EMAIL_FROM_NAME || 'Xuthority',
  fromEmail: process.env.MAIL_USERNAME || process.env.EMAIL_FROM_ADDRESS || 'noreply@xuthority.com',
  supportEmail: process.env.SUPPORT_EMAIL || 'support@xuthority.com',
  
  // Rate limiting for emails
  rateLimits: {
    forgotPassword: {
      maxAttempts: 3,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    general: {
      maxAttempts: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
    }
  }
};
