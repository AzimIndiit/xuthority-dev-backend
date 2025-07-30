const AdminNotification = require('../models/AdminNotification');

/**
 * Create a single notification for all admins
 * @param {Object} params
 * @param {String} params.type - Notification type
 * @param {String} params.title - Notification title
 * @param {String} params.message - Notification message
 * @param {Object} [params.meta] - Extra data (optional)
 * @param {String} [params.actionUrl] - Action URL (optional)
 */
async function createAdminNotification({ type, title, message, meta = {}, actionUrl = '' }) {
  try {
    const notification = await AdminNotification.create({
      type,
      title,
      message,
      meta,
      actionUrl
    });
    
    return notification;
  } catch (error) {
    console.error('Error creating admin notification:', error);
    throw error;
  }
}

/**
 * Create notification for new review
 * @param {Object} review - Review object
 * @param {Object} product - Product object
 * @param {Object} reviewer - Reviewer object
 */
async function notifyAdminsNewReview(review, product, reviewer) {
  return createAdminNotification({
    type: 'PRODUCT_REVIEW',
    title: 'New Review Received',
    message: `${reviewer.name || 'A user'} has posted a review for ${product.name || 'a product'}. Visit the reviews section to read and moderate it.`,
    meta: { 
      reviewId: review._id.toString(), 
      productId: product._id.toString(),
      reviewerId: reviewer._id.toString(),
      reviewerName: reviewer.name || 'Unknown',
      productName: product.name || 'Unknown'
    },
    actionUrl: `/reviews/${review._id}`
  });
}

/**
 * Create notification for new user registration
 * @param {Object} user - New user object
 */
async function notifyAdminsNewUser(user) {
  const roleText = user.role === 'vendor' ? 'vendor' : 'user';
  const type = user.role === 'vendor' ? 'VENDOR_REGISTRATION' : 'USER_REGISTRATION';
  const title = user.role === 'vendor' ? 'New Vendor Application' : 'New User Joined';
  const message = user.role === 'vendor' 
    ? `A new vendor ${user.name || 'Unknown'} has registered and is awaiting approval. Review their details in the vendor section.`
    : `A new user ${user.name || 'Unknown'} has successfully registered on the platform. View their profile in the user management panel.`;

  return createAdminNotification({
    type,
    title,
    message,
    meta: { 
      userId: user._id.toString(),
      userRole: user.role,
      userEmail: user.email,
      userName: user.name || 'Unknown'
    },
    actionUrl: `/users/${user._id}`
  });
}

/**
 * Create notification for badge request
 * @param {Object} badge - Badge object
 * @param {Object} user - User requesting badge
 */
async function notifyAdminsBadgeRequest(badge, user) {
  return createAdminNotification({
    type: 'BADGE_REQUEST',
    title: 'New Badge Request',
    message: `${user.name || 'A vendor'} has requested the "${badge.title || 'Unknown'}" badge. Review the request in the Badges section.`,
    meta: { 
      badgeId: badge._id.toString(),
      userId: user._id.toString(),
      badgeName: badge.title || 'Unknown',
      userName: user.name || 'Unknown'
    },
    actionUrl: `/badges/requests`
  });
}

/**
 * Create notification for successful payment
 * @param {Object} payment - Payment details
 * @param {Object} user - User who made payment
 */
async function notifyAdminsPaymentSuccess(payment, user) {
  return createAdminNotification({
    type: 'PAYMENT_SUCCESS',
    title: 'Payment Received',
    message: `A payment of $${payment.amount || '0'} was received from ${user.name || 'Unknown'} for ${payment.description || 'Unknown'}.`,
    meta: { 
      paymentId: payment._id ? payment._id.toString() : 'unknown',
      userId: user._id.toString(),
      amount: payment.amount || 0,
      currency: payment.currency || 'USD',
      userName: user.name || 'Unknown'
    },
    actionUrl: `/payments`
  });
}

module.exports = {
  createAdminNotification,
  notifyAdminsNewReview,
  notifyAdminsNewUser,
  notifyAdminsBadgeRequest,
  notifyAdminsPaymentSuccess
};