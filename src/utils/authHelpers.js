const config = require('../config');

/**
 * Generate error response for blocked users
 * @param {string} message - Optional custom message
 * @returns {object} Error object with support email
 */
const generateBlockedUserError = (message = 'Your account has been blocked. Please contact admin for assistance.') => {
  const supportEmail = config?.email?.supportEmail || 'support@xuthority.com';
  
  return {
    message: `${message} Support: ${supportEmail}`,
    code: 'ACCOUNT_BLOCKED',
    statusCode: 403,
    details: {
      supportEmail: supportEmail,
      reason: 'account_blocked'
    }
  };
};

/**
 * Check if user is blocked
 * @param {object} user - User object
 * @returns {boolean} True if user is blocked
 */
const isUserBlocked = (user) => {
  return user && user.status === 'blocked';
};


/**
 * Check if admin is deactivated
 * @param {object} admin - Admin object
 * @returns {boolean} True if admin is deactivated
 */
const isAdminDeactivated = (admin) => {
  return admin && admin.isActive === false;
};

module.exports = {
  generateBlockedUserError,
  isUserBlocked,
  isAdminDeactivated
}; 