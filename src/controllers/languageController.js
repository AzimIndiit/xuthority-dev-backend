const { languageService } = require('../services');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Create new language
 * @route   POST /api/v1/languages
 * @access  Private
 */
exports.createLanguage = async (req, res, next) => {
  try {
    const language = await languageService.createLanguage(req.body, req.user.id);

    res.status(201).json(
      ApiResponse.success(language, 'Language created successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all languages with search and pagination
 * @route   GET /api/v1/languages
 * @access  Public
 */
exports.getAllLanguages = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || '',
      status: req.query.status || '',
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await languageService.getAllLanguages(options);

    res.status(200).json(
      ApiResponse.success(
        result.languages,
        'Languages retrieved successfully',
        { pagination: result.pagination }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active languages only
 * @route   GET /api/v1/languages/active
 * @access  Public
 */
exports.getActiveLanguages = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || '',
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await languageService.getActiveLanguages(options);

    res.status(200).json(
      ApiResponse.success(
        result.languages,
        'Active languages retrieved successfully',
        { pagination: result.pagination }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get language by ID
 * @route   GET /api/v1/languages/:id
 * @access  Public
 */
exports.getLanguageById = async (req, res, next) => {
  try {
    const language = await languageService.getLanguageById(req.params.id);

    res.status(200).json(
      ApiResponse.success(language, 'Language retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get language by slug
 * @route   GET /api/v1/languages/slug/:slug
 * @access  Public
 */
exports.getLanguageBySlug = async (req, res, next) => {
  try {
    const language = await languageService.getLanguageBySlug(req.params.slug);

    res.status(200).json(
      ApiResponse.success(language, 'Language retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update language
 * @route   PUT /api/v1/languages/:id
 * @access  Private
 */
exports.updateLanguage = async (req, res, next) => {
  try {
    const language = await languageService.updateLanguage(
      req.params.id,
      req.body,
      req.user.id
    );

    res.status(200).json(
      ApiResponse.success(language, 'Language updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete language
 * @route   DELETE /api/v1/languages/:id
 * @access  Private
 */
exports.deleteLanguage = async (req, res, next) => {
  try {
    const result = await languageService.deleteLanguage(req.params.id, req.user.id);

    res.status(200).json(
      ApiResponse.success(null, result.message)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle language status
 * @route   PATCH /api/v1/languages/:id/toggle-status
 * @access  Private
 */
exports.toggleLanguageStatus = async (req, res, next) => {
  try {
    const language = await languageService.toggleLanguageStatus(req.params.id, req.user.id);

    res.status(200).json(
      ApiResponse.success(language, `Language status changed to ${language.status}`)
    );
  } catch (error) {
    next(error);
  }
}; 