const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/apiError");
const apiResponse = require("../utils/apiResponse");
const { logEvent } = require("../services/auditService");
const { createNotification } = require('../services/notificationService');

const SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS ? parseInt(process.env.BCRYPT_SALT_ROUNDS) : 12;
const TOKEN_EXPIRY = "7d";
// const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const TOKEN_REFRESH_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour in ms

function generateToken(user) {
  return jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
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
 *     summary: Register a new user
 *     tags:
 *       - Auth
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
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *               acceptedTerms:
 *                 type: boolean
 *                 example: true
 *               acceptedMarketing:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Registration successful
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
 *                 message:
 *                   type: string
 *                   example: Registration successful
 *                 meta:
 *                   type: object
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
 *                     code:
 *                       type: string
 *                     statusCode:
 *                       type: integer
 *                     details:
 *                       type: object
 */
exports.register = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      acceptedTerms,
      acceptedMarketing,
    } = req.body;
    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      return next(
        new ApiError("User already exists", "USER_ALREADY_EXISTS", 400),
      );
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: "user",
      acceptedTerms: acceptedTerms === "true",
      acceptedMarketing: acceptedMarketing === "true",
      authProvider: "email",
    });
    const token = generateToken(user);
    user.accessToken = token;
    await user.save();
    await logEvent({
      user,
      action: "REGISTER",
      target: "User",
      targetId: user._id,
      details: { method: "email" },
      req,
    });
    // Send welcome notification
    await createNotification({
      userId: user._id,
      type: 'WELCOME',
      title: 'Welcome to XUTHORITY!',
      message: 'Welcome to XUTHORITY! Start exploring and add your products today.',
      actionUrl: '/dashboard'
    });
    const newUser = {
      ...user.toObject(),
      password: undefined,
      accessToken: token
    }
    return res
      .status(201)
      .json(apiResponse.success({ user: newUser }, "Registration successful"));
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags:
 *       - Auth
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
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
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
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 meta:
 *                   type: object
 *       400:
 *         description: Validation error
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
 *                     code:
 *                       type: string
 *                     statusCode:
 *                       type: integer
 *                     details:
 *                       type: object
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email })
    if (!user) {
      return next(
        new ApiError("User not found", "USER_NOT_FOUND", 404),
      );
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return next(
        new ApiError("Invalid credentials", "INVALID_CREDENTIALS", 401),
      );
    }
    if (user.accessToken) {
      const expiryMs = getTokenExpiryMs(user.accessToken);
      if (expiryMs > Date.now() + TOKEN_REFRESH_THRESHOLD_MS) {
        await logEvent({
          user,
          action: "LOGIN",
          target: "User",
          targetId: user._id,
          details: { method: "email" },
          req,
        });
        const newUser = {
          ...user.toObject(),
          password: undefined,
        }
        return res
          .status(200)
          .json(
            apiResponse.success(
              { user: newUser, token: user.accessToken},
              "Login successful",
            ),
          );
      }
    }
    const token = generateToken(user);
    user.accessToken = token;
    await user.save();
    await logEvent({
      user,
      action: "LOGIN_REFRESH_TOKEN",
      target: "User",
      targetId: user._id,
      details: { method: "email" },
      req,
    });
    const  newUser= {
      ...user.toObject(),
      password: undefined,
      accessToken: token
    }

    return res
      .status(200)
      .json(apiResponse.success({ user: newUser, token }, "Login successful"));
  } catch (err) {
    next(err);
  }
};


/**
 * @openapi
 * /auth/register-vendor:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new vendor
 *     description: Register a new vendor account with company information
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
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 description: Vendor's last name
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Vendor's email address
 *                 example: "john.doe@company.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Vendor's password (minimum 8 characters)
 *                 example: "securePassword123"
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
 *                 enum: ["1-10", "11-50", "51-200", "201-500", "500+"]
 *                 description: Company size range
 *                 example: "51-200"
 *               acceptedTerms:
 *                 type: string
 *                 enum: ["true", "false"]
 *                 description: Whether terms and conditions were accepted
 *                 example: "true"
 *               acceptedMarketing:
 *                 type: string
 *                 enum: ["true", "false"]
 *                 description: Whether marketing communications were accepted
 *                 example: "false"
 *     responses:
 *       200:
 *         description: Vendor registration successful (existing user with valid token)
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
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       description: JWT access token
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 message:
 *                   type: string
 *                   example: "Vendor registration successful"
 *                 meta:
 *                   type: object
 *       201:
 *         description: Vendor registration successful (new user created)
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
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       description: JWT access token
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 message:
 *                   type: string
 *                   example: "Vendor registration successful"
 *                 meta:
 *                   type: object
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: Conflict - email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
exports.registerVendor = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      companyName,
      companyEmail,
      industry,
      companySize,
      acceptedTerms,
      acceptedMarketing,
    } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.accessToken) {
        const expiryMs = getTokenExpiryMs(existing.accessToken);
        if (expiryMs > Date.now() + TOKEN_REFRESH_THRESHOLD_MS) {
          await logEvent({
            user: existing,
            action: "REGISTER_VENDOR_ATTEMPT_EXISTING",
            target: "User",
            targetId: existing._id,
            details: { method: "email" },
            req,
          });
          return res
            .status(200)
            .json(
              apiResponse.success(
                { user: existing, token: existing.accessToken },
                "Vendor registration successful",
              ),
            );
        }
      }
      const token = generateToken(existing);
      existing.accessToken = token;
      await existing.save();
      await logEvent({
        user: existing,
        action: "REGISTER_VENDOR_REFRESH_TOKEN",
        target: "User",
        targetId: existing._id,
        details: { method: "email" },
        req,
      });
      return res
        .status(200)
        .json(
          apiResponse.success(
            { user: existing, token },
            "Vendor registration successful",
          ),
        );
    }
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      companyName,
      companyEmail,
      industry,
      companySize,
      acceptedTerms: acceptedTerms === "true",
      acceptedMarketing: acceptedMarketing === "true",
      role: "vendor",
      authProvider: "email",
    });
    const token = generateToken(user);
    user.accessToken = token;
    await user.save();
    await logEvent({
      user,
      action: "REGISTER_VENDOR",
      target: "User",
      targetId: user._id,
      details: { method: "email" },
      req,
    });
    const newUser = {
      ...user.toObject(),
      password: undefined
    }
    return res
      .status(201)
      .json(
        apiResponse.success({ user: newUser, token }, "Vendor registration successful"),
      );
  } catch (err) {
    next(err);
  }
};

/**
 * Forgot password - Send reset email
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags:
 *       - Auth
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
 *                 example: "user@example.com"
 *                 description: Email address to send reset link to
 *     responses:
 *       200:
 *         description: Reset email sent (or would be sent)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: object }
 *                 message: { type: string }
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    await require('../services/userService').forgotPassword(email);
    
    // Log the password reset request
    await logEvent({
      user: null,
      action: "forgot_password_request",
      target: "User",
      targetId: null,
      details: { email },
      req,
    });
    
    return res.json(apiResponse.success(
      {}, 
      'If this email exists in our system, you will receive a password reset link'
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * Reset password using token
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Reset password with token
 *     description: Reset user password using the token from email
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
 *                 example: "abc123def456..."
 *                 description: Password reset token from email
 *               newPassword:
 *                 type: string
 *                 example: "NewPassword123!"
 *                 description: New password (8+ chars, uppercase, lowercase, number)
 *               confirmNewPassword:
 *                 type: string
 *                 example: "NewPassword123!"
 *                 description: Confirmation of new password
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: object }
 *                 message: { type: string }
 *       400:
 *         description: Invalid token or validation error
 *       500:
 *         description: Internal server error
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    
    await require('../services/userService').resetPassword(token, newPassword);
    
    // Log the password reset
    await logEvent({
      user: null,
      action: "password_reset_completed",
      target: "User",
      targetId: null,
      details: { resetToken: token.substring(0, 8) + '...' },
      req,
    });
    
    return res.json(apiResponse.success(
      {}, 
      'Password has been reset successfully. You can now login with your new password.'
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * Verify reset token validity
 * @openapi
 * /auth/verify-reset-token:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Verify password reset token
 *     description: Check if password reset token is valid and not expired
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
 *                 example: "abc123def456..."
 *                 description: Password reset token to verify
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId: { type: string }
 *                     firstName: { type: string }
 *                     lastName: { type: string }
 *                     email: { type: string }
 *                     expiresAt: { type: string, format: date-time }
 *                 message: { type: string }
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
exports.verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    
    const userData = await require('../services/userService').verifyResetToken(token);
    
    return res.json(apiResponse.success(
      userData, 
      'Reset token is valid'
    ));
  } catch (err) {
    next(err);
  }
};

// Add new methods for OAuth callback token logic
exports.handleOAuthCallback = async (req, res, provider) => {
  let token = req.user.accessToken;
  if (token) {
    const expiryMs = getTokenExpiryMs(token);
    if (expiryMs <= Date.now() + TOKEN_REFRESH_THRESHOLD_MS) {
      token = null;
    }
  }
  if (!token) {
    token = generateToken(req.user);
    req.user.accessToken = token;
    await req.user.save();
  }
  await logEvent({
    user: req.user,
    action: "LOGIN",
    target: "User",
    targetId: req.user._id,
    details: { method: provider },
    req,
  });
  res.json({
    success: true,
    data: { user: req.user, token },
    message: `${provider} login successful`,
    meta: {},
  });
};
