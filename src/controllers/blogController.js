const { blogService } = require('../services');

/**
 * @desc    Create a new blog
 * @route   POST /api/v1/blogs
 * @access  Private (Admin only)
 */
const createBlog = async (req, res, next) => {
  try {
    const result = await blogService.createBlog(req.body, req.user.id);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all blogs
 * @route   GET /api/v1/blogs
 * @access  Public
 */
const getAllBlogs = async (req, res, next) => {
  try {
    const result = await blogService.getAllBlogs(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all blogs for admin
 * @route   GET /api/v1/admin/blogs
 * @access  Private (Admin only)
 */
const getAdminBlogs = async (req, res, next) => {
  try {
    const result = await blogService.getAdminBlogs(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active blogs
 * @route   GET /api/v1/blogs/active
 * @access  Public
 */
const getActiveBlogs = async (req, res, next) => {
  try {
    const result = await blogService.getActiveBlogs();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get blog by ID
 * @route   GET /api/v1/blogs/:id
 * @access  Public
 */
const getBlogById = async (req, res, next) => {
  try {
    const result = await blogService.getBlogById(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get blog by slug
 * @route   GET /api/v1/blogs/slug/:slug
 * @access  Public
 */
const getBlogBySlug = async (req, res, next) => {
  try {
    const result = await blogService.getBlogBySlug(req.params.slug);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get blogs by category
 * @route   GET /api/v1/blogs/category/:categoryId
 * @access  Public
 */
const getBlogsByCategory = async (req, res, next) => {
  try {
    const result = await blogService.getBlogsByCategory(req.params.categoryId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get blogs by tag
 * @route   GET /api/v1/blogs/tag/:tag
 * @access  Public
 */
const getBlogsByTag = async (req, res, next) => {
  try {
    const result = await blogService.getBlogsByTag(req.params.tag);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update blog
 * @route   PUT /api/v1/blogs/:id
 * @access  Private (Admin only)
 */
const updateBlog = async (req, res, next) => {
  try {
    const result = await blogService.updateBlog(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle blog status
 * @route   PATCH /api/v1/blogs/:id/toggle-status
 * @access  Private (Admin only)
 */
const toggleBlogStatus = async (req, res, next) => {
  try {
    const result = await blogService.toggleBlogStatus(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete blog
 * @route   DELETE /api/v1/blogs/:id
 * @access  Private (Admin only)
 */
const deleteBlog = async (req, res, next) => {
  try {
    const result = await blogService.deleteBlog(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get blogs grouped by categories
 * @route   GET /api/v1/blogs/grouped-by-categories
 * @access  Public
 */
const getBlogsGroupedByCategories = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const result = await blogService.getBlogsGroupedByCategories(limit ? parseInt(limit) : 6);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBlog,
  getAllBlogs,
  getAdminBlogs,
  getActiveBlogs,
  getBlogById,
  getBlogBySlug,
  getBlogsByCategory,
  getBlogsByTag,
  updateBlog,
  toggleBlogStatus,
  deleteBlog,
  getBlogsGroupedByCategories
}; 