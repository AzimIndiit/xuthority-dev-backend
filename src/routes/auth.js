const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { 
  validateRegister, 
  validateLogin, 
  validateVendorRegister,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyResetToken
} = require('../validators/authValidator');
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

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Create a new user account with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - acceptedTerms
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: User's first name
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 description: User's last name
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: User's password (min 8 characters)
 *                 example: "Password123!"
 *               acceptedTerms:
 *                 type: boolean
 *                 description: User must accept terms and conditions
 *                 example: true
 *               acceptedMarketing:
 *                 type: boolean
 *                 description: User's marketing preferences
 *                 example: false
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         firstName:
 *                           type: string
 *                           example: "John"
 *                         lastName:
 *                           type: string
 *                           example: "Doe"
 *                         email:
 *                           type: string
 *                           example: "john.doe@example.com"
 *                         role:
 *                           type: string
 *                           example: "user"
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "User already exists"
 *                     code:
 *                       type: string
 *                       example: "USER_ALREADY_EXISTS"
 *                     statusCode:
 *                       type: integer
 *                       example: 400
 */
// Email/password registration
router.post('/register', validateRegister, authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login user
 *     description: Authenticate user with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 description: User's password
 *                 example: "Password123!"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT access token
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         firstName:
 *                           type: string
 *                           example: "John"
 *                         lastName:
 *                           type: string
 *                           example: "Doe"
 *                         email:
 *                           type: string
 *                           example: "john.doe@example.com"
 *                         role:
 *                           type: string
 *                           example: "user"
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Invalid credentials"
 *                     code:
 *                       type: string
 *                       example: "INVALID_CREDENTIALS"
 *                     statusCode:
 *                       type: integer
 *                       example: 401
 */
// Email/password login
router.post('/login', validateLogin, authController.login);

/**
 * @openapi
 * /auth/register-vendor:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new vendor
 *     description: Create a new vendor account with company information
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - companyName
 *               - companyEmail
 *               - industry
 *               - companySize
 *               - acceptedTerms
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Vendor's first name
 *                 example: "Jane"
 *               lastName:
 *                 type: string
 *                 description: Vendor's last name
 *                 example: "Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Vendor's email address
 *                 example: "jane.smith@company.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Vendor's password
 *                 example: "Password123!"
 *               companyName:
 *                 type: string
 *                 description: Company name
 *                 example: "Tech Solutions Inc"
 *               companyEmail:
 *                 type: string
 *                 format: email
 *                 description: Company email address
 *                 example: "contact@techsolutions.com"
 *               industry:
 *                 type: string
 *                 description: Industry sector
 *                 example: "Technology"
 *               companySize:
 *                 type: string
 *                 description: Company size category
 *                 example: "51-100 Employees"
 *               acceptedTerms:
 *                 type: boolean
 *                 description: Vendor must accept terms
 *                 example: true
 *               acceptedMarketing:
 *                 type: boolean
 *                 description: Marketing preferences
 *                 example: false
 *     responses:
 *       201:
 *         description: Vendor registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         firstName:
 *                           type: string
 *                           example: "Jane"
 *                         lastName:
 *                           type: string
 *                           example: "Smith"
 *                         email:
 *                           type: string
 *                           example: "jane.smith@company.com"
 *                         role:
 *                           type: string
 *                           example: "vendor"
 *                         companyName:
 *                           type: string
 *                           example: "Tech Solutions Inc"
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token
 *                 message:
 *                   type: string
 *                   example: "Vendor registered successfully"
 *       400:
 *         description: Validation error or user already exists
 */
// Vendor registration
router.post('/register-vendor', validateVendorRegister, authController.registerVendor);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Request password reset
 *     description: Send password reset email to user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "john.doe@example.com"
 *     responses:
 *       200:
 *         description: Password reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password reset email sent"
 *       400:
 *         description: Invalid email or OAuth user
 */
// Forgot password - Send reset email
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Reset password with token
 *     description: Reset user password using reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *               - confirmNewPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token
 *                 example: "abc123def456..."
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: New password
 *                 example: "NewPassword123!"
 *               confirmNewPassword:
 *                 type: string
 *                 description: Password confirmation
 *                 example: "NewPassword123!"
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password has been reset successfully"
 *       400:
 *         description: Invalid token or validation error
 */
// Reset password with token
router.post('/reset-password', validateResetPassword, authController.resetPassword);

/**
 * @openapi
 * /auth/verify-reset-token:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Verify reset token
 *     description: Verify if password reset token is valid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token to verify
 *                 example: "abc123def456..."
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Reset token is valid"
 *       400:
 *         description: Invalid or expired token
 */
// Verify reset token validity
router.post('/verify-reset-token', validateVerifyResetToken, authController.verifyResetToken);

/**
 * @openapi
 * /auth/google:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Google OAuth login
 *     description: Initiate Google OAuth authentication
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, vendor]
 *           default: user
 *         description: Role for the user account (user or vendor)
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
// Google OAuth login (initiate)
router.get('/google', (req, res, next) => {
  // Store role in session for use in callback
  if (req.query.role && ['user', 'vendor'].includes(req.query.role)) {
    req.session.oauthRole = req.query.role;
    console.log('Google OAuth - Storing role in session:', req.query.role);
    console.log('Google OAuth - Session ID:', req.sessionID);
    console.log('Google OAuth - Full session:', JSON.stringify(req.session));
  } else {
    req.session.oauthRole = 'user'; // default to user
    console.log('Google OAuth - Using default role: user');
    console.log('Google OAuth - Session ID:', req.sessionID);
    console.log('Google OAuth - Full session:', JSON.stringify(req.session));
  }
  
  // Save session before redirect
  req.session.save((err) => {
    if (err) {
      console.error('Google OAuth - Session save error:', err);
    } else {
      console.log('Google OAuth - Session saved successfully');
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  });
});

/**
 * @openapi
 * /auth/google/callback:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Google OAuth callback
 *     description: Handle Google OAuth callback
 *     responses:
 *       200:
 *         description: OAuth login successful
 *       401:
 *         description: OAuth login failed
 */
// Google OAuth callback
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/api/v1/auth/google/failure' }), (req, res) => {
  authController.handleOAuthCallback(req, res, 'Google');
});

/**
 * @openapi
 * /auth/google/failure:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Google OAuth failure
 *     description: Handle Google OAuth failure
 *     responses:
 *       401:
 *         description: OAuth login failed
 */
router.get('/google/failure', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  // Check if it's a blocked account error
  const error = req.session?.authError;
  let errorMessage = 'Google login failed';
  
  if (error && error.includes('blocked')) {
    errorMessage = error;
  }
  
  // Clear the session error
  if (req.session) {
    delete req.session.authError;
  }
  
  const redirectUrl = `${frontendUrl}/auth/callback?error=${encodeURIComponent(errorMessage)}&provider=Google`;
  res.redirect(redirectUrl);
});

/**
 * @openapi
 * /auth/linkedin:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: LinkedIn OAuth login
 *     description: Initiate LinkedIn OAuth authentication
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, vendor]
 *           default: user
 *         description: Role for the user account (user or vendor)
 *     responses:
 *       302:
 *         description: Redirect to LinkedIn OAuth
 */
// LinkedIn OAuth login (initiate)
router.get('/linkedin', (req, res, next) => {
  // Store role in session for use in callback
  if (req.query.role && ['user', 'vendor'].includes(req.query.role)) {
    req.session.oauthRole = req.query.role;
    console.log('LinkedIn OAuth - Storing role in session:', req.query.role);
    console.log('LinkedIn OAuth - Session ID:', req.sessionID);
    console.log('LinkedIn OAuth - Full session:', JSON.stringify(req.session));
  } else {
    req.session.oauthRole = 'user'; // default to user
    console.log('LinkedIn OAuth - Using default role: user');
    console.log('LinkedIn OAuth - Session ID:', req.sessionID);
    console.log('LinkedIn OAuth - Full session:', JSON.stringify(req.session));
  }
  
  // Save session before redirect
  req.session.save((err) => {
    if (err) {
      console.error('LinkedIn OAuth - Session save error:', err);
    } else {
      console.log('LinkedIn OAuth - Session saved successfully');
    }
    passport.authenticate('linkedin')(req, res, next);
  });
});

/**
 * @openapi
 * /auth/linkedin/callback:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: LinkedIn OAuth callback
 *     description: Handle LinkedIn OAuth callback
 *     responses:
 *       200:
 *         description: OAuth login successful
 *       401:
 *         description: OAuth login failed
 */
// LinkedIn OAuth callback
router.get('/linkedin/callback', (req, res, next) => {
  // Check for LinkedIn error parameters
  const error = req.query.error;
  const errorDescription = req.query.error_description;
  
  if (error) {
    // Handle LinkedIn cancellation or error
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let redirectUrl;
    
    if (error === 'user_cancelled_login' || error === 'user_cancelled_authorize') {
      redirectUrl = `${frontendUrl}/auth/callback?error=${encodeURIComponent('Login cancelled')}&provider=LinkedIn`;
    } else {
      const errorMsg = errorDescription || 'LinkedIn login failed';
      redirectUrl = `${frontendUrl}/auth/callback?error=${encodeURIComponent(errorMsg)}&provider=LinkedIn`;
    }
    
    return res.redirect(redirectUrl);
  }
  
  // Proceed with normal authentication
  passport.authenticate('linkedin', { 
    failureRedirect: '/api/v1/auth/linkedin/failure' 
  })(req, res, next);
}, (req, res) => {
  authController.handleOAuthCallback(req, res, 'LinkedIn');
});

/**
 * @openapi
 * /auth/linkedin/failure:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: LinkedIn OAuth failure
 *     description: Handle LinkedIn OAuth failure
 *     responses:
 *       401:
 *         description: OAuth login failed
 */
router.get('/linkedin/failure', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  // Check if it's a blocked account error
  const error = req.session?.authError;
  let errorMessage = 'LinkedIn login failed';
  
  if (error && error.includes('blocked')) {
    errorMessage = error;
  }
  
  // Clear the session error
  if (req.session) {
    delete req.session.authError;
  }
  
  const redirectUrl = `${frontendUrl}/auth/callback?error=${encodeURIComponent(errorMessage)}&provider=LinkedIn`;
  res.redirect(redirectUrl);
});

/**
 * @openapi
 * /auth/linkedin/verify:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: LinkedIn verification for review verification
 *     description: Initiate LinkedIn OAuth authentication specifically for review verification
 *     responses:
 *       302:
 *         description: Redirect to LinkedIn OAuth
 */
// LinkedIn verification for review verification (initiate)
router.get('/linkedin/verify', (req, res, next) => {
  // Mark this as verification flow
  req.session.verificationFlow = true;
  passport.authenticate('linkedin-verify')(req, res, next);
});

/**
 * @openapi
 * /auth/linkedin/verify/callback:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: LinkedIn verification callback
 *     description: Handle LinkedIn verification callback for review verification
 *     responses:
 *       200:
 *         description: LinkedIn verification successful
 *       401:
 *         description: LinkedIn verification failed
 */
// LinkedIn verification callback  
router.get('/linkedin/verify/callback', (req, res, next) => {
  // Check for LinkedIn error parameters
  const error = req.query.error;
  const errorDescription = req.query.error_description;
  
  if (error) {
    // Handle LinkedIn cancellation or error for verification flow
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let redirectUrl;
    
    if (error === 'user_cancelled_login' || error === 'user_cancelled_authorize') {
      // For verification flow, redirect back to write-review with current step preserved
      redirectUrl = `${frontendUrl}/write-review?linkedin_error=${encodeURIComponent('LinkedIn verification cancelled')}&preserve_state=true`;
    } else {
      const errorMsg = errorDescription || 'LinkedIn verification failed';
      redirectUrl = `${frontendUrl}/write-review?linkedin_error=${encodeURIComponent(errorMsg)}&preserve_state=true`;
    }
    
    return res.redirect(redirectUrl);
  }
  
  // Proceed with normal verification
  passport.authenticate('linkedin-verify', { 
    failureRedirect: '/api/v1/auth/linkedin/verify/failure' 
  })(req, res, next);
}, (req, res) => {
  authController.handleLinkedInVerificationCallback(req, res);
});

/**
 * @openapi
 * /auth/linkedin/verify/failure:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: LinkedIn verification failure
 *     description: Handle LinkedIn verification failure
 *     responses:
 *       401:
 *         description: LinkedIn verification failed
 */
router.get('/linkedin/verify/failure', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const redirectUrl = `${frontendUrl}/write-review?linkedin_error=${encodeURIComponent('LinkedIn verification failed')}&preserve_state=true`;
  res.redirect(redirectUrl);
});

module.exports = router;
