const { softwareService } = require('../services');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * @desc    Create new software
 * @route   POST /api/v1/software
 * @access  Private
 */
exports.createSoftware = async (req, res, next) => {
  try {
    const software = await softwareService.createSoftware(req.body, req.user.id);

    res.status(201).json(
      ApiResponse.success(
        software,
        'Software created successfully',
        201
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all software with search and pagination
 * @route   GET /api/v1/software
 * @access  Public
 */
exports.getAllSoftware = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || '',
      status: req.query.status || '',
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };
console.log('options', options)
    const result = await softwareService.getAllSoftware(options);

    res.status(200).json(
      ApiResponse.success(
        result.software,
        'Software retrieved successfully',
        { pagination: result.pagination }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get software by ID
 * @route   GET /api/v1/software/:id
 * @access  Public
 */
exports.getSoftwareById = async (req, res, next) => {
  try {
    const software = await softwareService.getSoftwareById(req.params.id);

    res.status(200).json(
      ApiResponse.success(
        software,
        'Software retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get software by slug
 * @route   GET /api/v1/software/slug/:slug
 * @access  Public
 */
exports.getSoftwareBySlug = async (req, res, next) => {
  try {
    console.log('req.params.slug--------', req.params.slug)
    const software = await softwareService.getSoftwareBySlug(req.params.slug);

    res.status(200).json(
      ApiResponse.success(
        software,
        'Software retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update software
 * @route   PUT /api/v1/software/:id
 * @access  Private
 */
exports.updateSoftware = async (req, res, next) => {
  try {
    const software = await softwareService.updateSoftware(
      req.params.id,
      req.body,
      req.user.id
    );

    res.status(200).json(
      ApiResponse.success(
        software,
        'Software updated successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete software
 * @route   DELETE /api/v1/software/:id
 * @access  Private
 */
exports.deleteSoftware = async (req, res, next) => {
  try {
    const result = await softwareService.deleteSoftware(req.params.id, req.user.id);

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
 * @desc    Toggle software status
 * @route   PATCH /api/v1/software/:id/toggle-status
 * @access  Private
 */
exports.toggleSoftwareStatus = async (req, res, next) => {
  try {
    const software = await softwareService.toggleSoftwareStatus(req.params.id, req.user.id);

    res.status(200).json(
      ApiResponse.success(
        software,
        `Software status changed to ${software.status}`
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active software only
 * @route   GET /api/v1/software/active
 * @access  Public
 */
exports.getActiveSoftware = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || '',
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await softwareService.getActiveSoftware(options);

    res.status(200).json(
      ApiResponse.success(
        result.software,
        'Active software retrieved successfully',
        { pagination: result.pagination }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get featured softwares with their top-rated products
 * @route   GET /api/v1/software/featured-with-products
 * @access  Public
 */
exports.getFeaturedSoftwaresWithTopProducts = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      productsPerSoftware: parseInt(req.query.productsPerSoftware) || 4,
      minRating: parseFloat(req.query.minRating) || 0,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await softwareService.getFeaturedSoftwaresWithTopProducts(options);

    res.status(200).json(
      ApiResponse.success(
        result.softwares,
        'Featured softwares with top products retrieved successfully',
        {
          pagination: result.pagination,
          meta: result.meta
        }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get popular softwares with their top-rated products
 * @route   GET /api/v1/software/popular-with-products
 * @access  Public
 */
exports.getPopularSoftwaresWithTopProducts = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      productsPerSoftware: parseInt(req.query.productsPerSoftware) || 4,
      minRating: parseFloat(req.query.minRating) || 0,
      sortBy: req.query.sortBy || 'totalReviews',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await softwareService.getPopularSoftwaresWithTopProducts(options);

    res.status(200).json(
      ApiResponse.success(
        result.softwares,
        'Popular softwares with top products retrieved successfully',
        {
          pagination: result.pagination,
          meta: result.meta
        }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk delete software
 * @route   DELETE /api/v1/admin/software/bulk
 * @access  Private (Admin)
 */
exports.bulkDeleteSoftware = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const result = await softwareService.bulkDeleteSoftware(ids);

    res.status(200).json(
      ApiResponse.success(
        result,
        `Successfully deleted ${result.deletedCount} out of ${result.requestedCount} software items`
      )
    );
  } catch (error) {
    next(error);
  }
}; 