const User = require('../models/User');
const ApiError = require('../utils/apiError');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const emailService = require('./emailService');
const { createNotification } = require('../services/notificationService');
const { Product ,UserBadge} = require('../models');
const { generateBlockedUserError, isUserBlocked } = require('../utils/authHelpers');

/**
 * Get user's own profile (full profile with sensitive data)
 * @param {string} userId - User's MongoDB _id
 * @returns {Promise<User>}
 */
exports.getUserProfile = async (userId) => {
  const user = await User.findById(userId)
    .select('-password -accessToken');
  
  if (!user) {
    throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
  }
  
  return user;
};

/**
 * Get any user's public profile by slug (limited public data)
 * @param {string} slug - User's slug
 * @returns {Promise<User>}
 */
exports.getPublicUserProfileBySlug = async (slug) => {
  const user = await User.findOne({ slug })
    .select('-password -accessToken -companyEmail -acceptedMarketing -acceptedTerms -emailVerified -authProvider');
  
  if (!user) {
    throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
  }
  
  // Transform role to userType for public API consistency
  const userProfile = user.toObject();
  userProfile.userType = user.role;
  delete userProfile.role;
  
  return userProfile;
};

/**
 * Get any user's public profile (limited public data)
 * @param {string} userId - User's MongoDB _id
 * @returns {Promise<User>}
 */
exports.getPublicUserProfile = async (userId) => {
  const user = await User.findById(userId)
    .select('-password -accessToken -companyEmail -acceptedMarketing -acceptedTerms -emailVerified -authProvider');
  
  if (!user) {
    throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
  }
  
  // Transform role to userType for public API consistency
  const userProfile = user.toObject();
  userProfile.userType = user.role;
  delete userProfile.role;
  
  return userProfile;
};

/**
 * Change user password
 * @param {string} userId - User's MongoDB _id
 * @param {string} currentPassword - Current password for verification
 * @param {string} newPassword - New password to set
 * @returns {Promise<boolean>}
 */
exports.changePassword = async (userId, currentPassword, newPassword) => {
  // Get user with password for verification
  const user = await User.findById(userId).select('+password');
  
  if (!user) {
    throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
  }

  // Check if user has a password (OAuth users might not have passwords)
  if (!user.password) {
    throw new ApiError('Password change not available for OAuth accounts', 'OAUTH_PASSWORD_CHANGE_NOT_ALLOWED', 400);
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new ApiError('Current password is incorrect', 'INVALID_CURRENT_PASSWORD', 400);
  }

  // Check if new password is different from current password
  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new ApiError('New password must be different from current password', 'SAME_PASSWORD_NOT_ALLOWED', 400);
  }

  // Hash new password
  const saltRounds = 12;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await User.findByIdAndUpdate(userId, { 
    password: hashedNewPassword,
    updatedAt: new Date()
  });

  return true;
};

/**
 * Generate password reset token and send email
 * @param {string} email - User's email address
 * @returns {Promise<boolean>}
 */
exports.forgotPassword = async (email) => {
  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });
  
  if (!user) {
    // Don't reveal if user exists or not for security - just return success
    return true;
  }

  // Check if user is blocked
  if (isUserBlocked(user)) {
    const errorDetails = generateBlockedUserError();
    throw new ApiError(errorDetails.message, errorDetails.code, errorDetails.statusCode);
  }

  // Check if user has a password (OAuth users might not have passwords)
  if (!user.password) {
    throw new ApiError('Password reset not available for OAuth accounts. Please use your social login provider', 'OAUTH_RESET_NOT_ALLOWED', 400);
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  // Set token expiration (1 hour from now)
  const resetTokenExpiration = new Date(Date.now() + 60 * 60 * 1000);

  // Save reset token to user
  await User.findByIdAndUpdate(user._id, {
    passwordResetToken: resetTokenHash,
    passwordResetExpires: resetTokenExpiration,
    passwordResetAttempts: (user.passwordResetAttempts || 0) + 1,
    passwordResetLastAttempt: new Date()
  });

  // Send password reset email
  try {
    await emailService.sendPasswordResetEmail(user.email, resetToken, user.firstName || user.name);
    return true;
  } catch (error) {
    console.log(error);
    // Clear reset token if email fails
    await User.findByIdAndUpdate(user._id, {
      passwordResetToken: undefined,
      passwordResetExpires: undefined
    });
    throw new ApiError('Failed to send password reset email. Please try again.', 'EMAIL_SEND_FAILED', 500);
  }
};

/**
 * Reset password using token
 * @param {string} resetToken - Password reset token
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>}
 */
exports.resetPassword = async (resetToken, newPassword) => {
  // Hash the token to match stored version
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Find user with valid reset token
  const user = await User.findOne({
    passwordResetToken: resetTokenHash,
    passwordResetExpires: { $gt: Date.now() }
  }).select('+password');

  if (!user) {
    throw new ApiError('Password reset token is invalid or has expired', 'INVALID_RESET_TOKEN', 400);
  }

  // Check if new password is different from current password
  if (user.password) {
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new ApiError('New password must be different from current password', 'SAME_PASSWORD_NOT_ALLOWED', 400);
    }
  }

  // Hash new password
  const saltRounds = 12;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password and clear reset fields
  await User.findByIdAndUpdate(user._id, {
    password: hashedNewPassword,
    $unset: {
      passwordResetToken: 1,
      passwordResetExpires: 1,
      passwordResetAttempts: 1,
      passwordResetLastAttempt: 1
    },
    updatedAt: new Date()
  });

  // Send password change confirmation email
  try {
    await emailService.sendPasswordChangeConfirmation(user);
    // Send password change notification
    await createNotification({
      userId: user._id,
      type: 'PASSWORD_CHANGE',
      title: 'Password Changed',
      message: 'Your password has been changed successfully.',
      actionUrl: '/profile'
    });
  } catch (error) {
    console.error('Failed to send password change confirmation email:', error);
    // Don't throw error here as password was successfully changed
  }

  return true;
};

/**
 * Verify reset token validity
 * @param {string} resetToken - Password reset token
 * @returns {Promise<object>} User info if token is valid
 */
exports.verifyResetToken = async (resetToken) => {
  // Hash the token to match stored version
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Find user with valid reset token
  const user = await User.findOne({
    passwordResetToken: resetTokenHash,
    passwordResetExpires: { $gt: Date.now() }
  }).select('firstName lastName email passwordResetExpires');

  if (!user) {
    throw new ApiError('Password reset token is invalid or has expired', 'INVALID_RESET_TOKEN', 400);
  }

  return {
    userId: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    expiresAt: user.passwordResetExpires
  };
};

/**
 * Update user profile fields
 * @param {string} userId - User's MongoDB _id
 * @param {object} updateData - Fields to update
 * @returns {Promise<User>}
 */
exports.updateUserProfile = async (userId, updateData) => {
  // Only allow specific fields to be updated
  const allowedFields = [
    'firstName', 'lastName', 'region', 'description', 'industry', 'title',
    'companyName', 'companySize', 'companyEmail', 'socialLinks', 'acceptedMarketing', 'avatar',
    // Vendor-specific fields
    'companyAvatar', 'yearFounded', 'hqLocation', 'companyDescription', 'companyWebsiteUrl',
  ];
  const update = {};
  for (const key of allowedFields) {
    if (updateData[key] !== undefined) {
      // Special handling for industry field - convert empty string to null
      if (key === 'industry' && updateData[key] === '') {
        update[key] = null;
      } else {
        update[key] = updateData[key];
      }
    }
  }
  if (Object.keys(update).length === 0) {
    throw new ApiError('No valid fields to update', 'NO_VALID_FIELDS', 400);
  }
  
  // Check if firstName or lastName is being updated
  if (update.firstName || update.lastName) {
    // Get the current user to access existing firstName/lastName
    const currentUser = await User.findById(userId).select('+password');
    if (!currentUser) {
      throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
    }
    
    
    // Update all fields on the user document
    Object.keys(update).forEach(key => {
      currentUser[key] = update[key];
    });
    
    // Mark firstName and lastName as modified to ensure the pre-save hook runs
    if (update.firstName) currentUser.markModified('firstName');
    if (update.lastName) currentUser.markModified('lastName');
    
    // Save to trigger pre-save hook (which will regenerate the slug)
    const savedUser = await currentUser.save();
    
    // Return the saved user without password and accessToken
    const userObject = savedUser.toObject();
    delete userObject.password;
    delete userObject.accessToken;
    return userObject;
  } else {
    // If firstName/lastName not changing, use findByIdAndUpdate as before
    const user = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true })
      .select('-password -accessToken');
    if (!user) {
      throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
    }
    return user;
  }
};

/**
 * Admin verifies a vendor profile
 * @param {string} userId - Vendor's MongoDB _id
 * @returns {Promise<User>}
 */
exports.verifyVendorProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
  }
  if (user.isVerified) {
    return user;
  }
  user.isVerified = true;
  await user.save();
  // Send profile verification notification
  await createNotification({
    userId: user._id,
    type: 'PROFILE_VERIFIED',
    title: 'Profile Verification Approved',
    message: 'You are now fully verified! Start engaging with customers and managing your product listings.',
    actionUrl: '/profile'
  });
  return user;
};

/**
 * Get user's reviews for public profile
 * @param {string} userId - User's MongoDB _id
 * @param {object} options - Query options (page, limit, sort)
 * @returns {Promise<object>}
 */
exports.getUserReviews = async (userId, options = {}) => {
    const { page = 1, limit = 10, sortBy = 'publishedAt', sortOrder = 'desc', publicProfile = false } = options;
  
  const ProductReview = require('../models/ProductReview');
  
  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
  }

  const skip = (page - 1) * limit;
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const filter = {
    reviewer: userId,
    publishedAt: { $ne: null }
  };

  // If publicProfile is true, only show approved reviews
  if (publicProfile) {
    filter.status = 'approved';
  }

  const [reviews, total] = await Promise.all([
    ProductReview.findActiveWithPopulate(filter, [
      { path: 'product', select: 'name slug logo avgRating totalReviews brandColors logoUrl userId isActive status' },
      { path: 'reviewer', select: 'firstName lastName avatar isVerified' }
    ])
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit)),
    ProductReview.countActive(filter)
  ]);

  const pagination = {
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit),
    totalItems: total,
    itemsPerPage: parseInt(limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1
  };

  return {
    reviews,
    pagination,
    total
  };
};

/**
 * Get user's profile statistics
 * @param {string} userId - User's MongoDB _id
 * @returns {Promise<object>}
 */
exports.getUserProfileStats = async (userId) => {
  const ProductReview = require('../models/ProductReview');
  const Dispute = require('../models/Dispute');
  const Follow = require('../models/Follow');
  
  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
  }

  // Get reviews count (excluding soft-deleted)
  const reviewsCount = await ProductReview.countActive({
    reviewer: userId,
    status: 'approved',
    publishedAt: { $ne: null }
  });

  // Get disputes count based on user role
  let disputesCount = 0;
  let productCount = 0;
  let badges =[]
  if (user.role === 'user') {
    // If user role is 'user', get disputes where this user is the reviewer
    // First, get all review IDs by this user (excluding soft-deleted)
    const reviewIds = await ProductReview.findActive({ reviewer: userId }).distinct('_id');
    // Then count disputes for those reviews
    disputesCount = await Dispute.countDocuments({
      review: { $in: reviewIds }
    });
  } else if (user.role === 'vendor') {
    // If user role is 'vendor', get disputes where this user is the vendor
    
    disputesCount = await Dispute.countDocuments({
      vendor: userId,
    });
    productCount = await Product.countDocuments({
      userId: userId,
      isActive: 'active'
    });

   // Only get badges where badgeId is not null and exists
   const userBadges = await UserBadge.find({
    userId: userId,
    status: "approved",
    badgeId: { $ne: null, $exists: true }
  }).populate({
    path: 'badgeId',
    match: { status: 'active' }
  });
  
  // Filter out any badges where badgeId is still null after population
  // This handles cases where the badge might have been deleted but reference still exists
  badges = userBadges.filter(badge => badge.badgeId !== null)
  }

  // Get follow statistics
  const [followersCount, followingCount] = await Promise.all([
    Follow.countDocuments({ following: userId }),
    Follow.countDocuments({ follower: userId })
  ]);


  return {
    reviewsWritten: reviewsCount,
    disputes: disputesCount,
    followers: followersCount,
    following: followingCount,
    products: productCount,
    badges: badges
  };
};

/**
 * Get user's reviews for public profile by slug
 * @param {string} slug - User's slug
 * @param {object} options - Query options (page, limit, sort)
 * @returns {Promise<object>}
 */
exports.getUserReviewsBySlug = async (slug, options = {}) => {
  const { page = 1, limit = 10, sortBy = 'publishedAt', sortOrder = 'desc', publicProfile = true } = options;
  
  const ProductReview = require('../models/ProductReview');
  
  // Get user profile first (this will throw error if user not found)
  const userProfile = await exports.getPublicUserProfileBySlug(slug);
  const userId = userProfile._id;

  const skip = (page - 1) * limit;
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const filter = {
    reviewer: userId,
    publishedAt: { $ne: null }
  };

  // For slug-based queries, always show only approved reviews (public profile behavior)
  if (publicProfile) {
    filter.status = 'approved';
  }

  const [reviews, total] = await Promise.all([
    ProductReview.findActiveWithPopulate(filter, [
      { path: 'product', select: 'name slug logo avgRating totalReviews brandColors' },
      { path: 'reviewer', select: 'firstName lastName avatar isVerified' }
    ])
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit)),
    ProductReview.countActive(filter)
  ]);

  const pagination = {
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit),
    totalItems: total,
    itemsPerPage: parseInt(limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1
  };

  return {
    reviews,
    pagination,
    total
  };
};

/**
 * Get user's profile statistics by slug
 * @param {string} slug - User's slug
 * @returns {Promise<object>}
 */
exports.getUserProfileStatsBySlug = async (slug) => {
  const ProductReview = require('../models/ProductReview');
  const Dispute = require('../models/Dispute');
  const Follow = require('../models/Follow');
  
  // Get user profile first (this will throw error if user not found)
  const userProfile = await exports.getPublicUserProfileBySlug(slug);
  const userId = userProfile._id;

  // Get reviews count (excluding soft-deleted)
  const reviewsCount = await ProductReview.countActive({
    reviewer: userId,
    status: 'approved',
    publishedAt: { $ne: null }
  });

  // Get disputes count (as a vendor)
  const disputesCount = await Dispute.countDocuments({
    vendor: userId
  });

  // Get follow statistics
  const [followersCount, followingCount] = await Promise.all([
    Follow.countDocuments({ following: userId }),
    Follow.countDocuments({ follower: userId })
  ]);

  return {
    reviewsWritten: reviewsCount,
    disputes: disputesCount,
    followers: followersCount,
    following: followingCount
  };
};
