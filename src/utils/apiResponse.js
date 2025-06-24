/**
 * Standardized API success response
 * @param {object} data - The main response data
 * @param {string} [message] - Optional success message
 * @param {object} [meta] - Optional metadata (pagination, total, etc.)
 * @returns {object}
 */
function success(data = {}, message = 'Success', meta = { pagination: {}, total: 0 }) {
  return {
    success: true,
    data,
    message,
    meta,
  };
}

module.exports = {
  success,
};
