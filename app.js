const express = require('express');
const helmet = require('helmet');
const cors = require('./src/middleware/cors');
const compression = require('./src/middleware/compression');
const errorHandler = require('./src/middleware/errorHandler');
// const logger = require('./src/config/logger');
const loggerMiddleware = require('./src/middleware/logger');
require('dotenv').config();
const setupSwagger = require('./src/config/swagger');
const passport = require('./src/config/passport');
const connectDB = require('./src/config/database');
const app = express();
const routes = require('./src/routes');
const rateLimiter = require('./src/middleware/rateLimiter');
const security = require('./src/middleware/security');
const cache = require('./src/middleware/cache');

// Connect to database only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Security headers
app.use(helmet());

// CORS
app.use(cors);

// Logging
app.use(loggerMiddleware);

// JSON parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression);

// Rate limiting
app.use(rateLimiter);

// Security middleware
app.use(security);

// Cache middleware
app.use(cache);

// Passport middleware - MUST be before routes
app.use(passport.initialize());

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server healthy' });
});

// Swagger setup
setupSwagger(app);

// Mount API routes
app.use(routes);

// Error handling middleware - MUST be last
app.use(errorHandler);

module.exports = app;
