const mongoose = require('mongoose');

const SUBSCRIPTION_STATUSES = [
  'active',
  'trialing',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
  'incomplete_expired',
  'paused'
];

const userSubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subscriptionPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true,
  },
  // Stripe subscription details
  stripeSubscriptionId: {
    type: String,
    required: function() {
      // For free plans, allow null values
      return this.priceAmount > 0;
    },
    trim: true,
  },
  stripeCustomerId: {
    type: String,
    required: true, // Always required since we create Stripe customers for all users
    trim: true,
  },
  stripePriceId: {
    type: String,
    required: function() {
      // For free plans, allow null values
      return this.priceAmount > 0;
    },
    trim: true,
  },
  // Subscription status
  status: {
    type: String,
    enum: SUBSCRIPTION_STATUSES,
    required: true,
    default: 'active',
  },
  // Billing period
  currentPeriodStart: {
    type: Date,
    required: true,
    default: Date.now,
  },
  currentPeriodEnd: {
    type: Date,
    required: true,
  },
  // Trial period
  trialStart: {
    type: Date,
  },
  trialEnd: {
    type: Date,
  },
  // Cancellation
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false,
  },
  canceledAt: {
    type: Date,
  },
  cancellationReason: {
    type: String,
    trim: true,
  },
  // Pause/resume
  pausedAt: {
    type: Date,
  },
  resumedAt: {
    type: Date,
  },
  // Pricing
  priceAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    required: true,
    uppercase: true,
    default: 'USD',
  },
  // Billing
  billingInterval: {
    type: String,
    enum: ['day', 'week', 'month', 'year'],
    required: true,
  },
  billingIntervalCount: {
    type: Number,
    default: 1,
    min: 1,
  },
  // Payment
  defaultPaymentMethod: {
    type: String,
    trim: true,
  },
  latestInvoiceId: {
    type: String,
    trim: true,
  },
  // Metadata
  metadata: {
    type: Map,
    of: String,
    default: {},
  },
  // Usage tracking
  usageMetrics: {
    productsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    reviewsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    disputesUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastResetDate: {
      type: Date,
      default: Date.now,
    },
  },
  // Notifications
  notifications: {
    trialEndingSoon: {
      type: Boolean,
      default: false,
    },
    paymentFailed: {
      type: Boolean,
      default: false,
    },
    renewalReminder: {
      type: Boolean,
      default: false,
    },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
userSubscriptionSchema.virtual('isActive').get(function() {
  return this.status === 'active' || this.status === 'trialing';
});

userSubscriptionSchema.virtual('isTrialing').get(function() {
  return this.status === 'trialing' && 
         this.trialEnd && 
         new Date() < this.trialEnd;
});

userSubscriptionSchema.virtual('isCanceled').get(function() {
  return this.status === 'canceled' || this.cancelAtPeriodEnd;
});

userSubscriptionSchema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const endDate = this.currentPeriodEnd;
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

userSubscriptionSchema.virtual('isExpired').get(function() {
  return new Date() > this.currentPeriodEnd;
});

userSubscriptionSchema.virtual('trialDaysRemaining').get(function() {
  if (!this.trialEnd) return 0;
  const now = new Date();
  const diffTime = this.trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Methods
userSubscriptionSchema.methods.isWithinLimits = function(type) {
  const plan = this.subscriptionPlan;
  if (!plan) return true;
  
  const usage = this.usageMetrics;
  
  switch (type) {
    case 'products':
      return plan.maxProducts === -1 || usage.productsUsed < plan.maxProducts;
    case 'reviews':
      return plan.maxReviews === -1 || usage.reviewsUsed < plan.maxReviews;
    case 'disputes':
      return plan.maxDisputes === -1 || usage.disputesUsed < plan.maxDisputes;
    default:
      return true;
  }
};

userSubscriptionSchema.methods.incrementUsage = function(type) {
  const usage = this.usageMetrics;
  
  switch (type) {
    case 'products':
      usage.productsUsed += 1;
      break;
    case 'reviews':
      usage.reviewsUsed += 1;
      break;
    case 'disputes':
      usage.disputesUsed += 1;
      break;
  }
  
  this.markModified('usageMetrics');
  return this.save();
};

userSubscriptionSchema.methods.resetUsage = function() {
  this.usageMetrics = {
    productsUsed: 0,
    reviewsUsed: 0,
    disputesUsed: 0,
    lastResetDate: new Date(),
  };
  this.markModified('usageMetrics');
  return this.save();
};

// Static methods
userSubscriptionSchema.statics.findActiveSubscription = function(userId) {
  return this.findOne({
    user: userId,
    status: { $in: ['active', 'trialing'] },
    currentPeriodEnd: { $gt: new Date() },
  }).populate('subscriptionPlan');
};

userSubscriptionSchema.statics.findByStripeSubscriptionId = function(stripeSubscriptionId) {
  return this.findOne({ stripeSubscriptionId }).populate(['user', 'subscriptionPlan']);
};

// Indexes
userSubscriptionSchema.index({ user: 1, status: 1 });
userSubscriptionSchema.index({ stripeSubscriptionId: 1 });
userSubscriptionSchema.index({ stripeCustomerId: 1 });
userSubscriptionSchema.index({ currentPeriodEnd: 1 });
userSubscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

// Pre-save middleware
userSubscriptionSchema.pre('save', function(next) {
  // Set current period end if not set
  if (!this.currentPeriodEnd) {
    const now = new Date();
    
    // For trial subscriptions, set to trial end
    if (this.status === 'trialing' && this.trialEnd) {
      this.currentPeriodEnd = this.trialEnd;
    } else {
      // Calculate based on billing interval
      const end = new Date(now);
      
      switch (this.billingInterval) {
        case 'day':
          end.setDate(end.getDate() + this.billingIntervalCount);
          break;
        case 'week':
          end.setDate(end.getDate() + (this.billingIntervalCount * 7));
          break;
        case 'month':
          end.setMonth(end.getMonth() + this.billingIntervalCount);
          break;
        case 'year':
          end.setFullYear(end.getFullYear() + this.billingIntervalCount);
          break;
      }
      
      this.currentPeriodEnd = end;
    }
  }
  
  next();
});

module.exports = mongoose.model('UserSubscription', userSubscriptionSchema); 