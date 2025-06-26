const marketSegmentService = require('../services/marketSegmentService');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Create new market segment
 * @route   POST /api/v1/market-segments
 * @access  Private
 */
exports.createMarketSegment = async (req, res, next) => {
  try {
    const marketSegment = await marketSegmentService.createMarketSegment(req.body, req.user.id);

    res.status(201).json(
      ApiResponse.success(marketSegment, 'Market segment created successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all market segments with search and pagination
 * @route   GET /api/v1/market-segments
 * @access  Public
 */
exports.getAllMarketSegments = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || '',
      status: req.query.status || '',
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await marketSegmentService.getAllMarketSegments(options);

    res.status(200).json(
      ApiResponse.success(
        result.marketSegments,
        'Market segments retrieved successfully',
        { pagination: result.pagination }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active market segments only
 * @route   GET /api/v1/market-segments/active
 * @access  Public
 */
exports.getActiveMarketSegments = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || '',
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await marketSegmentService.getActiveMarketSegments(options);

    res.status(200).json(
      ApiResponse.success(
        result.marketSegments,
        'Active market segments retrieved successfully',
        { pagination: result.pagination }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get market segment by ID
 * @route   GET /api/v1/market-segments/:marketSegmentId
 * @access  Public
 */
exports.getMarketSegmentById = async (req, res, next) => {
  try {
    const marketSegment = await marketSegmentService.getMarketSegmentById(req.params.marketSegmentId);

    res.status(200).json(
      ApiResponse.success(marketSegment, 'Market segment retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get market segment by slug
 * @route   GET /api/v1/market-segments/slug/:slug
 * @access  Public
 */
exports.getMarketSegmentBySlug = async (req, res, next) => {
  try {
    const marketSegment = await marketSegmentService.getMarketSegmentBySlug(req.params.slug);

    res.status(200).json(
      ApiResponse.success(marketSegment, 'Market segment retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update market segment
 * @route   PUT /api/v1/market-segments/:marketSegmentId
 * @access  Private
 */
exports.updateMarketSegment = async (req, res, next) => {
  try {
    const marketSegment = await marketSegmentService.updateMarketSegment(
      req.params.marketSegmentId,
      req.body,
      req.user.id
    );

    res.status(200).json(
      ApiResponse.success(marketSegment, 'Market segment updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete market segment
 * @route   DELETE /api/v1/market-segments/:marketSegmentId
 * @access  Private
 */
exports.deleteMarketSegment = async (req, res, next) => {
  try {
    const result = await marketSegmentService.deleteMarketSegment(req.params.marketSegmentId, req.user.id);

    res.status(200).json(
      ApiResponse.success(null, result.message)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle market segment status
 * @route   PATCH /api/v1/market-segments/:marketSegmentId/toggle-status
 * @access  Private
 */
exports.toggleMarketSegmentStatus = async (req, res, next) => {
  try {
    const marketSegment = await marketSegmentService.toggleMarketSegmentStatus(req.params.marketSegmentId, req.user.id);

    res.status(200).json(
      ApiResponse.success(marketSegment, `Market segment status changed to ${marketSegment.status}`)
    );
  } catch (error) {
    next(error);
  }
}; 