const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  'PRODUCT_REVIEW',
  'USER_REGISTRATION',
  'VENDOR_REGISTRATION',
  'BADGE_REQUEST',
  'PAYMENT_SUCCESS',
  'PAYMENT_FAILED',
  'DISPUTE_CREATED',
  'DISPUTE_RESOLVED',
];

const adminNotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: NOTIFICATION_TYPES,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  meta: {
    type: Object,
    default: {}
  },
  actionUrl: {
    type: String,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for performance
adminNotificationSchema.index({ createdAt: -1 });
adminNotificationSchema.index({ type: 1 });
adminNotificationSchema.index({ isRead: 1 });

module.exports = mongoose.model('AdminNotification', adminNotificationSchema);