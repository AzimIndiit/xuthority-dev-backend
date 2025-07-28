const mongoose = require('mongoose');
const slugify = require('slugify');
const { UserRole, User } = require('../models');
const ApiError = require('../utils/apiError');

const createUserRole = async (userRoleData, userId) => {
  try {
    const existingUserRole = await UserRole.findOne({ name: userRoleData.name });
    if (existingUserRole) {
      throw new ApiError('User role name already exists', 'DUPLICATE_USER_ROLE', 400);
    }

    const userRole = new UserRole({
      ...userRoleData,
      createdBy: userId
    });

    await userRole.save();
    await userRole.populate('createdBy', 'firstName lastName companyName email');
    
    return userRole;
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      throw new ApiError(messages[0], 'VALIDATION_ERROR', 400, { details: error.errors });
    }
    throw error;
  }
};

const getAllUserRoles = async (options) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const query = {};
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [userRoles, total] = await Promise.all([
    UserRole.find(query)
      .populate('createdBy', 'firstName lastName companyName email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    UserRole.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    userRoles,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage
    }
  };
};

const getActiveUserRoles = async (options) => {
  return await getAllUserRoles({ ...options, status: 'active' });
};

const getUserRoleById = async (userRoleId) => {
  if (!mongoose.Types.ObjectId.isValid(userRoleId)) {
    throw new ApiError('Invalid user role ID', 'INVALID_ID', 400);
  }

  const userRole = await UserRole.findById(userRoleId)
    .populate('createdBy', 'firstName lastName companyName email');

  if (!userRole) {
    throw new ApiError('User role not found', 'USER_ROLE_NOT_FOUND', 404);
  }

  return userRole;
};

const getUserRoleBySlug = async (slug) => {
  const userRole = await UserRole.findOne({ slug })
    .populate('createdBy', 'firstName lastName companyName email');

  if (!userRole) {
    throw new ApiError('User role not found', 'USER_ROLE_NOT_FOUND', 404);
  }

  return userRole;
};

const updateUserRole = async (userRoleId, updateData, userId) => {
  const userRole = await UserRole.findById(userRoleId);
  
  if (!userRole) {
    throw new ApiError('User role not found', 'USER_ROLE_NOT_FOUND', 404);
  }

  try {
    if (updateData.name && updateData.name !== userRole.name) {
      let newSlug = slugify(updateData.name, {
        lower: true,
        strict: true,
        remove: /[*+~.()'\"!:@]/g
      });
      
      let uniqueSlug = newSlug;
      let counter = 1;
      while (await UserRole.findOne({ slug: uniqueSlug, _id: { $ne: userRoleId } })) {
        uniqueSlug = `${newSlug}-${counter}`;
        counter++;
      }
      updateData.slug = uniqueSlug;
    }

    Object.assign(userRole, updateData);
    await userRole.save();
    await userRole.populate('createdBy', 'firstName lastName companyName email');
    
    return userRole;
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      throw new ApiError(messages[0], 'VALIDATION_ERROR', 400, { details: error.errors });
    }
    if (error.code === 11000) {
      throw new ApiError('User role name already exists', 'DUPLICATE_USER_ROLE', 400);
    }
    throw error;
  }
};

const deleteUserRole = async (userRoleId, userId) => {
  const userRole = await UserRole.findById(userRoleId);
  
  if (!userRole) {
    throw new ApiError('User role not found', 'USER_ROLE_NOT_FOUND', 404);
  }

  await UserRole.findByIdAndDelete(userRoleId);
  
  return { message: 'User role deleted successfully' };
};

const toggleUserRoleStatus = async (userRoleId, userId) => {
  const userRole = await UserRole.findById(userRoleId);
  
  if (!userRole) {
    throw new ApiError('User role not found', 'USER_ROLE_NOT_FOUND', 404);
  }

  userRole.status = userRole.status === 'active' ? 'inactive' : 'active';
  await userRole.save();
  await userRole.populate('createdBy', 'firstName lastName companyName email');
  
  return userRole;
};

/**
 * Bulk delete user roles
 * @param {Array} userRoleIds - Array of user role IDs
 * @returns {Object} Result summary
 */
const bulkDeleteUserRoles = async (userRoleIds) => {
  if (!Array.isArray(userRoleIds) || userRoleIds.length === 0) {
    throw new ApiError('User role IDs array is required', 'INVALID_INPUT', 400);
  }

  // Validate all user role IDs
  const invalidIds = userRoleIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    throw new ApiError('Invalid user role IDs provided', 'INVALID_IDS', 400);
  }

  const result = await UserRole.deleteMany({ _id: { $in: userRoleIds } });

  return {
    deletedCount: result.deletedCount,
    requestedCount: userRoleIds.length
  };
};

module.exports = {
  createUserRole,
  getAllUserRoles,
  getActiveUserRoles,
  getUserRoleById,
  getUserRoleBySlug,
  updateUserRole,
  deleteUserRole,
  toggleUserRoleStatus,
  bulkDeleteUserRoles
};
