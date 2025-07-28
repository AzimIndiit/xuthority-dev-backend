const integrationService = require('../services/integrationService');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Create new integration
 * @route   POST /api/v1/integrations
 * @access  Private
 */
exports.createIntegration = async (req, res, next) => {
  try {
    const integration = await integrationService.createIntegration(req.body, req.user.id);

    res.status(201).json(
      ApiResponse.success(integration, 'Integration created successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all integrations with search and pagination
 * @route   GET /api/v1/integrations
 * @access  Public
 */
exports.getAllIntegrations = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || '',
      status: req.query.status || '',
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await integrationService.getAllIntegrations(options);

    res.status(200).json(
      ApiResponse.success(
        result.integrations,
        'Integrations retrieved successfully',
        { pagination: result.pagination }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active integrations only
 * @route   GET /api/v1/integrations/active
 * @access  Public
 */
exports.getActiveIntegrations = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || '',
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await integrationService.getActiveIntegrations(options);

    res.status(200).json(
      ApiResponse.success(
        result.integrations,
        'Active integrations retrieved successfully',
        { pagination: result.pagination }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get integration by ID
 * @route   GET /api/v1/integrations/:id
 * @access  Public
 */
exports.getIntegrationById = async (req, res, next) => {
  try {
    const integration = await integrationService.getIntegrationById(req.params.id);

    res.status(200).json(
      ApiResponse.success(integration, 'Integration retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get integration by slug
 * @route   GET /api/v1/integrations/slug/:slug
 * @access  Public
 */
exports.getIntegrationBySlug = async (req, res, next) => {
  try {
    const integration = await integrationService.getIntegrationBySlug(req.params.slug);

    res.status(200).json(
      ApiResponse.success(integration, 'Integration retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update integration
 * @route   PUT /api/v1/integrations/:id
 * @access  Private
 */
exports.updateIntegration = async (req, res, next) => {
  try {
    const integration = await integrationService.updateIntegration(
      req.params.id,
      req.body,
      req.user.id
    );

    res.status(200).json(
      ApiResponse.success(integration, 'Integration updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete integration
 * @route   DELETE /api/v1/integrations/:id
 * @access  Private
 */
exports.deleteIntegration = async (req, res, next) => {
  try {
    const result = await integrationService.deleteIntegration(req.params.id, req.user.id);

    res.status(200).json(
      ApiResponse.success(null, result.message)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle integration status
 * @route   PATCH /api/v1/integrations/:id/toggle-status
 * @access  Private
 */
exports.toggleIntegrationStatus = async (req, res, next) => {
  try {
    const integration = await integrationService.toggleIntegrationStatus(req.params.id, req.user.id);

    res.status(200).json(
      ApiResponse.success(integration, `Integration status changed to ${integration.status}`)
    );
  } catch (error) {
    next(error);
  }
};
