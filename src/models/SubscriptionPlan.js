const mongoose = require('mongoose');

const PLAN_TYPES = ['free', 'basic', 'standard', 'premium'];
const BILLING_INTERVALS = ['day', 'week', 'month', 'year'];

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  planType: {
    type: String,
    enum: PLAN_TYPES,
    required: true,
  },
  price: {
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
  billingInterval: {
    type: String,
    enum: BILLING_INTERVALS,
    required: true,
  },
  billingIntervalCount: {
    type: Number,
    default: 1,
    min: 1,
  },
  trialPeriodDays: {
    type: Number,
    default: 0,
    min: 0,
  },
  features: [{
    type: String,
    trim: true,
  }],
  // Stripe integration
  stripePriceId: {
    type: String,
    required: function() {
      return this.planType !== 'free';
    },
    trim: true,
  },
  stripeProductId: {
    type: String,
    required: function() {
      return this.planType !== 'free';
    },
    trim: true,
  },
  // Plan limitations
  maxProducts: {
    type: Number,
    default: -1, // -1 means unlimited
  },
  maxReviews: {
    type: Number,
    default: -1, // -1 means unlimited
  },
  maxDisputes: {
    type: Number,
    default: -1, // -1 means unlimited
  },
  // Plan status
  isActive: {
    type: Boolean,
    default: true,
  },
  isPopular: {
    type: Boolean,
    default: false,
  },
  // Sorting and display
  sortOrder: {
    type: Number,
    default: 0,
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted price
subscriptionPlanSchema.virtual('formattedPrice').get(function() {
  if (this.price === 0) {
    return 'Free';
  }
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency,
  });
  
  return formatter.format(this.price);
});

// Virtual for billing period text
subscriptionPlanSchema.virtual('billingPeriodText').get(function() {
  if (this.price === 0) {
    return this.trialPeriodDays > 0 ? `for ${this.trialPeriodDays} days` : '';
  }
  
  const interval = this.billingInterval;
  const count = this.billingIntervalCount;
  
  if (count === 1) {
    return interval === 'month' ? 'monthly' : 
           interval === 'year' ? 'yearly' : 
           interval === 'week' ? 'weekly' : 
           interval === 'day' ? 'daily' : interval;
  }
  
  return `every ${count} ${interval}s`;
});

// Index for efficient querying
subscriptionPlanSchema.index({ planType: 1, isActive: 1 });
subscriptionPlanSchema.index({ sortOrder: 1 });
subscriptionPlanSchema.index({ stripePriceId: 1 });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema); 