const express = require('express');
const helmet = require('helmet');
const cors = require('./src/middleware/cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('./src/middleware/compression');
const errorHandler = require('./src/middleware/errorHandler');
// const logger = require('./src/config/logger');
const loggerMiddleware = require('./src/middleware/logger');
require('dotenv').config();
const setupSwagger = require('./src/config/swagger');
const passport = require('./src/config/passport');
const app = express();
const authRoutes = require('./src/routes/auth');
const rateLimiter = require('./src/middleware/rateLimiter');
const security = require('./src/middleware/security');
const cache = require('./src/middleware/cache');
const userRoutes = require('./src/routes/users');
const fileRoutes = require('./src/routes/files');

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



// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server healthy' });
});

// Error handling middleware
app.use(errorHandler);

// Swagger setup
setupSwagger(app);

// Mount API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/files', fileRoutes);

// Passport middleware
app.use(passport.initialize());

module.exports = app;
