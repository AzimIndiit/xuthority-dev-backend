const pageService = require('../services/pageService');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Create new page
 * @route   POST /api/v1/admin/pages
 * @access  Private (Admin)
 */
exports.createPage = async (req, res, next) => {
  try {
    const page = await pageService.createPage(req.body, req.admin.id);

    res.status(201).json(
      ApiResponse.success(page, 'Page created successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all pages with search and pagination
 * @route   GET /api/v1/admin/pages
 * @access  Private (Admin)
 */
exports.getAllPages = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || '',
      status: req.query.status || '',
      isSystemPage: req.query.isSystemPage || '',
      sortBy: req.query.sortBy || 'updatedAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await pageService.getAllPages(options);

    res.status(200).json(
      ApiResponse.success(
        { pages: result.pages },
        'Pages retrieved successfully',
        { pagination: result.pagination }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active pages only
 * @route   GET /api/v1/pages/active
 * @access  Public
 */
exports.getActivePages = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || '',
      isSystemPage: req.query.isSystemPage || '',
      sortBy: req.query.sortBy || 'updatedAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await pageService.getActivePages(options);

    res.status(200).json(
      ApiResponse.success(
        { pages: result.pages },
        'Active pages retrieved successfully',
        { pagination: result.pagination }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get page by ID
 * @route   GET /api/v1/admin/pages/:id
 * @access  Private (Admin)
 */
exports.getPageById = async (req, res, next) => {
  try {
    const page = await pageService.getPageById(req.params.id);

    res.status(200).json(
      ApiResponse.success(page, 'Page retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get page by slug
 * @route   GET /api/v1/pages/:slug
 * @access  Public
 */
exports.getPageBySlug = async (req, res, next) => {
  try {
    const page = await pageService.getPageBySlug(req.params.slug);

    res.status(200).json(
      ApiResponse.success(page, 'Page retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update page
 * @route   PUT /api/v1/admin/pages/:id
 * @access  Private (Admin)
 */
exports.updatePage = async (req, res, next) => {
  try {
    const page = await pageService.updatePage(req.params.id, req.body, req.user.id);

    res.status(200).json(
      ApiResponse.success(page, 'Page updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete page
 * @route   DELETE /api/v1/admin/pages/:id
 * @access  Private (Admin)
 */
exports.deletePage = async (req, res, next) => {
  try {
    await pageService.deletePage(req.params.id);

    res.status(200).json(
      ApiResponse.success(null, 'Page deleted successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle page status
 * @route   PATCH /api/v1/admin/pages/:id/toggle-status
 * @access  Private (Admin)
 */
exports.togglePageStatus = async (req, res, next) => {
  try {
    const page = await pageService.togglePageStatus(req.params.id, req.admin.id);

    res.status(200).json(
      ApiResponse.success(page, 'Page status updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk delete pages
 * @route   DELETE /api/v1/admin/pages/bulk
 * @access  Private (Admin)
 */
exports.bulkDeletePages = async (req, res, next) => {
  try {
    const { pageIds } = req.body;
    const result = await pageService.bulkDeletePages(pageIds);

    res.status(200).json(
      ApiResponse.success(result, 'Pages bulk deleted successfully')
    );
  } catch (error) {
    next(error);
  }
}; 