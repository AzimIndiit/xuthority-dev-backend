const passport = require('../config/passport');

/**
 * JWT Authentication middleware with proper error handling
 */
const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
          statusCode: 401,
          details: {}
        }
      });
    }
    
    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Optional JWT Authentication middleware - sets req.user if valid token provided
 * but doesn't reject if no token is provided
 */
const optionalAuthenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    
    // Set user if authentication successful, otherwise continue without user
    if (user) {
      req.user = user;
    }
    
    next();
  })(req, res, next);
};

module.exports = authenticate;
module.exports.optionalAuth = optionalAuthenticate;
