const userService = require('../services/userService');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

// PATCH /api/v1/admin/users/:id/verify
exports.verifyVendorProfile = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json(ApiResponse.success(null, 'Forbidden'));
    }
    const userId = req.params.id;
    const user = await userService.verifyVendorProfile(userId);
    return res.json(ApiResponse.success({ user }, 'Vendor profile verified successfully'));
  } catch (err) {
    next(err);
  }
};
