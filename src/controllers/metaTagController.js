const metaTagService = require('../services/metaTagService');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Create new meta tag
 * @route   POST /api/v1/admin/meta-tags
 * @access  Private (Admin)
 */
exports.createMetaTag = async (req, res, next) => {
  try {
    const metaTag = await metaTagService.createMetaTag(req.body, req.admin.id);

    res.status(201).json(
      ApiResponse.success(metaTag, 'Meta tag created successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all meta tags with search and pagination
 * @route   GET /api/v1/admin/meta-tags
 * @access  Private (Admin)
 */
exports.getAllMetaTags = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || '',
      status: req.query.status || '',
      sortBy: req.query.sortBy || 'updatedAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await metaTagService.getAllMetaTags(options);

    res.status(200).json(
      ApiResponse.success(
        { metaTags: result.metaTags },
        'Meta tags retrieved successfully',
        { pagination: result.pagination }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active meta tags only
 * @route   GET /api/v1/meta-tags/active
 * @access  Public
 */
exports.getActiveMetaTags = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || '',
      sortBy: req.query.sortBy || 'updatedAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await metaTagService.getActiveMetaTags(options);

    res.status(200).json(
      ApiResponse.success(
        { metaTags: result.metaTags },
        'Active meta tags retrieved successfully',
        { pagination: result.pagination }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get meta tag by ID
 * @route   GET /api/v1/admin/meta-tags/:id
 * @access  Private (Admin)
 */
exports.getMetaTagById = async (req, res, next) => {
  try {
    const metaTag = await metaTagService.getMetaTagById(req.params.id);

    res.status(200).json(
      ApiResponse.success(metaTag, 'Meta tag retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get meta tag by page name
 * @route   GET /api/v1/meta-tags/page/:pageName
 * @access  Public
 */
exports.getMetaTagByPageName = async (req, res, next) => {
  try {
    const metaTag = await metaTagService.getMetaTagByPageName(req.params.pageName);

    res.status(200).json(
      ApiResponse.success(metaTag, 'Meta tag retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update meta tag
 * @route   PUT /api/v1/admin/meta-tags/:id
 * @access  Private (Admin)
 */
exports.updateMetaTag = async (req, res, next) => {
  try {
    const metaTag = await metaTagService.updateMetaTag(req.params.id, req.body, req.admin.id);

    res.status(200).json(
      ApiResponse.success(metaTag, 'Meta tag updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete meta tag
 * @route   DELETE /api/v1/admin/meta-tags/:id
 * @access  Private (Admin)
 */
exports.deleteMetaTag = async (req, res, next) => {
  try {
    await metaTagService.deleteMetaTag(req.params.id);

    res.status(200).json(
      ApiResponse.success(null, 'Meta tag deleted successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle meta tag status
 * @route   PATCH /api/v1/admin/meta-tags/:id/toggle-status
 * @access  Private (Admin)
 */
exports.toggleMetaTagStatus = async (req, res, next) => {
  try {
    const metaTag = await metaTagService.toggleMetaTagStatus(req.params.id, req.admin.id);

    res.status(200).json(
      ApiResponse.success(metaTag, 'Meta tag status updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk delete meta tags
 * @route   DELETE /api/v1/admin/meta-tags/bulk
 * @access  Private (Admin)
 */
exports.bulkDeleteMetaTags = async (req, res, next) => {
  try {
    const { metaTagIds } = req.body;
    const result = await metaTagService.bulkDeleteMetaTags(metaTagIds);

    res.status(200).json(
      ApiResponse.success(result, 'Meta tags bulk deleted successfully')
    );
  } catch (error) {
    next(error);
  }
}; 