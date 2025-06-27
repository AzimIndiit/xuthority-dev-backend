const Notification = require('../models/Notification');

/**
 * Create a notification for a user
 * @param {Object} params
 * @param {ObjectId} params.userId - Recipient user
 * @param {String} params.type - Notification type
 * @param {String} params.title - Notification title
 * @param {String} params.message - Notification message
 * @param {Object} [params.meta] - Extra data (optional)
 * @param {String} [params.actionUrl] - Action URL (optional)
 * @param {String} [params.status] - Notification status (default: 'sent')
 */
async function createNotification({ userId, type, title, message, meta = {}, actionUrl = '', status = 'sent' }) {
  return Notification.create({
    userId,
    type,
    title,
    message,
    meta,
    actionUrl,
    status
  });
}

module.exports = {
  createNotification,
};
