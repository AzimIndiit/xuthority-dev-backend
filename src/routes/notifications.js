const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth } = require('../middleware');

// List notifications (paginated)
router.get('/', auth, notificationController.listNotifications);
// Mark a notification as read
router.patch('/:id/read', auth, notificationController.markAsRead);
// Mark all as read
router.patch('/read-all', auth, notificationController.markAllAsRead);

module.exports = router; 