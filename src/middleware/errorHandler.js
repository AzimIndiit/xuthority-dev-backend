const logger = require('../config/logger');
const multer = require('multer');

/**
 * Global error handler middleware
 * @param {Error} err
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
function errorHandler(err, req, res, next) {
  logger.error('Error: %s', err.message, { 
    stack: err.stack, 
    url: req.url,
    method: req.method,
    ...err 
  });
  
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';
  let details = err.details || {};

  // Handle Multer errors specifically
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large';
        code = 'FILE_TOO_LARGE';
        details = { maxSize: '100MB' };
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        code = 'TOO_MANY_FILES';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        code = 'UNEXPECTED_FILE_FIELD';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in multipart data';
        code = 'TOO_MANY_PARTS';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long';
        code = 'FIELD_NAME_TOO_LONG';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long';
        code = 'FIELD_VALUE_TOO_LONG';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields';
        code = 'TOO_MANY_FIELDS';
        break;
      default:
        message = err.message || 'Upload error occurred';
        code = 'UPLOAD_ERROR';
    }
  }

  // Handle MongoDB errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  // Handle MongoDB duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'Resource already exists';
    const field = Object.keys(err.keyPattern)[0];
    details = { field, value: err.keyValue[field] };
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Handle Cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid resource ID format';
    details = { field: err.path, value: err.value };
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
    details = {};
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      statusCode,
      details,
    },
  });
}

module.exports = errorHandler;
