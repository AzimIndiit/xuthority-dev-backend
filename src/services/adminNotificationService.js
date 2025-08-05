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
    message: `${reviewer.name || 'A user'} has posted a review for ${product.name || 'a product'}. Visit the reviews section to read.`,
    meta: { 
      reviewId: review._id.toString(), 
      productId: product._id.toString(),
      reviewerId: reviewer._id.toString(),
      reviewerName: reviewer.name || 'Unknown',
      productName: product.name || 'Unknown'
    },
    actionUrl: 'reviews'
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
  console.log('user=======', user)
  // Create display name from firstName and lastName
  const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
  
  const message = user.role === 'vendor' 
    ? `A new user ${displayName} signup on platform as ${user.role.charAt(0).toUpperCase() + user.role.slice(1)} and is awaiting approval. Review their details in the vendor section.`
    : `A new user ${displayName} signup on platform as ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}. View their profile in the user management panel.`;

  // Set action URL based on user role - always use general route
  const actionUrl = user.role === 'vendor' ? 'vendors' : 'users';
  return createAdminNotification({
    type,
    title,
    message,
    meta: { 
      userId: user._id.toString(),
      userRole: user.role,
      userEmail: user.email,
      userName: displayName
    },
    actionUrl: actionUrl
  });
}

/**
 * Create notification for badge request
 * @param {Object} badge - Badge object
 * @param {Object} user - User requesting badge
 */
async function notifyAdminsBadgeRequest(badge, user) {
  // Create display name from firstName and lastName
  const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
  
  return createAdminNotification({
    type: 'BADGE_REQUEST',
    title: 'New Badge Request',
    message: `${displayName} has requested the "${badge.title || 'Unknown'}" badge. Review the request in the Badges section.`,
    meta: { 
      badgeId: badge._id.toString(),
      userId: user._id.toString(),
      badgeName: badge.title || 'Unknown',
      userName: displayName
    },
    actionUrl: 'badges'
  });
}

/**
 * Create notification for successful payment
 * @param {Object} payment - Payment details
 * @param {Object} user - User who made payment
 */
async function notifyAdminsPaymentSuccess(payment, user) {
  // Create display name from firstName and lastName
  const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
  
  return createAdminNotification({
    type: 'PAYMENT_SUCCESS',
    title: 'Payment Received',
    message: `A payment of $${payment.amount || '0'} was received from ${displayName} for ${payment.description || 'Unknown'}.`,
    meta: { 
      paymentId: payment._id ? payment._id.toString() : 'unknown',
      userId: user._id.toString(),
      amount: payment.amount || 0,
      currency: payment.currency || 'USD',
      userName: displayName
    },
    actionUrl: 'dashboard'
  });
}

module.exports = {
  createAdminNotification,
  notifyAdminsNewReview,
  notifyAdminsNewUser,
  notifyAdminsBadgeRequest,
  notifyAdminsPaymentSuccess
};