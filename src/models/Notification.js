const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  'WELCOME',
  'PROFILE_UPDATE',
  'PASSWORD_CHANGE',
  'PRODUCT_REVIEW',
  'REVIEW_APPROVED',
  'REVIEW_REJECTED',
  'REVIEW_FLAGGED',
  'REVIEW_DISPUTE',
  'DISPUTE_STATUS_UPDATE',
  'DISPUTE_EXPLANATION',
  'PROFILE_VERIFIED',
  'FOLLOW',
  'BADGE_REQUEST',
  'BADGE_STATUS',
  'SUBSCRIPTION_STARTED',
  'SUBSCRIPTION_UPDATED',
  'SUBSCRIPTION_CANCELED',
  'SUBSCRIPTION_RESUMED',
  'SUBSCRIPTION_ENDED',
  'SUBSCRIPTION_ERROR',
  'PAYMENT_SUCCESS',
  'PAYMENT_FAILED',
  'TRIAL_ENDING',
  'TRIAL_EXPIRED',
];

const NOTIFICATION_STATUS = ['sent', 'failed', 'pending'];

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
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
  status: {
    type: String,
    enum: NOTIFICATION_STATUS,
    default: 'sent'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema); 