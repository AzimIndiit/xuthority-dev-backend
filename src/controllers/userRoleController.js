const userRoleService = require('../services/userRoleService');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Create new user role
 * @route   POST /api/v1/user-roles
 * @access  Private
 */
exports.createUserRole = async (req, res, next) => {
  try {
    const userRole = await userRoleService.createUserRole(req.body, req.user.id);

    res.status(201).json(
      ApiResponse.success(userRole, 'User role created successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all user roles with search and pagination
 * @route   GET /api/v1/user-roles
 * @access  Public
 */
exports.getAllUserRoles = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || '',
      status: req.query.status || '',
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await userRoleService.getAllUserRoles(options);

    res.status(200).json(
      ApiResponse.success(
        result.userRoles,
        'User roles retrieved successfully',
        { pagination: result.pagination }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active user roles only
 * @route   GET /api/v1/user-roles/active
 * @access  Public
 */
exports.getActiveUserRoles = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || '',
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await userRoleService.getActiveUserRoles(options);

    res.status(200).json(
      ApiResponse.success(
        result.userRoles,
        'Active user roles retrieved successfully',
        { pagination: result.pagination }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user role by ID
 * @route   GET /api/v1/user-roles/:userRoleId
 * @access  Public
 */
exports.getUserRoleById = async (req, res, next) => {
  try {
    const userRole = await userRoleService.getUserRoleById(req.params.id);

    res.status(200).json(
      ApiResponse.success(userRole, 'User role retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user role by slug
 * @route   GET /api/v1/user-roles/slug/:slug
 * @access  Public
 */
exports.getUserRoleBySlug = async (req, res, next) => {
  try {
    const userRole = await userRoleService.getUserRoleBySlug(req.params.slug);

    res.status(200).json(
      ApiResponse.success(userRole, 'User role retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user role
 * @route   PUT /api/v1/user-roles/:userRoleId
 * @access  Private
 */
exports.updateUserRole = async (req, res, next) => {
  try {
    const userRole = await userRoleService.updateUserRole(
      req.params.id,
      req.body,
      req.user.id
    );

    res.status(200).json(
      ApiResponse.success(userRole, 'User role updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user role
 * @route   DELETE /api/v1/user-roles/:userRoleId
 * @access  Private
 */
exports.deleteUserRole = async (req, res, next) => {
  try {
    const result = await userRoleService.deleteUserRole(req.params.id, req.user.id);

    res.status(200).json(
      ApiResponse.success(null, result.message)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle user role status
 * @route   PATCH /api/v1/user-roles/:userRoleId/toggle-status
 * @access  Private
 */
exports.toggleUserRoleStatus = async (req, res, next) => {
  try {
    const userRole = await userRoleService.toggleUserRoleStatus(req.params.id, req.user.id);

    res.status(200).json(
      ApiResponse.success(userRole, `User role status changed to ${userRole.status}`)
    );
  } catch (error) {
    next(error);
  }
};
