const AuditLog = require('../models/AuditLog');

/**
 * Log an audit event
 * @param {Object} params
 * @param {Object} [params.user] - User object (optional)
 * @param {String} params.action - Action performed (e.g., 'LOGIN')
 * @param {String} [params.target] - Target resource (e.g., 'User')
 * @param {String|Object} [params.targetId] - Target resource ID
 * @param {Object} [params.details] - Additional details
 * @param {Object} [params.req] - Express request object (optional, for IP/user-agent)
 */
async function logEvent({ user, action, target, targetId, details = {}, req }) {
  try {
    await AuditLog.create({
      userId: user?._id,
      action,
      target,
      targetId,
      details,
      ipAddress: req?.ip,
      userAgent: req?.headers['user-agent'],
    });
  } catch (err) {
    // Optionally log this error with your logger
    // logger.error('Failed to log audit event', err);
  }
}

module.exports = { logEvent };
