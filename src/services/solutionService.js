const Solution = require('../models/Solution');
const ApiError = require('../utils/apiError');

/**
 * Create new solution
 * @param {Object} solutionData - Solution data
 * @param {string} userId - User ID who created the solution
 * @returns {Promise<Object>} Created solution
 */
exports.createSolution = async (solutionData, userId) => {
  try {
    // Check for duplicate name
    const existingSolution = await Solution.findOne({ name: solutionData.name });
    if (existingSolution) {
      throw new ApiError('Solution name already exists', 'DUPLICATE_SOLUTION', 400);
    }

    const solution = new Solution({
      ...solutionData,
      createdBy: userId
    });

    await solution.save();
    await solution.populate('createdBy', 'firstName lastName email');
    
    return solution;
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError('Solution name already exists', 'DUPLICATE_SOLUTION', 400);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to create solution', 'SOLUTION_CREATE_FAILED', 500);
  }
};

/**
 * Get all solutions with search and pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Solutions list with pagination
 */
exports.getAllSolutions = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    // Build query
    const query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [solutions, total] = await Promise.all([
      Solution.find(query)
        .populate('createdBy', 'firstName lastName email')
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Solution.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      solutions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage
      }
    };
  } catch (error) {
    throw new ApiError('Failed to fetch solutions', 'SOLUTION_FETCH_FAILED', 500);
  }
};

/**
 * Get solution by ID
 * @param {string} solutionId - Solution ID
 * @returns {Promise<Object>} Solution data
 */
exports.getSolutionById = async (solutionId) => {
  try {
    const solution = await Solution.findById(solutionId)
      .populate('createdBy', 'firstName lastName email');

    if (!solution) {
      throw new ApiError('Solution not found', 'SOLUTION_NOT_FOUND', 404);
    }

    return solution;
  } catch (error) {
    if (error.name === 'CastError') {
      throw new ApiError('Invalid solution ID', 'INVALID_SOLUTION_ID', 400);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to fetch solution', 'SOLUTION_FETCH_FAILED', 500);
  }
};

/**
 * Get solution by slug
 * @param {string} slug - Solution slug
 * @returns {Promise<Object>} Solution data
 */
exports.getSolutionBySlug = async (slug) => {
  try {
    const solution = await Solution.findOne({ slug })
      .populate('createdBy', 'firstName lastName email');

    if (!solution) {
      throw new ApiError('Solution not found', 'SOLUTION_NOT_FOUND', 404);
    }

    return solution;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to fetch solution', 'SOLUTION_FETCH_FAILED', 500);
  }
};

/**
 * Update solution
 * @param {string} solutionId - Solution ID
 * @param {Object} updateData - Update data
 * @param {string} userId - User ID who is updating
 * @returns {Promise<Object>} Updated solution
 */
exports.updateSolution = async (solutionId, updateData, userId) => {
  try {
    const solution = await Solution.findById(solutionId);

    if (!solution) {
      throw new ApiError('Solution not found', 'SOLUTION_NOT_FOUND', 404);
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        solution[key] = updateData[key];
      }
    });

    await solution.save();
    await solution.populate('createdBy', 'firstName lastName email');

    return solution;
  } catch (error) {
    if (error.name === 'CastError') {
      throw new ApiError('Invalid solution ID', 'INVALID_SOLUTION_ID', 400);
    }
    if (error.code === 11000) {
      throw new ApiError('Solution name already exists', 'DUPLICATE_SOLUTION', 400);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to update solution', 'SOLUTION_UPDATE_FAILED', 500);
  }
};

/**
 * Delete solution
 * @param {string} solutionId - Solution ID
 * @param {string} userId - User ID who is deleting
 * @returns {Promise<Object>} Deleted solution
 */
exports.deleteSolution = async (solutionId, userId) => {
  try {
    const solution = await Solution.findById(solutionId);

    if (!solution) {
      throw new ApiError('Solution not found', 'SOLUTION_NOT_FOUND', 404);
    }

    await Solution.findByIdAndDelete(solutionId);

    return { message: 'Solution deleted successfully', solution };
  } catch (error) {
    if (error.name === 'CastError') {
      throw new ApiError('Invalid solution ID', 'INVALID_SOLUTION_ID', 400);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to delete solution', 'SOLUTION_DELETE_FAILED', 500);
  }
};

/**
 * Toggle solution status
 * @param {string} solutionId - Solution ID
 * @param {string} userId - User ID who is toggling status
 * @returns {Promise<Object>} Updated solution
 */
exports.toggleSolutionStatus = async (solutionId, userId) => {
  try {
    const solution = await Solution.findById(solutionId);

    if (!solution) {
      throw new ApiError('Solution not found', 'SOLUTION_NOT_FOUND', 404);
    }

    await solution.toggleStatus();
    await solution.populate('createdBy', 'firstName lastName email');

    return solution;
  } catch (error) {
    if (error.name === 'CastError') {
      throw new ApiError('Invalid solution ID', 'INVALID_SOLUTION_ID', 400);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to toggle solution status', 'SOLUTION_TOGGLE_FAILED', 500);
  }
};

/**
 * Get active solutions only
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Active solutions list
 */
exports.getActiveSolutions = async (options = {}) => {
  try {
    return await this.getAllSolutions({ ...options, status: 'active' });
  } catch (error) {
    throw error;
  }
}; 