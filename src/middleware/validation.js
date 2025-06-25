const { validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

/**
 * Validation middleware to check express-validator results
 * @param {Array} validations - Array of validation rules
 * @param {string} source - Source of validation (body, params, query)
 * @returns {Function} Express middleware function
 */
exports.validate = (validations, source = 'body') => {
  return async (req, res, next) => {
    // Run validations
    if (Array.isArray(validations)) {
      await Promise.all(validations.map(validation => validation.run(req)));
    } else if (validations && typeof validations.run === 'function') {
      await validations.run(req);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorArray = errors.array();
      const errorDetails = errorArray.reduce((acc, error) => {
        acc[error.path] = {
          type: 'field',
          value: error.value,
          msg: error.msg,
          path: error.path,
          location: error.location,
        };
        return acc;
      }, {});

      // Use the first error message as the main error message for better UX
      const firstErrorMessage = errorArray[0]?.msg || 'Validation failed';
      
      throw new ApiError(firstErrorMessage, 'VALIDATION_ERROR', 400, errorDetails);
    }

    next();
  };
};
