const industryService = require('../services/industryService');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Create new industry
 * @route   POST /api/v1/industries
 * @access  Private
 */
exports.createIndustry = async (req, res, next) => {
  try {
    const industry = await industryService.createIndustry(req.body, req.user.id);

    res.status(201).json(
      ApiResponse.success(industry, 'Industry created successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all industries with search and pagination
 * @route   GET /api/v1/industries
 * @access  Public
 */
exports.getAllIndustries = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || '',
      status: req.query.status || '',
      category: req.query.category || '',
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await industryService.getAllIndustries(options);

    res.status(200).json(
      ApiResponse.success(
        result.industries,
        'Industries retrieved successfully',
        { pagination: result.pagination }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active industries only
 * @route   GET /api/v1/industries/active
 * @access  Public
 */
exports.getActiveIndustries = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || '',
      category: req.query.category || '',
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await industryService.getActiveIndustries(options);

    res.status(200).json(
      ApiResponse.success(
        result.industries,
        'Active industries retrieved successfully',
        { pagination: result.pagination }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get industry by ID
 * @route   GET /api/v1/industries/:industryId
 * @access  Public
 */
exports.getIndustryById = async (req, res, next) => {
  try {
    const industry = await industryService.getIndustryById(req.params.industryId);

    res.status(200).json(
      ApiResponse.success(industry, 'Industry retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get industry by slug
 * @route   GET /api/v1/industries/slug/:slug
 * @access  Public
 */
exports.getIndustryBySlug = async (req, res, next) => {
  try {
    const industry = await industryService.getIndustryBySlug(req.params.slug);

    res.status(200).json(
      ApiResponse.success(industry, 'Industry retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update industry
 * @route   PUT /api/v1/industries/:industryId
 * @access  Private
 */
exports.updateIndustry = async (req, res, next) => {
  try {
    const industry = await industryService.updateIndustry(
      req.params.industryId,
      req.body,
      req.user.id
    );

    res.status(200).json(
      ApiResponse.success(industry, 'Industry updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete industry
 * @route   DELETE /api/v1/industries/:industryId
 * @access  Private
 */
exports.deleteIndustry = async (req, res, next) => {
  try {
    const result = await industryService.deleteIndustry(req.params.industryId, req.user.id);

    res.status(200).json(
      ApiResponse.success(null, result.message)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle industry status
 * @route   PATCH /api/v1/industries/:industryId/toggle-status
 * @access  Private
 */
exports.toggleIndustryStatus = async (req, res, next) => {
  try {
    const industry = await industryService.toggleIndustryStatus(req.params.industryId, req.user.id);

    res.status(200).json(
      ApiResponse.success(industry, `Industry status changed to ${industry.status}`)
    );
  } catch (error) {
    next(error);
  }
};
