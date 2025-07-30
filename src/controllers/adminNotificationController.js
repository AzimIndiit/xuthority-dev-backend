const AdminNotification = require('../models/AdminNotification');
const ApiResponse = require('../utils/apiResponse');

// List notifications for admin
exports.listAdminNotifications = async (req, res, next) => {
  try {
    const adminId = req.user._id; // Admin ID from auth middleware
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const [notifications, total] = await Promise.all([
      AdminNotification.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(), // Use lean() to get plain JavaScript objects
      AdminNotification.countDocuments({})
    ]);
    
    // Add isRead property for current admin
    const notificationsWithReadStatus = notifications.map(notification => ({
      ...notification,
      isRead: notification.readBy && notification.readBy.some(
        read => read.adminId.toString() === adminId.toString()
      )
    }));
    
    return res.json(ApiResponse.success(
      notificationsWithReadStatus,
      'Admin notifications retrieved',
      { pagination: { page, limit }, total }
    ));
  } catch (err) {
    next(err);
  }
};

// Mark an admin notification as read
exports.markAdminNotificationAsRead = async (req, res, next) => {
  try {
    const adminId = req.user._id;
    const notificationId = req.params.id;
    
    // Check if already marked as read by this admin
    const notification = await AdminNotification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json(ApiResponse.success(null, 'Notification not found'));
    }
    
    // Add admin to readBy array if not already there
    const alreadyRead = notification.readBy.some(
      read => read.adminId.toString() === adminId.toString()
    );
    
    if (!alreadyRead) {
      notification.readBy.push({
        adminId: adminId,
        readAt: new Date()
      });
      await notification.save();
    }
    
    return res.json(ApiResponse.success(notification, 'Notification marked as read'));
  } catch (err) {
    next(err);
  }
};

// Mark all admin notifications as read
exports.markAllAdminNotificationsAsRead = async (req, res, next) => {
  try {
    const adminId = req.user._id;
    
    // Get all unread notifications for this admin
    const notifications = await AdminNotification.find({
      'readBy.adminId': { $ne: adminId }
    });
    
    // Mark each as read by this admin
    const updatePromises = notifications.map(notification => {
      notification.readBy.push({
        adminId: adminId,
        readAt: new Date()
      });
      return notification.save();
    });
    
    await Promise.all(updatePromises);
    
    return res.json(ApiResponse.success(null, 'All notifications marked as read'));
  } catch (err) {
    next(err);
  }
};

// Get unread admin notifications count
exports.getAdminUnreadCount = async (req, res, next) => {
  try {
    const adminId = req.user._id;
    
    // Count notifications not read by this admin
    const count = await AdminNotification.countDocuments({
      'readBy.adminId': { $ne: adminId }
    });
    
    return res.json(ApiResponse.success({ count }, 'Unread notifications count retrieved'));
  } catch (err) {
    next(err);
  }
};