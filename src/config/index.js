const database = require('./database');
const email = require('./email');
const aws = require('./aws');
const redis = require('./redis');
const logger = require('./logger');

module.exports = {
  // Application configuration
  app: {
    name: process.env.APP_NAME || 'Xuthority',
    companyName: process.env.COMPANY_NAME || 'Xuthority Inc.',
    companyAddress: process.env.COMPANY_ADDRESS || '123 Business St, Tech City, TC 12345',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-default-jwt-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // Database configuration
  database,

  // Email configuration
  email,

  // AWS configuration
  aws,

  // Redis configuration
  redis,

  // Logger configuration
  logger,

  // OAuth configuration
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET
    }
  },

  // Rate limiting configuration
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  }
};
