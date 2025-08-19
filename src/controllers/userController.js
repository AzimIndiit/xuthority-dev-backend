const User = require('../models/User');
const apiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { createNotification } = require('../services/notificationService');
const emailService = require('../services/emailService');

exports.getAllUsers = async (req, res, next) => {
  try {
    const { q, role, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    // Build search query
    const searchQuery = {};
    
    if (q) {
      searchQuery.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { companyName: { $regex: q, $options: 'i' } }
      ];
    }

    if (role) {
      searchQuery.role = role;
    }

    const [users, total] = await Promise.all([
      User.find(searchQuery)
        .skip(skip)
        .limit(parseInt(limit, 10))
        .select('-password -accessToken')
        .sort({ createdAt: -1 }),
      User.countDocuments(searchQuery)
    ]);

    const pagination = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      total
    };

    const message = q 
      ? `Found ${users.length} user(s) matching "${q}"`
      : 'Users fetched successfully';

    return res.json(apiResponse.success(users, message, { pagination }));
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -accessToken');
    if (!user) {
      throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
    }
    return res.json(apiResponse.success(user, 'User fetched successfully'));
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;
    console.log('updateData-----', updateData)
    const user = await require('../services/userService').updateUserProfile(userId, updateData);
    await require('../services/auditService').logEvent({
      user: req.user,
      action: 'update_profile',
      target: 'User',
      targetId: userId,
      details: updateData,
      req,
    });
    // Send profile update notification
    await createNotification({
      userId,
      type: 'PROFILE_UPDATE',
      title: 'Profile Updated',
      message: 'Your profile has been updated successfully.',
      actionUrl: '/profile'
    });
    return res.json(require('../utils/apiResponse').success({ user }, 'Profile updated successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await require('../services/userService').getUserProfile(userId);
    
    // Log the profile access
    await require('../services/auditService').logEvent({
      user: req.user,
      action: 'view_own_profile',
      target: 'User',
      targetId: userId,
      details: {},
      req,
    });
    
    return res.json(require('../utils/apiResponse').success({ user }, 'Profile retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getPublicProfile = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const user = await require('../services/userService').getPublicUserProfile(userId);
    
    // Log the profile access
    await require('../services/auditService').logEvent({
      user: req.user,
      action: 'view_public_profile',
      target: 'User',
      targetId: userId,
      details: {},
      req,
    });
    
    return res.json(require('../utils/apiResponse').success({ user }, 'Public profile retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getPublicProfileBySlug = async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const user = await require('../services/userService').getPublicUserProfileBySlug(slug);
    
    // Log the profile access
    await require('../services/auditService').logEvent({
      user: req.user,
      action: 'view_public_profile_by_slug',
      target: 'User',
      targetId: user._id,
      details: { slug },
      req,
    });
    
    return res.json(require('../utils/apiResponse').success({ user }, 'Public profile retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getUserReviews = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: Math.min(parseInt(req.query.limit) || 10, 20),
      sortBy: req.query.sortBy || 'publishedAt',
      sortOrder: req.query.sortOrder || 'desc',
      publicProfile: req.query.publicProfile === 'true'
    };
    
    const result = await require('../services/userService').getUserReviews(userId, options);
    
    // Log the profile access
    await require('../services/auditService').logEvent({
      user: req.user,
      action: 'view_user_reviews',
      target: 'User',
      targetId: userId,
      details: { options },
      req,
    });
    
    return res.json(require('../utils/apiResponse').success(result, 'User reviews retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getUserReviewsBySlug = async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: Math.min(parseInt(req.query.limit) || 10, 20),
      sortBy: req.query.sortBy || 'publishedAt',
      sortOrder: req.query.sortOrder || 'desc',
      publicProfile: req.query.publicProfile === 'true'
    };
    
    const result = await require('../services/userService').getUserReviewsBySlug(slug, options);
    
    // Log the profile access
    await require('../services/auditService').logEvent({
      user: req.user,
      action: 'view_user_reviews_by_slug',
      target: 'User',
      targetId: null, // We don't have the user ID here, but slug is in details
      details: { slug, options },
      req,
    });
    
    return res.json(require('../utils/apiResponse').success(result, 'User reviews retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getUserProfileStats = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const stats = await require('../services/userService').getUserProfileStats(userId);
    
    // Log the profile stats access
    await require('../services/auditService').logEvent({
      user: req.user,
      action: 'view_user_profile_stats',
      target: 'User',
      targetId: userId,
      details: {},
      req,
    });
    
    return res.json(require('../utils/apiResponse').success(stats, 'User profile statistics retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getUserProfileStatsBySlug = async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const stats = await require('../services/userService').getUserProfileStatsBySlug(slug);
    
    // Log the profile stats access
    await require('../services/auditService').logEvent({
      user: req.user,
      action: 'view_user_profile_stats_by_slug',
      target: 'User',
      targetId: null, // We don't have the user ID here, but slug is in details
      details: { slug },
      req,
    });
    
    return res.json(require('../utils/apiResponse').success(stats, 'User profile statistics retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;
    
    await require('../services/userService').changePassword(userId, currentPassword, newPassword);
    
    // Get user for email notification
    const user = await User.findById(userId);
    
    // Send password change confirmation email
    try {
      await emailService.sendPasswordChangeConfirmation(user.email, user.firstName || user.name || 'User');
    } catch (emailError) {
      console.error('Failed to send password change confirmation email:', emailError);
      // Don't throw error here as password was successfully changed
    }
    
    // Send password change notification
    await createNotification({
      userId,
      type: 'PASSWORD_CHANGE',
      title: 'Password Changed',
      message: 'Your password has been changed successfully.',
      actionUrl: '/profile'
    });
    
    // Log the password change
    await require('../services/auditService').logEvent({
      user: req.user,
      action: 'change_password',
      target: 'User',
      targetId: userId,
      details: {},
      req,
    });
    
    return res.json(require('../utils/apiResponse').success(null, 'Password changed successfully'));
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
    }
    return res.json(apiResponse.success(null, 'User deleted successfully'));
  } catch (err) {
    next(err);
  }
};

exports.verifyUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findByIdAndUpdate(
      userId,
      { isVerified: true },
      { new: true }
    ).select('-password -accessToken');

    if (!user) {
      throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Send verification notification
    await createNotification({
      userId,
      type: 'PROFILE_VERIFICATION',
      title: 'Profile Verified',
      message: 'Your profile has been verified by our team.',
      actionUrl: '/profile'
    });

    return res.json(apiResponse.success({ user }, 'User verified successfully'));
  } catch (err) {
    next(err);
  }
}; 