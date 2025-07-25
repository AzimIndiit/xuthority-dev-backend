const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { Admin, User, Product, ProductReview } = require('../models');
const ApiError = require('../utils/apiError');
const { logEvent } = require('./auditService');
const emailService = require('./emailService');
const { generateBlockedUserError, isAdminDeactivated } = require('../utils/authHelpers');
const { updateProductAggregateRatings, batchUpdateProductStats } = require('../utils/productRatingHelpers');

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
 * Get admin dashboard analytics with time filtering
 * @param {string} period - Time period: 'weekly', 'monthly', 'yearly'
 * @returns {Promise<Object>} Analytics data
 */
const getDashboardAnalytics = async (period = 'weekly') => {
  try {
    // Calculate date ranges based on period
    const { dateFilter, groupFormat, periods } = getDateRangeAndFormat(period);

    // Run all analytics queries in parallel for better performance
    const [
      statsData,
      userGrowthData,
      reviewTrendsData,
      recentReviewsData
    ] = await Promise.all([
      getStatsData(dateFilter),
      getUserGrowthData(dateFilter, groupFormat, periods),
      getReviewTrendsData(dateFilter, groupFormat, periods),
      getRecentReviewsData(dateFilter)
    ]);

    return {
      stats: statsData,
      charts: {
        userGrowth: userGrowthData,
        reviewTrends: reviewTrendsData
      },
      recentReviews: recentReviewsData
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Helper function to calculate date ranges and formats based on period
 * @param {string} period - Time period
 * @returns {Object} Date filter, group format, and periods
 */
const getDateRangeAndFormat = (period) => {
  const now = new Date();
  let dateFilter, groupFormat, periods;

  switch (period) {
    case 'yearly':
      // Last 5 years
      dateFilter = new Date(now.getFullYear() - 5, 0, 1);
      groupFormat = { year: '$year' };
      periods = 5;
      break;
    case 'monthly':
      // Last 12 months
      dateFilter = new Date(now.getFullYear(), now.getMonth() - 12, 1);
      groupFormat = { year: '$year', month: '$month' };
      periods = 12;
      break;
    case 'weekly':
    default:
      // Last 12 weeks
      dateFilter = new Date(now.getTime() - (12 * 7 * 24 * 60 * 60 * 1000));
      groupFormat = { year: '$year', week: '$week' };
      periods = 12;
      break;
  }

  return { dateFilter, groupFormat, periods };
};

/**
 * Get basic stats data
 * @param {Date} dateFilter - Date filter for time period
 * @returns {Promise<Object>} Stats data
 */
const getStatsData = async (dateFilter) => {
  const [
    totalUsers,
    totalVendors,
    totalReviews,
    pendingVendors
  ] = await Promise.all([
    User.countDocuments({ 
      role: 'user',
      createdAt: { $gte: dateFilter }
    }),
    User.countDocuments({ 
      role: 'vendor',
      createdAt: { $gte: dateFilter }
    }),
    ProductReview.countDocuments({
      submittedAt: { $gte: dateFilter },
      isDeleted: false
    }),
    User.countDocuments({ 
      role: 'vendor', 
      isVerified: false,
      createdAt: { $gte: dateFilter }
    })
  ]);

  return {
    totalUsers,
    totalVendors,
    totalReviews,
    pendingVendors
  };
};

/**
 * Get user growth data for charts
 * @param {Date} dateFilter - Date filter
 * @param {Object} groupFormat - MongoDB group format
 * @param {number} periods - Number of periods
 * @returns {Promise<Array>} User growth data
 */
const getUserGrowthData = async (dateFilter, groupFormat, periods) => {
  const userGrowthPipeline = [
    {
      $match: {
        createdAt: { $gte: dateFilter }
      }
    },
    {
      $addFields: {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        week: { $week: '$createdAt' }
      }
    },
    {
      $group: {
        _id: groupFormat,
        totalUsers: {
          $sum: {
            $cond: [{ $eq: ['$role', 'user'] }, 1, 0]
          }
        },
        totalVendors: {
          $sum: {
            $cond: [{ $eq: ['$role', 'vendor'] }, 1, 0]
          }
        }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 }
    }
  ];

  const results = await User.aggregate(userGrowthPipeline);
  return formatChartData(results, groupFormat, periods);
};

/**
 * Get review trends data for charts
 * @param {Date} dateFilter - Date filter
 * @param {Object} groupFormat - MongoDB group format
 * @param {number} periods - Number of periods
 * @returns {Promise<Array>} Review trends data
 */
const getReviewTrendsData = async (dateFilter, groupFormat, periods) => {
  const reviewTrendsPipeline = [
    {
      $match: {
        submittedAt: { $gte: dateFilter },
        isDeleted: false
      }
    },
    {
      $addFields: {
        year: { $year: '$submittedAt' },
        month: { $month: '$submittedAt' },
        week: { $week: '$submittedAt' }
      }
    },
    {
      $group: {
        _id: groupFormat,
        total: { $sum: 1 },
        approved: {
          $sum: {
            $cond: [{ $eq: ['$status', 'approved'] }, 1, 0]
          }
        },
        pending: {
          $sum: {
            $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
          }
        },
        rejected: {
          $sum: {
            $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0]
          }
        },
        flagged: {
          $sum: {
            $cond: [{ $eq: ['$status', 'flagged'] }, 1, 0]
          }
        }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 }
    }
  ];

  const results = await ProductReview.aggregate(reviewTrendsPipeline);
  return formatChartData(results, groupFormat, periods, true);
};

/**
 * Get recent reviews data
 * @param {Date} dateFilter - Date filter
 * @returns {Promise<Array>} Recent reviews data
 */
const getRecentReviewsData = async (dateFilter) => {
  const recentReviewsPipeline = [
    {
      $match: {
        submittedAt: { $gte: dateFilter },
        isDeleted: false
      }
    },
    {
      $sort: { submittedAt: -1 }
    },
    {
      $limit: 10
    },
    {
      $lookup: {
        from: 'users',
        localField: 'reviewer',
        foreignField: '_id',
        as: 'reviewerData',
        pipeline: [
          {
            $project: {
              firstName: 1,
              lastName: 1,
              avatar: 1,
              email: 1
            }
          }
        ]
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productData',
        pipeline: [
          {
            $project: {
              name: 1,
              slug: 1,
              logoUrl: 1,
              userId: 1
            }
          }
        ]
      }
    },
    {
      $project: {
        _id: 1,
        title: 1,
        content: 1,
        overallRating: 1,
        status: 1,
        submittedAt: 1,
        reviewer: {
          $let: {
            vars: { reviewer: { $arrayElemAt: ['$reviewerData', 0] } },
            in: {
              name: { $concat: ['$$reviewer.firstName', ' ', '$$reviewer.lastName'] },
              firstName: '$$reviewer.firstName',
              lastName: '$$reviewer.lastName',
              slug: '$$reviewer.slug',
              avatar: '$$reviewer.avatar',
              email: '$$reviewer.email'
            }
          }
        },
        product: {
          $let: {
            vars: { product: { $arrayElemAt: ['$productData', 0] } },
            in: {
              name: '$$product.name',
              slug: '$$product.slug',
              logoUrl: '$$product.logoUrl'
            }
          }
        }
      }
    }
  ];

  return await ProductReview.aggregate(recentReviewsPipeline);
};

/**
 * Format chart data for consistent frontend consumption
 * @param {Array} results - Raw aggregation results
 * @param {Object} groupFormat - Group format used
 * @param {number} periods - Number of periods
 * @param {boolean} isReviewData - Whether this is review trend data
 * @returns {Array} Formatted chart data
 */
const formatChartData = (results, groupFormat, periods, isReviewData = false) => {
  const formattedData = [];
  const now = new Date();
  
  // Generate period labels based on groupFormat
  for (let i = periods - 1; i >= 0; i--) {
    let periodLabel, periodId;
    
    if (groupFormat.year && groupFormat.month) {
      // Monthly
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      periodLabel = date.toISOString().substr(0, 7); // YYYY-MM
      periodId = { year: date.getFullYear(), month: date.getMonth() + 1 };
    } else if (groupFormat.year && groupFormat.week) {
      // Weekly
      const date = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
      periodLabel = date.toISOString().substr(0, 10); // YYYY-MM-DD
      const week = getWeekNumber(date);
      periodId = { year: date.getFullYear(), week };
    } else {
      // Yearly
      const year = now.getFullYear() - i;
      periodLabel = year.toString();
      periodId = { year };
    }
    
    // Find matching result
    const matchingResult = results.find(r => {
      if (groupFormat.year && groupFormat.month) {
        return r._id.year === periodId.year && r._id.month === periodId.month;
      } else if (groupFormat.year && groupFormat.week) {
        return r._id.year === periodId.year && r._id.week === periodId.week;
      } else {
        return r._id.year === periodId.year;
      }
    });
    
    if (isReviewData) {
      formattedData.push({
        period: periodLabel,
        total: matchingResult?.total || 0,
        approved: matchingResult?.approved || 0,
        pending: matchingResult?.pending || 0,
        rejected: matchingResult?.rejected || 0,
        flagged: matchingResult?.flagged || 0
      });
    } else {
      formattedData.push({
        period: periodLabel,
        users: matchingResult?.totalUsers || 0,
        vendors: matchingResult?.totalVendors || 0
      });
    }
  }
  
  return formattedData;
};

/**
 * Get week number of the year
 * @param {Date} date - Date object
 * @returns {number} Week number
 */
const getWeekNumber = (date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

/**
 * Get all users with filtering and pagination (with review stats)
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Users with pagination and review statistics
 */
const getUsers = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      isVerified,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      period,
      dateFrom,
      dateTo,
      includeStats = true
    } = options;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const matchQuery = {};

    if (role) matchQuery.role = role;
    if (isVerified !== undefined) matchQuery.isVerified = isVerified;
    
    // Handle status filtering (supports comma-separated values like "approved,blocked")
    if (status) {
      const statusArray = status.split(',').map(s => s.trim());
      matchQuery.status = { $in: statusArray };
    }
    
    if (search) {
      matchQuery.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }

    // Handle date filtering
    if (period || dateFrom || dateTo) {
      const now = new Date();
      let startDate, endDate;

      if (period) {
        switch (period) {
          case 'weekly':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'monthly':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
          case 'yearly':
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
        }
        endDate = now;
      } else {
        if (dateFrom) startDate = new Date(dateFrom);
        if (dateTo) endDate = new Date(dateTo);
      }

      if (startDate || endDate) {
        matchQuery.createdAt = {};
        if (startDate) matchQuery.createdAt.$gte = startDate;
        if (endDate) matchQuery.createdAt.$lte = endDate;
      }
    }

    // If includeStats is false, use simple query (for performance when stats aren't needed)
    if (!includeStats) {
      const [users, total] = await Promise.all([
        User.find(matchQuery)
          .select('-password -accessToken')
          .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
          .skip(skip)
          .limit(parseInt(limit)),
        User.countDocuments(matchQuery)
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
    }

    // Use aggregation pipeline to include review statistics
    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'productreviews',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$reviewer', '$$userId'] },
                isDeleted: { $ne: true }
              }
            },
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          as: 'reviewStats'
        }
      },
      {
        $addFields: {
          reviewsWritten: {
            $reduce: {
              input: '$reviewStats',
              initialValue: 0,
              in: { $add: ['$$value', '$$this.count'] }
            }
          },
          reviewsApproved: {
            $let: {
              vars: {
                approvedStat: {
                  $arrayElemAt: [
                    { $filter: { input: '$reviewStats', cond: { $eq: ['$$this._id', 'approved'] } } },
                    0
                  ]
                }
              },
              in: { $ifNull: ['$$approvedStat.count', 0] }
            }
          },
          reviewsPending: {
            $let: {
              vars: {
                pendingStat: {
                  $arrayElemAt: [
                    { $filter: { input: '$reviewStats', cond: { $eq: ['$$this._id', 'pending'] } } },
                    0
                  ]
                }
              },
              in: { $ifNull: ['$$pendingStat.count', 0] }
            }
          },
          reviewsDisputed: {
            $let: {
              vars: {
                disputedStat: {
                  $arrayElemAt: [
                    { $filter: { input: '$reviewStats', cond: { $eq: ['$$this._id', 'dispute'] } } },
                    0
                  ]
                }
              },
              in: { $ifNull: ['$$disputedStat.count', 0] }
            }
          }
        }
      },
      {
        $project: {
          password: 0,
          accessToken: 0,
          reviewStats: 0
        }
      },
      { $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ];

    const [users, totalResults] = await Promise.all([
      User.aggregate(pipeline),
      User.countDocuments(matchQuery)
    ]);

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResults,
        totalPages: Math.ceil(totalResults / parseInt(limit))
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get user by slug
 * @param {string} slug - User slug
 * @returns {Promise<Object>} User object
 */
const getUserBySlug = async (slug) => {
  try {
    const user = await User.findOne({ slug })
      .select('-password -accessToken');
    
    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Get user profile statistics by slug
 * @param {string} slug - User slug
 * @returns {Promise<Object>} User profile statistics
 */
const getUserProfileStatsBySlug = async (slug) => {
  try {
    const user = await User.findOne({ slug });
    if (!user) {
      throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
    }
    
    // If user is a vendor, return vendor-specific stats
    if (user.role === 'vendor') {
      return await getVendorProfileStatsBySlug(slug);
    }
    
    // Otherwise return regular user stats
    return await getUserProfileStats(user._id);
  } catch (error) {
    throw error;
  }
};

/**
 * Get user reviews by slug with pagination
 * @param {string} slug - User slug
 * @param {Object} options - Query options
 * @returns {Promise<Object>} User reviews with pagination
 */
const getUserReviewsBySlug = async (slug, options = {}) => {
  try {
    const user = await User.findOne({ slug });
    if (!user) {
      throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
    }
    
    return await getUserReviews(user._id, options);
  } catch (error) {
    throw error;
  }
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User object
 */
const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId)
      .select('-password -accessToken');
    
    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Get user profile statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User profile statistics
 */
const getUserProfileStats = async (userId) => {
  try {
    const Follow = require('../models/Follow');
    const UserBadge = require('../models/UserBadge');

    // Get user to ensure it exists
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Get review statistics
    const reviewStats = await ProductReview.aggregate([
      { $match: { reviewer: new mongoose.Types.ObjectId(userId), isDeleted: { $ne: true } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalReviews = reviewStats.reduce((sum, stat) => sum + stat.count, 0);
    const approved = reviewStats.find(stat => stat._id === 'approved')?.count || 0;
    const pending = reviewStats.find(stat => stat._id === 'pending')?.count || 0;
    const disputed = reviewStats.find(stat => stat._id === 'dispute')?.count || 0;

    // Get followers and following count (Follow model doesn't have status field)
    const [followersCount, followingCount] = await Promise.all([
      Follow.countDocuments({ following: userId }),
      Follow.countDocuments({ follower: userId })
    ]);

    // Get user badges
    const userBadges = await UserBadge.find({ userId, status: 'accepted' })
      .populate('badgeId', 'name description icon')
      .sort({ earnedAt: -1 });

    const badges = userBadges
      .filter(ub => ub.badgeId) // Filter out badges where badgeId is null
      .map(ub => ({
        id: ub.badgeId._id,
        name: ub.badgeId.name,
        description: ub.badgeId.description,
        icon: ub.badgeId.icon,
        earnedDate: ub.earnedAt
      }));

    return {
      reviewsWritten: totalReviews,
      totalReviews,
      approved,
      pending,
      disputed,
      followers: followersCount,
      following: followingCount,
      badges
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get user reviews with pagination
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} User reviews with pagination
 */
const getUserReviews = async (userId, options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { 
      reviewer: new mongoose.Types.ObjectId(userId),
      isDeleted: false // Use false instead of { $ne: true } for consistency
    };

    // For admin, allow filtering by specific statuses
    // If status is 'all', show all non-deleted reviews regardless of status or publishedAt
    // If status is specific (approved, pending, etc.), filter by that status
    if (status !== 'all') {
      query.status = status;
      // Only add publishedAt filter for approved reviews
      if (status === 'approved') {
        query.publishedAt = { $ne: null };
      }
    }

    const [reviews, total] = await Promise.all([
      ProductReview.find(query)
        .populate([
          { path: 'product', select: 'name slug logoUrl avgRating totalReviews brandColors' },
          { path: 'reviewer', select: 'firstName lastName avatar isVerified' }
        ])
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ProductReview.countDocuments(query)
    ]);

    return {
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get vendor profile statistics by slug
 * @param {string} slug - User slug
 * @returns {Promise<Object>} Vendor profile statistics
 */
const getVendorProfileStatsBySlug = async (slug) => {
  const ProductReview = require('../models/ProductReview');
  const Dispute = require('../models/Dispute');
  const Follow = require('../models/Follow');
  const { Product, UserBadge } = require('../models');
  
  try {
    // Get user first
    const user = await User.findOne({ slug }).select('-password -accessToken');
    if (!user) {
      throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
    }

    const userId = user._id;

    // Get reviews count and average rating
    const reviewStats = await ProductReview.aggregate([
      {
        $match: {
          reviewer: userId,
          status: 'approved',
          publishedAt: { $ne: null },
          deletedAt: null
        }
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$overallRating' }
        }
      }
    ]);

    const totalReviews = reviewStats.length > 0 ? reviewStats[0].totalReviews : 0;
    const averageRating = reviewStats.length > 0 ? reviewStats[0].averageRating : 0;

    // Get disputes count
    const disputesCount = await Dispute.countDocuments({
      vendor: userId
    });

    // Get products count
    const productCount = await Product.countDocuments({
      userId: userId,
      isActive: 'active'
    });

    // Get badges
    const badges = await UserBadge.find({
      userId: userId,
      status: 'approved'
    }).populate('badgeId').sort({ createdAt: -1 });

    // Get follow statistics
    const [followersCount, followingCount] = await Promise.all([
      Follow.countDocuments({ following: userId }),
      Follow.countDocuments({ follower: userId })
    ]);

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      disputes: disputesCount,
      totalProducts: productCount,
      followers: followersCount,
      following: followingCount,
      badges: badges
        .filter(userBadge => userBadge.badgeId) // Filter out badges where badgeId is null
        .map(userBadge => ({
          id: userBadge._id,
          name: userBadge.badgeId.title,
          description: userBadge.badgeId.description,
          icon: userBadge.badgeId.icon,
          earnedDate: userBadge.createdAt
        }))
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
    user.status = 'approved'; // Update status field as well
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
 * Approve vendor profile
 * @param {string} userId - User ID
 * @param {Object} admin - Admin user object
 * @returns {Promise<Object>} Updated user object
 */
const approveVendor = async (userId, admin) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
    }

    if (user.role !== 'vendor') {
      throw new ApiError('User is not a vendor', 'NOT_VENDOR', 400);
    }

    // Update both status and isVerified for consistency
    user.status = 'approved';
    user.isVerified = true;
    await user.save();

    // Log audit event
    await logEvent({
      user: admin,
      action: 'VENDOR_APPROVAL',
      target: 'User',
      targetId: userId,
      details: { 
        approvedUser: user.email,
        previousStatus: user.status,
        newStatus: 'approved'
      }
    });

    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Reject vendor profile and delete user from database
 * @param {string} userId - User ID
 * @param {Object} admin - Admin user object
 * @param {string} reason - Optional reason for rejection
 * @returns {Promise<Object>} Deleted user object
 */
const rejectVendor = async (userId, admin, reason = null) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
    }

    if (user.role !== 'vendor') {
      throw new ApiError('User is not a vendor', 'NOT_VENDOR', 400);
    }

    const previousStatus = user.status;
    const userEmail = user.email;
    const userName = `${user.firstName} ${user.lastName}`;
    
    // Delete the user from database
    await User.findByIdAndDelete(userId);

    // Log audit event
    await logEvent({
      user: admin,
      action: 'VENDOR_REJECTION_DELETE',
      target: 'User',
      targetId: userId,
      details: { 
        deletedUser: userEmail,
        userName: userName,
        previousStatus: previousStatus,
        reason: reason || 'No reason provided',
        action: 'User permanently deleted from database'
      }
    });

    return { 
      _id: userId,
      email: userEmail,
      name: userName,
      deleted: true 
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Block user (works for both users and vendors)
 * @param {string} userId - User ID
 * @param {Object} admin - Admin user object
 * @returns {Promise<Object>} Updated user object
 */
const blockUser = async (userId, admin) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
    }

    const previousStatus = user.status;
    
    // Set status to blocked
    user.status = 'blocked';
    await user.save();

    // Log audit event with appropriate action based on user role
    const action = user.role === 'vendor' ? 'VENDOR_BLOCK' : 'USER_BLOCK';
    await logEvent({
      user: admin,
      action: action,
      target: 'User',
      targetId: userId,
      details: { 
        blockedUser: user.email,
        userRole: user.role,
        previousStatus: previousStatus,
        newStatus: 'blocked'
      }
    });

    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Block vendor profile (legacy function for backward compatibility)
 * @param {string} userId - User ID
 * @param {Object} admin - Admin user object
 * @returns {Promise<Object>} Updated user object
 */
const blockVendor = async (userId, admin) => {
  return await blockUser(userId, admin);
};

/**
 * Unblock user (works for both users and vendors)
 * @param {string} userId - User ID
 * @param {Object} admin - Admin user object
 * @returns {Promise<Object>} Updated user object
 */
const unblockUser = async (userId, admin) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
    }

    const previousStatus = user.status;
    
    // Set status back to approved (for both users and vendors)
    user.status = 'approved';
    await user.save();

    // Log audit event with appropriate action based on user role
    const action = user.role === 'vendor' ? 'VENDOR_UNBLOCK' : 'USER_UNBLOCK';
    await logEvent({
      user: admin,
      action: action,
      target: 'User',
      targetId: userId,
      details: { 
        unblockedUser: user.email,
        userRole: user.role,
        previousStatus: previousStatus,
        newStatus: user.status
      }
    });

    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Unblock vendor profile (legacy function for backward compatibility)
 * @param {string} userId - User ID
 * @param {Object} admin - Admin user object
 * @returns {Promise<Object>} Updated user object
 */
const unblockVendor = async (userId, admin) => {
  return await unblockUser(userId, admin);
};

/**
 * Delete vendor profile
 * @param {string} userId - User ID
 * @param {Object} admin - Admin user object
 * @returns {Promise<Object>} Deleted user object
 */
const deleteVendor = async (userId, admin) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
    }

    if (user.role !== 'vendor') {
      throw new ApiError('User is not a vendor', 'NOT_VENDOR', 400);
    }

    const previousStatus = user.status;
    const userEmail = user.email;
    const userName = `${user.firstName} ${user.lastName}`;
    
    // Delete the user from database
    await User.findByIdAndDelete(userId);

    // Log audit event
    await logEvent({
      user: admin,
      action: 'VENDOR_DELETE',
      target: 'User',
      targetId: userId,
      details: { 
        deletedUser: userEmail,
        userName: userName,
        previousStatus: previousStatus,
        action: 'User permanently deleted from database'
      }
    });

    return { 
      _id: userId,
      email: userEmail,
      name: userName,
      deleted: true 
    };
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
      'firstName', 'lastName', 'notes', 'avatar'
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
    // Find admin by email (check all admins first to give proper error for deactivated ones)
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    console.log(admin);

    if (!admin) {
      // Don't reveal if admin exists or not for security - just return success
      return true;
    }

    // Check if admin is deactivated
    if (isAdminDeactivated(admin)) {
      const errorDetails = generateBlockedUserError('Your admin account has been deactivated. Please contact support for assistance.');
      throw new ApiError(errorDetails.message, errorDetails.code, errorDetails.statusCode);
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
        admin.firstName || 'Admin',
        'admin'
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

/**
 * Manually recalculate product statistics for a specific product
 * @param {string} productId - Product ID
 * @param {Object} admin - Admin performing the action
 * @returns {Promise<Object>} Updated product
 */
const recalculateProductStats = async (productId, admin) => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError('Product not found', 'PRODUCT_NOT_FOUND', 404);
    }

    // Update aggregate ratings
    await updateProductAggregateRatings(productId);

    // Update product stats (e.g., total reviews, average rating)
    await batchUpdateProductStats(productId);

    // Log the action
    await logEvent({
      user: admin,
      action: 'PRODUCT_STATS_RECALCULATED',
      target: 'Product',
      targetId: productId,
      details: { productName: product.name }
    });

    return product;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  adminLogin,
  createAdmin,
  getDashboardAnalytics,
  getUsers,
  getUserBySlug,
  getUserById,
  getUserProfileStats,
  getUserProfileStatsBySlug,
  getUserReviews,
  getUserReviewsBySlug,
  getVendorProfileStatsBySlug,
  verifyVendorProfile,
  approveVendor,
  rejectVendor,
  blockUser,
  unblockUser,
  blockVendor,
  unblockVendor,
  deleteVendor,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  forgotAdminPassword,
  resetAdminPassword,
  verifyAdminResetToken,
  recalculateProductStats
}; 