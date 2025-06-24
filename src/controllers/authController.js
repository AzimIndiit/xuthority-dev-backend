const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/apiError");
const apiResponse = require("../utils/apiResponse");
const { logEvent } = require("../services/auditService");

const SALT_ROUNDS = 12;
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
    return res
      .status(201)
      .json(apiResponse.success({ user, token }, "Registration successful"));
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
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
        return res
          .status(200)
          .json(
            apiResponse.success(
              { user, token: user.accessToken },
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
    return res
      .status(200)
      .json(apiResponse.success({ user, token }, "Login successful"));
  } catch (err) {
    next(err);
  }
};

exports.googleAuth = async (req, res, next) => {
  // TODO: Implement Google OAuth
  return next(
    new ApiError("Google OAuth not implemented", "NOT_IMPLEMENTED", 501),
  );
};

exports.linkedinAuth = async (req, res, next) => {
  // TODO: Implement LinkedIn OAuth
  return next(
    new ApiError("LinkedIn OAuth not implemented", "NOT_IMPLEMENTED", 501),
  );
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
    return res
      .status(201)
      .json(
        apiResponse.success({ user, token }, "Vendor registration successful"),
      );
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
