const { resourceCategoryService } = require('../services');

/**
 * @desc    Create a new resource category
 * @route   POST /api/v1/resource-categories
 * @access  Private (Admin only)
 */
const createResourceCategory = async (req, res, next) => {
  try {
    const result = await resourceCategoryService.createResourceCategory(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all resource categories
 * @route   GET /api/v1/resource-categories
 * @access  Public
 */
const getAllResourceCategories = async (req, res, next) => {
  try {
    const result = await resourceCategoryService.getAllResourceCategories(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active resource categories
 * @route   GET /api/v1/resource-categories/active
 * @access  Public
 */
const getActiveResourceCategories = async (req, res, next) => {
  try {
    const result = await resourceCategoryService.getActiveResourceCategories();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get resource category by ID
 * @route   GET /api/v1/resource-categories/:id
 * @access  Public
 */
const getResourceCategoryById = async (req, res, next) => {
  try {
    const result = await resourceCategoryService.getResourceCategoryById(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get resource category by slug
 * @route   GET /api/v1/resource-categories/slug/:slug
 * @access  Public
 */
const getResourceCategoryBySlug = async (req, res, next) => {
  try {
    const result = await resourceCategoryService.getResourceCategoryBySlug(req.params.slug);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update resource category
 * @route   PUT /api/v1/resource-categories/:id
 * @access  Private (Admin only)
 */
const updateResourceCategory = async (req, res, next) => {
  try {
    const result = await resourceCategoryService.updateResourceCategory(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle resource category status
 * @route   PATCH /api/v1/resource-categories/:id/toggle-status
 * @access  Private (Admin only)
 */
const toggleResourceCategoryStatus = async (req, res, next) => {
  try {
    const result = await resourceCategoryService.toggleResourceCategoryStatus(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete resource category
 * @route   DELETE /api/v1/resource-categories/:id
 * @access  Private (Admin only)
 */
const deleteResourceCategory = async (req, res, next) => {
  try {
    const result = await resourceCategoryService.deleteResourceCategory(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
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