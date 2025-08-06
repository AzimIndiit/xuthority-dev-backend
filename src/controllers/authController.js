const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/apiError");
const apiResponse = require("../utils/apiResponse");
const { logEvent } = require("../services/auditService");
const { createNotification } = require('../services/notificationService');
const emailService = require('../services/emailService');
const userService = require('../services/userService');
const logger = require('../config/logger');
const { notifyAdminsNewUser } = require('../services/adminNotificationService');
const { generateBlockedUserError, isUserBlocked } = require('../utils/authHelpers');

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
        new ApiError("User already exists with this email", "USER_ALREADY_EXISTS", 400),
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
    
    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.firstName || user.name || 'User');
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't throw error here as registration was successful
    }
    
    // Send welcome notification
    await createNotification({
      userId: user._id,
      type: 'WELCOME',
      title: 'Welcome to XUTHORITY!',
      message: user.role === 'vendor' ? 'Welcome to XUTHORITY! Start exploring and add your products today.' : 'Welcome to XUTHORITY! Start exploring and add your reviews today.',
      actionUrl: '/'
    });
    
    // Notify admins about new user
    await notifyAdminsNewUser(user);
    
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
    
    // Check if user is blocked
    if (isUserBlocked(user)) {
      const errorDetails = generateBlockedUserError();
      return next(
        new ApiError(errorDetails.message, errorDetails.code, errorDetails.statusCode),
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
    
    // Check if user already exists with this email
    const existing = await User.findOne({ email });
    if (existing) {
      return next(
        new ApiError("User already exists with this email", "USER_ALREADY_EXISTS", 400),
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
    
    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.firstName || user.name || 'User');
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't throw error here as registration was successful
    }
    
    // Send welcome notification
    await createNotification({
      userId: user._id,
      type: 'WELCOME',
      title: 'Welcome to XUTHORITY!',
      message: user.role === 'vendor' ? 'Welcome to XUTHORITY! Start exploring and add your products today.' : 'Welcome to XUTHORITY! Start exploring and add your reviews today.',
      actionUrl: '/'
    });

   const ree= await notifyAdminsNewUser(user)
   console.log('ree==========', ree)
    // Create default free plan subscription for new vendor
    // try {
    //   const subscriptionService = require('../services/subscriptionService');
    //   const subscriptionResult = await subscriptionService.createDefaultFreeSubscription(user._id);
    //   if (subscriptionResult) {
    //     logger.info(`Created free subscription for new vendor: ${user._id}`);
    //   }
    // } catch (subscriptionError) {
    //   logger.error('Failed to create default free subscription:', subscriptionError);
    //   // Don't throw error here as registration was successful
    // }
    
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

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    await userService.forgotPassword(email);
    
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

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    
    await userService.resetPassword(token, newPassword);
    
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

exports.verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    
    const userData = await userService.verifyResetToken(token);
    
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
  try {
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

    // Check if user status is pending
    const isPending = req.user.status === 'pending';
    
    // Redirect to frontend with token and status
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}&provider=${encodeURIComponent(provider)}&status=${encodeURIComponent(req.user.status)}&isPending=${encodeURIComponent(isPending)}`;
    
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    
    // Redirect to frontend with error
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/auth/callback?error=${encodeURIComponent('Authentication failed')}&provider=${encodeURIComponent(provider)}`;
    
    res.redirect(redirectUrl);
  }
};

// Add new method for LinkedIn verification callback
exports.handleLinkedInVerificationCallback = async (req, res) => {
  try {
    const user = req.user;
    
    // For verification flow, user object contains LinkedIn data directly
    let linkedInData;
    
    if (user.isVerification && user.linkedInData) {
      // This is from the verification strategy
      linkedInData = user.linkedInData;
    } else {
      // Fallback to user object (if using regular LinkedIn strategy)
      linkedInData = {
        linkedInId: user._id?.toString() || 'unknown',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        profileUrl: `https://linkedin.com/in/${user.firstName}-${user.lastName}`,
        profilePicture: '',
        headline: '',
        industry: ''
      };
    }

    // Only log if we have a real user (not verification flow)
    if (!user.isVerification) {
      await logEvent({
        user: req.user,
        action: "LINKEDIN_VERIFICATION",
        target: "User",
        targetId: req.user._id,
        details: { method: "linkedin", linkedInId: linkedInData.linkedInId },
        req,
      });
    }

    // Redirect to frontend with LinkedIn verification data
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/write-review?linkedin_verified=true&linkedin_data=${encodeURIComponent(JSON.stringify(linkedInData))}`;
    
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('LinkedIn verification callback error:', error);
    
    // Redirect to frontend with error and preserve state
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/write-review?linkedin_error=${encodeURIComponent('LinkedIn verification failed')}&preserve_state=true`;
    
    res.redirect(redirectUrl);
  }
};
