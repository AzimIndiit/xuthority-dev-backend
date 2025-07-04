const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth } = require('../middleware');

// List notifications (paginated)
router.get('/', auth, notificationController.listNotifications);
// Get unread notifications count
router.get('/unread-count', auth, notificationController.getUnreadCount);
// Mark a notification as read
router.patch('/:id/read', auth, notificationController.markAsRead);
// Mark all as read
router.patch('/read-all', auth, notificationController.markAllAsRead);
// Delete a notification
router.delete('/:id', auth, notificationController.deleteNotification);

module.exports = router; 