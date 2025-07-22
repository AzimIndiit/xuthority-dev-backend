const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Admin, User, Product, ProductReview } = require('../models');
const ApiError = require('../utils/apiError');
const { logEvent } = require('./auditService');
const emailService = require('./emailService');

const SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS ? parseInt(process.env.BCRYPT_SALT_ROUNDS) : 12;
const TOKEN_EXPIRY = "7d";

/**
 * Generate JWT token for admin
 * @param {Object} admin - Admin object
 * @returns {string} JWT token
 */
const generateToken = (admin) => {
  return jwt.sign(
    { 
      id: admin._id, 
      email: admin.email, 
      role: 'admin' 
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: TOKEN_EXPIRY }
  );
};

/**
 * Admin login
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Promise<Object>} Admin and token
 */
const adminLogin = async (email, password) => {
  try {
    const admin = await Admin.findOne({ email, isActive: true });
    if (!admin) {
      throw new ApiError('Invalid credentials', 'INVALID_CREDENTIALS', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new ApiError('Invalid credentials', 'INVALID_CREDENTIALS', 401);
    }

    // Update last login and generate token
    const token = generateToken(admin);
    admin.lastLogin = new Date();
    admin.accessToken = token;
    await admin.save();

    // Log admin login
    await logEvent({
      user: admin,
      action: 'ADMIN_LOGIN',
      target: 'Admin',
      targetId: admin._id,
      details: { method: 'email' }
    });

    return {
      admin: admin.toJSON(),
      token
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new admin
 * @param {Object} adminData - Admin data
 * @returns {Promise<Object>} Created admin
 */
const createAdmin = async (adminData) => {
  try {
    const { firstName, lastName, email, password } = adminData;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      throw new ApiError('Admin already exists with this email', 'ADMIN_EXISTS', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create admin
    const admin = new Admin({
      firstName,
      lastName,
      email,
      password: hashedPassword
    });

    await admin.save();

    return admin.toJSON();
  } catch (error) {
    throw error;
  }
};

/**
 * Get admin dashboard analytics
 * @returns {Promise<Object>} Analytics data
 */
const getDashboardAnalytics = async () => {
  try {
    const [
      totalUsers,
      totalVendors,
      totalProducts,
      totalReviews,
      pendingVendors,
      recentUsers
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'vendor' }),
      Product.countDocuments(),
      ProductReview.countDocuments(),
      User.countDocuments({ role: 'vendor', isVerified: false }),
      User.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('-password -accessToken')
    ]);

    return {
      overview: {
        totalUsers,
        totalVendors,
        totalProducts,
        totalReviews,
        pendingVendors
      },
      recentUsers
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get all users with filtering and pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Users with pagination
 */
const getUsers = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      isVerified,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    if (role) query.role = role;
    if (isVerified !== undefined) query.isVerified = isVerified;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -accessToken')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Verify vendor profile
 * @param {string} userId - User ID to verify
 * @param {Object} admin - Admin performing the action
 * @returns {Promise<Object>} Updated user
 */
const verifyVendorProfile = async (userId, admin) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
    }

    if (user.role !== 'vendor') {
      throw new ApiError('User is not a vendor', 'NOT_VENDOR', 400);
    }

    user.isVerified = true;
    await user.save();

    // Log audit event
    await logEvent({
      user: admin,
      action: 'VENDOR_VERIFICATION',
      target: 'User',
      targetId: userId,
      details: { verifiedUser: user.email }
    });

    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Get admin profile
 * @param {string} adminId - Admin ID
 * @returns {Promise<Object>} Admin profile
 */
const getAdminProfile = async (adminId) => {
  try {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new ApiError('Admin not found', 'ADMIN_NOT_FOUND', 404);
    }

    return admin.toJSON();
  } catch (error) {
    throw error;
  }
};

/**
 * Update admin profile fields
 * @param {string} adminId - Admin's MongoDB _id
 * @param {object} updateData - Fields to update
 * @returns {Promise<Admin>}
 */
const updateAdminProfile = async (adminId, updateData) => {
  try {
    // Only allow specific fields to be updated
    const allowedFields = [
      'firstName', 'lastName', 'notes'
    ];
    const update = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) update[key] = updateData[key];
    }
    
    if (Object.keys(update).length === 0) {
      throw new ApiError('No valid fields to update', 'NO_VALID_FIELDS', 400);
    }
    
    const admin = await Admin.findByIdAndUpdate(
      adminId, 
      { ...update, updatedAt: new Date() }, 
      { new: true, runValidators: true }
    );
    
    if (!admin) {
      throw new ApiError('Admin not found', 'ADMIN_NOT_FOUND', 404);
    }
    
    return admin.toJSON();
  } catch (error) {
    throw error;
  }
};

/**
 * Change admin password
 * @param {string} adminId - Admin's MongoDB _id
 * @param {string} currentPassword - Current password for verification
 * @param {string} newPassword - New password to set
 * @returns {Promise<boolean>}
 */
const changeAdminPassword = async (adminId, currentPassword, newPassword) => {
  try {
    // Get admin with password for verification
    const admin = await Admin.findById(adminId).select('+password');
    
    if (!admin) {
      throw new ApiError('Admin not found', 'ADMIN_NOT_FOUND', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isCurrentPasswordValid) {
      throw new ApiError('Current password is incorrect', 'INVALID_CURRENT_PASSWORD', 400);
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, admin.password);
    if (isSamePassword) {
      throw new ApiError('New password must be different from current password', 'SAME_PASSWORD_NOT_ALLOWED', 400);
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await Admin.findByIdAndUpdate(adminId, { 
      password: hashedNewPassword,
      updatedAt: new Date()
    });

    // Log password change
    await logEvent({
      user: admin,
      action: 'ADMIN_PASSWORD_CHANGE',
      target: 'Admin',
      targetId: adminId,
      details: {}
    });

    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * Generate password reset token and send email for admin
 * @param {string} email - Admin's email address
 * @returns {Promise<boolean>}
 */
const forgotAdminPassword = async (email) => {
  try {
    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase(), isActive: true });
    console.log(admin);

    if (!admin) {
      // Don't reveal if admin exists or not for security - just return success
      return true;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set token expiration (1 hour from now)
    const resetTokenExpiration = new Date(Date.now() + 60 * 60 * 1000);

    // Save reset token to admin
    await Admin.findByIdAndUpdate(admin._id, {
      passwordResetToken: resetTokenHash,
      passwordResetExpires: resetTokenExpiration
    });

    // Send password reset email (using admin-specific template or generic one)
    try {
      await emailService.sendPasswordResetEmail(
        admin.email, 
        resetToken, 
        admin.firstName || 'Admin'
      );
      
      // Log password reset request
      await logEvent({
        user: admin,
        action: 'ADMIN_PASSWORD_RESET_REQUEST',
        target: 'Admin',
        targetId: admin._id,
        details: { email }
      });
      
      return true;
    } catch (error) {
      console.log(error);
      // Clear reset token if email fails
      await Admin.findByIdAndUpdate(admin._id, {
        passwordResetToken: undefined,
        passwordResetExpires: undefined
      });
      throw new ApiError('Failed to send password reset email. Please try again.', 'EMAIL_SEND_FAILED', 500);
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Reset admin password using token
 * @param {string} resetToken - Password reset token
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>}
 */
const resetAdminPassword = async (resetToken, newPassword) => {
  try {
    // Hash the token to match stored version
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Find admin with valid reset token
    const admin = await Admin.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: Date.now() },
      isActive: true
    }).select('+password');

    if (!admin) {
      throw new ApiError('Password reset token is invalid or has expired', 'INVALID_RESET_TOKEN', 400);
    }

    // Check if new password is different from current password
    if (admin.password) {
      const isSamePassword = await bcrypt.compare(newPassword, admin.password);
      if (isSamePassword) {
        throw new ApiError('New password must be different from current password', 'SAME_PASSWORD_NOT_ALLOWED', 400);
      }
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password and clear reset fields
    await Admin.findByIdAndUpdate(admin._id, {
      password: hashedNewPassword,
      $unset: {
        passwordResetToken: 1,
        passwordResetExpires: 1
      },
      updatedAt: new Date()
    });

    // Log password reset completion
    await logEvent({
      user: admin,
      action: 'ADMIN_PASSWORD_RESET_COMPLETED',
      target: 'Admin',
      targetId: admin._id,
      details: {}
    });

    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * Verify admin reset token validity
 * @param {string} resetToken - Password reset token
 * @returns {Promise<object>} Admin info if token is valid
 */
const verifyAdminResetToken = async (resetToken) => {
  try {
    // Hash the token to match stored version
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Find admin with valid reset token
    const admin = await Admin.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: Date.now() },
      isActive: true
    }).select('firstName lastName email passwordResetExpires');

    if (!admin) {
      throw new ApiError('Password reset token is invalid or has expired', 'INVALID_RESET_TOKEN', 400);
    }

    return {
      adminId: admin._id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      expiresAt: admin.passwordResetExpires
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  adminLogin,
  createAdmin,
  getDashboardAnalytics,
  getUsers,
  verifyVendorProfile,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  forgotAdminPassword,
  resetAdminPassword,
  verifyAdminResetToken
}; 