const { solutionService } = require('../services');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * @desc    Create new solution
 * @route   POST /api/v1/solutions
 * @access  Private
 */
exports.createSolution = async (req, res, next) => {
  try {
    const solution = await solutionService.createSolution(req.body, req.user.id);

    res.status(201).json(
      ApiResponse.success(
        solution,
        'Solution created successfully',
        201
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all solutions with search and pagination
 * @route   GET /api/v1/solutions
 * @access  Public
 */
exports.getAllSolutions = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || '',
      status: req.query.status || '',
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await solutionService.getAllSolutions(options);

    res.status(200).json(
      ApiResponse.success(
        result.solutions,
        'Solutions retrieved successfully',
        { pagination: result.pagination }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get solution by ID
 * @route   GET /api/v1/solutions/:id
 * @access  Public
 */
exports.getSolutionById = async (req, res, next) => {
  try {
    const solution = await solutionService.getSolutionById(req.params.id);

    res.status(200).json(
      ApiResponse.success(
        solution,
        'Solution retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get solution by slug
 * @route   GET /api/v1/solutions/slug/:slug
 * @access  Public
 */
exports.getSolutionBySlug = async (req, res, next) => {
  try {
    const solution = await solutionService.getSolutionBySlug(req.params.slug);

    res.status(200).json(
      ApiResponse.success(
        solution,
        'Solution retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update solution
 * @route   PUT /api/v1/solutions/:id
 * @access  Private
 */
exports.updateSolution = async (req, res, next) => {
  try {
    const solution = await solutionService.updateSolution(
      req.params.id,
      req.body,
      req.user.id
    );

    res.status(200).json(
      ApiResponse.success(
        solution,
        'Solution updated successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete solution
 * @route   DELETE /api/v1/solutions/:id
 * @access  Private
 */
exports.deleteSolution = async (req, res, next) => {
  try {
    const result = await solutionService.deleteSolution(req.params.id, req.user.id);

    res.status(200).json(
      ApiResponse.success(
        null,
        result.message
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle solution status
 * @route   PATCH /api/v1/solutions/:id/toggle-status
 * @access  Private
 */
exports.toggleSolutionStatus = async (req, res, next) => {
  try {
    const solution = await solutionService.toggleSolutionStatus(req.params.id, req.user.id);

    res.status(200).json(
      ApiResponse.success(
        solution,
        `Solution status changed to ${solution.status}`
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active solutions only
 * @route   GET /api/v1/solutions/active
 * @access  Public
 */
exports.getActiveSolutions = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || '',
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await solutionService.getActiveSolutions(options);

    res.status(200).json(
      ApiResponse.success(
        result.solutions,
        'Active solutions retrieved successfully',
        { pagination: result.pagination }
      )
    );
  } catch (error) {
    next(error);
  }
}; 