// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
};

// User Role Constants
const USER_ROLES = {
  ADMIN: 'admin',
  VENDOR: 'vendor',
  USER: 'user'
};

// Cache Keys
const CACHE_KEYS = {
  USER_PREFIX: 'user:',
  PRODUCT_PREFIX: 'product:',
  REVIEW_PREFIX: 'review:',
  DISPUTE_PREFIX: 'dispute:'
};

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
  SHORT: 300,    // 5 minutes
  MEDIUM: 1800,  // 30 minutes
  LONG: 3600     // 1 hour
};

// Dispute Messages
const DISPUTE_MESSAGES = {
  CREATED_SUCCESSFULLY: 'Dispute created successfully',
  UPDATED_SUCCESSFULLY: 'Dispute updated successfully',
  DELETED_SUCCESSFULLY: 'Dispute deleted successfully',
  NOT_FOUND: 'Dispute not found',
  REVIEW_NOT_FOUND: 'Product review not found',
  NOT_PRODUCT_OWNER: 'You can only dispute reviews for your own products',
  DISPUTE_ALREADY_EXISTS: 'You have already disputed this review',
  CREATE_FAILED: 'Failed to create dispute',
  UPDATE_FAILED: 'Failed to update dispute',
  DELETE_FAILED: 'Failed to delete dispute',
  FETCH_FAILED: 'Failed to fetch disputes'
};

// Product Review Messages
const REVIEW_MESSAGES = {
  CREATED_SUCCESSFULLY: 'Review created successfully',
  UPDATED_SUCCESSFULLY: 'Review updated successfully',
  DELETED_SUCCESSFULLY: 'Review deleted successfully',
  NOT_FOUND: 'Review not found',
  ALREADY_REVIEWED: 'You have already reviewed this product',
  CANNOT_REVIEW_OWN_PRODUCT: 'You cannot review your own product'
};

// General Messages
const GENERAL_MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  ERROR: 'An error occurred',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Internal server error'
};

module.exports = {
  HTTP_STATUS,
  USER_ROLES,
  CACHE_KEYS,
  CACHE_TTL,
  DISPUTE_MESSAGES,
  REVIEW_MESSAGES,
  GENERAL_MESSAGES
};
