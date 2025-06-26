const { ResourceCategory } = require('../models');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

/**
 * Create a new resource category
 */
const createResourceCategory = async (categoryData) => {
  try {
    const existingCategory = await ResourceCategory.findOne({ name: categoryData.name });
    if (existingCategory) {
              throw new ApiError('Resource category with this name already exists', 'RESOURCE_CATEGORY_ALREADY_EXISTS', 400);
    }

    const category = new ResourceCategory(categoryData);
    await category.save();

    return ApiResponse.success(category, 'Resource category created successfully');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error creating resource category', 'RESOURCE_CATEGORY_CREATE_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Get all resource categories with pagination and filtering
 */
const getAllResourceCategories = async (queryParams) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = queryParams;

    const filter = {};

    // Add status filter
    if (status) {
      filter.status = status;
    }

    // Add search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const categories = await ResourceCategory.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ResourceCategory.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };

    return ApiResponse.success(
      categories,
      'Resource categories retrieved successfully',
      { pagination, total }
    );
  } catch (error) {
    throw new ApiError('Error retrieving resource categories', 'RESOURCE_CATEGORIES_FETCH_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Get active resource categories
 */
const getActiveResourceCategories = async () => {
  try {
    const categories = await ResourceCategory.find({ status: 'active' })
      .sort({ name: 1 });

    return ApiResponse.success(categories, 'Active resource categories retrieved successfully');
  } catch (error) {
    throw new ApiError('Error retrieving active resource categories', 'ACTIVE_RESOURCE_CATEGORIES_FETCH_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Get resource category by ID
 */
const getResourceCategoryById = async (categoryId) => {
  try {
    const category = await ResourceCategory.findById(categoryId);

    if (!category) {
      throw new ApiError('Resource category not found', 'RESOURCE_CATEGORY_NOT_FOUND', 404);
    }

    return ApiResponse.success(category, 'Resource category retrieved successfully');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error retrieving resource category', 'RESOURCE_CATEGORY_FETCH_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Get resource category by slug
 */
const getResourceCategoryBySlug = async (slug) => {
  try {
    const category = await ResourceCategory.findOne({ slug });

    if (!category) {
      throw new ApiError('Resource category not found', 'RESOURCE_CATEGORY_NOT_FOUND', 404);
    }

    return ApiResponse.success(category, 'Resource category retrieved successfully');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error retrieving resource category', 'RESOURCE_CATEGORY_FETCH_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Update resource category
 */
const updateResourceCategory = async (categoryId, updateData) => {
  try {
    // Check if category exists
    const category = await ResourceCategory.findById(categoryId);
    if (!category) {
      throw new ApiError('Resource category not found', 'RESOURCE_CATEGORY_NOT_FOUND', 404);
    }

    // Check for name uniqueness if name is being updated
    if (updateData.name && updateData.name !== category.name) {
      const existingCategory = await ResourceCategory.findOne({ 
        name: updateData.name, 
        _id: { $ne: categoryId } 
      });
      if (existingCategory) {
        throw new ApiError('Resource category with this name already exists', 'RESOURCE_CATEGORY_ALREADY_EXISTS', 400);
      }
    }

    // Update the category object and save to trigger pre-save middleware
    Object.assign(category, updateData);
    const updatedCategory = await category.save();

    return ApiResponse.success(updatedCategory, 'Resource category updated successfully');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error updating resource category', 'RESOURCE_CATEGORY_UPDATE_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Toggle resource category status
 */
const toggleResourceCategoryStatus = async (categoryId) => {
  try {
    const category = await ResourceCategory.findById(categoryId);
    if (!category) {
      throw new ApiError('Resource category not found', 'RESOURCE_CATEGORY_NOT_FOUND', 404);
    }

    category.status = category.status === 'active' ? 'inactive' : 'active';
    await category.save();

    return ApiResponse.success(category, `Resource category status updated to ${category.status}`);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error updating resource category status', 'RESOURCE_CATEGORY_STATUS_UPDATE_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Delete resource category
 */
const deleteResourceCategory = async (categoryId) => {
  try {
    const category = await ResourceCategory.findById(categoryId);
    if (!category) {
      throw new ApiError('Resource category not found', 'RESOURCE_CATEGORY_NOT_FOUND', 404);
    }

    await ResourceCategory.findByIdAndDelete(categoryId);

    return ApiResponse.success(null, 'Resource category deleted successfully');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error deleting resource category', 'RESOURCE_CATEGORY_DELETE_ERROR', 500, { originalError: error.message });
  }
};

module.exports = {
  createResourceCategory,
  getAllResourceCategories,
  getActiveResourceCategories,
  getResourceCategoryById,
  getResourceCategoryBySlug,
  updateResourceCategory,
  toggleResourceCategoryStatus,
  deleteResourceCategory
}; 