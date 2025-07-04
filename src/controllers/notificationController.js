const Notification = require('../models/Notification');
const ApiResponse = require('../utils/apiResponse');

// List notifications for current user (paginated)
exports.listNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ userId })
    ]);
    return res.json(ApiResponse.success(
      notifications,
      'Notifications retrieved',
      { pagination: { page, limit }, total }
    ));
  } catch (err) {
    next(err);
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json(ApiResponse.success(null, 'Notification not found'));
    }
    return res.json(ApiResponse.success(notification, 'Notification marked as read'));
  } catch (err) {
    next(err);
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    return res.json(ApiResponse.success(null, 'All notifications marked as read'));
  } catch (err) {
    next(err);
  }
};

// Get unread notifications count
exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const count = await Notification.countDocuments({ userId, isRead: false });
    return res.json(ApiResponse.success({ count }, 'Unread notifications count retrieved'));
  } catch (err) {
    next(err);
  }
};

// Delete a notification
exports.deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, userId });
    if (!notification) {
      return res.status(404).json(ApiResponse.success(null, 'Notification not found'));
    }
    return res.json(ApiResponse.success(null, 'Notification deleted successfully'));
  } catch (err) {
    next(err);
  }
}; 