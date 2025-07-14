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
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        statusCode = 413; // Payload Too Large
        message = 'File too large. Please reduce file size or use image compression.';
        code = 'FILE_TOO_LARGE';
        details = { 
          maxSize: '100MB',
          suggestion: 'Try uploading a smaller file or use image compression'
        };
        break;
      case 'LIMIT_FILE_COUNT':
        statusCode = 400;
        message = 'Too many files uploaded';
        code = 'TOO_MANY_FILES';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        statusCode = 400;
        message = 'Unexpected file field';
        code = 'UNEXPECTED_FILE_FIELD';
        break;
      case 'LIMIT_PART_COUNT':
        statusCode = 400;
        message = 'Too many parts in multipart data';
        code = 'TOO_MANY_PARTS';
        break;
      case 'LIMIT_FIELD_KEY':
        statusCode = 400;
        message = 'Field name too long';
        code = 'FIELD_NAME_TOO_LONG';
        break;
      case 'LIMIT_FIELD_VALUE':
        statusCode = 400;
        message = 'Field value too long';
        code = 'FIELD_VALUE_TOO_LONG';
        break;
      case 'LIMIT_FIELD_COUNT':
        statusCode = 400;
        message = 'Too many fields';
        code = 'TOO_MANY_FIELDS';
        break;
      default:
        statusCode = 400;
        message = err.message || 'Upload error occurred';
        code = 'UPLOAD_ERROR';
    }
  }

  // Handle image processing errors
  if (err.code === 'IMAGE_PROCESSING_ERROR' || err.code === 'IMAGE_VALIDATION_ERROR') {
    statusCode = err.statusCode || 400;
    message = err.message || 'Image processing failed';
    code = err.code;
    details = {
      suggestion: 'Please try uploading a different image or check image format',
      supportedFormats: ['JPEG', 'PNG', 'GIF', 'WebP', 'TIFF', 'BMP']
    };
  }

  // Handle image processing specific errors
  if (err.code === 'IMAGE_TOO_LARGE') {
    statusCode = 413;
    message = err.message || 'Image file size too large';
    code = 'IMAGE_TOO_LARGE';
    details = {
      maxSize: '50MB',
      suggestion: 'Please compress the image or use a smaller file'
    };
  }

  if (err.code === 'IMAGE_DIMENSIONS_TOO_LARGE') {
    statusCode = 400;
    message = err.message || 'Image dimensions too large';
    code = 'IMAGE_DIMENSIONS_TOO_LARGE';
    details = {
      maxDimensions: '5000x5000',
      suggestion: 'Please resize the image to smaller dimensions'
    };
  }

  if (err.code === 'UNSUPPORTED_IMAGE_FORMAT') {
    statusCode = 400;
    message = err.message || 'Unsupported image format';
    code = 'UNSUPPORTED_IMAGE_FORMAT';
    details = {
      supportedFormats: ['JPEG', 'PNG', 'GIF', 'WebP', 'TIFF', 'BMP'],
      suggestion: 'Please convert the image to a supported format'
    };
  }

  // Handle S3 upload errors
  if (err.code === 'S3_UPLOAD_FAILED') {
    statusCode = 500;
    message = 'Failed to upload file to cloud storage';
    code = 'S3_UPLOAD_FAILED';
    details = {
      suggestion: 'Please try uploading again or contact support if the issue persists'
    };
  }

  // Handle video processing errors
  if (err.code === 'VIDEO_PROCESSING_ERROR' || err.code === 'VIDEO_VALIDATION_ERROR') {
    statusCode = err.statusCode || 400;
    message = err.message || 'Video processing failed';
    code = err.code;
    details = {
      suggestion: 'Please try uploading a different video or check video format',
      supportedFormats: ['MP4', 'AVI', 'MOV', 'WMV', 'FLV', 'WebM', 'MKV', 'MPEG', 'MPG', '3GP']
    };
  }

  // Handle video-specific errors
  if (err.code === 'VIDEO_TOO_LARGE') {
    statusCode = 413;
    message = err.message || 'Video file size too large';
    code = 'VIDEO_TOO_LARGE';
    details = {
      maxSize: '500MB',
      suggestion: 'Please compress the video or use a smaller file'
    };
  }

  if (err.code === 'VIDEO_DURATION_TOO_LONG') {
    statusCode = 400;
    message = err.message || 'Video duration too long';
    code = 'VIDEO_DURATION_TOO_LONG';
    details = {
      maxDuration: '10 minutes',
      suggestion: 'Please trim the video to a shorter duration'
    };
  }

  if (err.code === 'UNSUPPORTED_VIDEO_FORMAT') {
    statusCode = 400;
    message = err.message || 'Unsupported video format';
    code = 'UNSUPPORTED_VIDEO_FORMAT';
    details = {
      supportedFormats: ['MP4', 'AVI', 'MOV', 'WMV', 'FLV', 'WebM', 'MKV', 'MPEG', 'MPG', '3GP'],
      suggestion: 'Please convert the video to a supported format'
    };
  }

  if (err.code === 'VIDEO_COMPRESSION_ERROR') {
    statusCode = 500;
    message = err.message || 'Video compression failed';
    code = 'VIDEO_COMPRESSION_ERROR';
    details = {
      suggestion: 'Please try uploading again or use a different video format'
    };
  }

  if (err.code === 'THUMBNAIL_GENERATION_ERROR') {
    statusCode = 500;
    message = err.message || 'Video thumbnail generation failed';
    code = 'THUMBNAIL_GENERATION_ERROR';
    details = {
      suggestion: 'Video will be uploaded without thumbnail. Please try again later.'
    };
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
