class ApiError extends Error {
  /**
   * @param {string} message - Error message
   * @param {string} code - Application-specific error code
   * @param {number} statusCode - HTTP status code
   * @param {object} [details] - Additional error details
   */
  constructor(message, code = 'INTERNAL_ERROR', statusCode = 500, details = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
