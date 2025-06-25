const rateLimit = require('express-rate-limit');

// Skip rate limiting in test environment for better test performance
if (process.env.NODE_ENV === 'test') {
  module.exports = (req, res, next) => next();
} else {
  const limiter = rateLimit({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    standardHeaders: true,
    legacyHeaders: false,
  });

  module.exports = limiter;
}
