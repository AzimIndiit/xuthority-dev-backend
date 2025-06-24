const User = require('../models/User');
const apiResponse = require('../utils/apiResponse');

/**
 * Get all users with pagination
 * @route GET /api/v1/users
 * @query page, limit
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().skip(skip).limit(limit).select('-password -accessToken'),
      User.countDocuments(),
    ]);

    const pagination = {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total,
    };

    return res.json(apiResponse.success(users, 'Users fetched successfully', { pagination, total }));
  } catch (err) {
    next(err);
  }
};
