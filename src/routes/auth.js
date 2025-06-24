const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin, validateVendorRegister } = require('../validators/authValidator');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

const TOKEN_EXPIRY = '7d';
const TOKEN_REFRESH_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour in ms

function generateToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

function getTokenExpiryMs(token) {
  const decoded = jwt.decode(token);
  if (!decoded || !decoded.exp) return 0;
  return decoded.exp * 1000; // exp is in seconds, convert to ms
}

// Email/password registration
router.post('/register', validateRegister, authController.register);

// Email/password login
router.post('/login', validateLogin, authController.login);

// Vendor registration
router.post('/register-vendor', validateVendorRegister, authController.registerVendor);

// Google OAuth login (initiate)
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
// Google OAuth callback
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/api/v1/auth/google/failure' }), (req, res) => {
  authController.handleOAuthCallback(req, res, 'Google');
});
router.get('/google/failure', (req, res) => {
  res.status(401).json({ success: false, error: { message: 'Google login failed', code: 'GOOGLE_AUTH_FAILED', statusCode: 401, details: {} } });
});

// LinkedIn OAuth login (initiate)
router.get('/linkedin', passport.authenticate('linkedin'));
// LinkedIn OAuth callback
router.get('/linkedin/callback', passport.authenticate('linkedin', { session: false, failureRedirect: '/api/v1/auth/linkedin/failure' }), (req, res) => {
  authController.handleOAuthCallback(req, res, 'LinkedIn');
});
router.get('/linkedin/failure', (req, res) => {
  res.status(401).json({ success: false, error: { message: 'LinkedIn login failed', code: 'LINKEDIN_AUTH_FAILED', statusCode: 401, details: {} } });
});

module.exports = router;
