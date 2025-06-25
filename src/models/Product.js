const mongoose = require('mongoose');
const slugify = require('slugify');

// Define enums based on common industry standards
const SOFTWARE_CATEGORIES = [
  'SaaS',
  'Desktop Application',
  'Mobile App',
  'Web Application',
  'API/Service',
  'Plugin/Extension',
  'Other'
];

const SOLUTIONS = [
  'Analytics',
  'CRM',
  'E-commerce',
  'Marketing',
  'Sales',
  'HR',
  'Finance',
  'Project Management',
  'Communication',
  'Security',
  'DevOps',
  'Other'
];

const WHO_CAN_USE = [
  'Small Business',
  'Medium Business',
  'Enterprise',
  'Startups',
  'Freelancers',
  'Developers',
  'Marketers',
  'Sales Teams',
  'Everyone'
];

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Retail',
  'Manufacturing',
  'Real Estate',
  'Marketing',
  'Consulting',
  'Non-profit',
  'Government',
  'Other'
];

const INTEGRATIONS = [
  'Slack',
  'Microsoft Teams',
  'Google Workspace',
  'Salesforce',
  'HubSpot',
  'Zapier',
  'API',
  'Webhooks',
  'Custom',
  'None'
];

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Chinese',
  'Japanese',
  'Korean',
  'Russian',
  'Arabic',
  'Hindi',
  'Multi-language'
];

const MARKET_SEGMENTS = [
  'SMB',
  'Mid-Market',
  'Enterprise',
  'Startup',
  'Government',
  'Education',
  'Non-profit',
  'Global'
];

const PRODUCT_STATUS = [
  'draft',
  'published',
  'archived',
  'pending_review'
];

// Feature schema for product features
const featureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  }
}, { _id: true });

// Pricing plan schema
const pricingPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
  },
  billingPeriod: {
    type: String,
    enum: ['monthly', 'yearly', 'one-time', 'custom'],
    default: 'monthly'
  },
  seats: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  description: {
    type: String,
    trim: true,
    maxlength: 300
  },
  features: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  isPopular: {
    type: Boolean,
    default: false
  }
}, { _id: true });

// Media schema for logos and other media
const mediaSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['logo', 'screenshot', 'video', 'demo', 'other'],
    required: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  filename: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    trim: true,
    maxlength: 200
  }
}, { _id: true });

// Main Product schema
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  website: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Website must be a valid URL'
    }
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: 200
  },
  software: {
    type: String,
    enum: SOFTWARE_CATEGORIES,
    required: true
  },
  solutions: [{
    type: String,
    enum: SOLUTIONS
  }],
  whoCanUse: [{
    type: String,
    enum: WHO_CAN_USE
  }],
  industries: [{
    type: String,
    enum: INDUSTRIES
  }],
  integrations: [{
    type: String,
    enum: INTEGRATIONS
  }],
  languages: [{
    type: String,
    enum: LANGUAGES
  }],
  marketSegment: [{
    type: String,
    enum: MARKET_SEGMENTS
  }],
  brandColors: {
    primary: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^#([0-9A-F]{3}){1,2}$/i.test(v);
        },
        message: 'Primary color must be a valid hex color'
      }
    },
    secondary: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^#([0-9A-F]{3}){1,2}$/i.test(v);
        },
        message: 'Secondary color must be a valid hex color'
      }
    }
  },
  media: [mediaSchema],
  features: [featureSchema],
  pricing: [pricingPlanSchema],
  
  // Vendor information
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Product metrics
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Status and visibility
  status: {
    type: String,
    enum: PRODUCT_STATUS,
    default: 'draft',
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // SEO and metadata
  metaTitle: {
    type: String,
    trim: true,
    maxlength: 60
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: 160
  },
  keywords: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Dates
  publishedAt: {
    type: Date
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for better query performance
productSchema.index({ vendor: 1, status: 1 });
productSchema.index({ status: 1, isActive: 1, publishedAt: -1 });
productSchema.index({ industries: 1 });
productSchema.index({ marketSegment: 1 });
productSchema.index({ solutions: 1 });
productSchema.index({ software: 1 });
productSchema.index({ keywords: 1 });
productSchema.index({ name: 'text', description: 'text', keywords: 'text' });

// Generate slug from name before saving
productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
  }
  
  // Update lastUpdated
  this.lastUpdated = new Date();
  
  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Virtual for logo URL
productSchema.virtual('logoUrl').get(function() {
  const logo = this.media.find(m => m.type === 'logo');
  return logo ? logo.url : null;
});

// Virtual for main screenshot
productSchema.virtual('mainScreenshot').get(function() {
  const screenshot = this.media.find(m => m.type === 'screenshot');
  return screenshot ? screenshot.url : null;
});

// Virtual for vendor company name
productSchema.virtual('vendorName', {
  ref: 'User',
  localField: 'vendor',
  foreignField: '_id',
  justOne: true,
  options: { select: 'firstName lastName companyName' }
});

// Static methods
productSchema.statics.findPublished = function() {
  return this.find({ 
    status: 'published', 
    isActive: true 
  }).populate('vendor', 'firstName lastName companyName email');
};

productSchema.statics.findByVendor = function(vendorId) {
  return this.find({ vendor: vendorId })
    .populate('vendor', 'firstName lastName companyName email');
};

productSchema.statics.search = function(query, options = {}) {
  const {
    software,
    industries,
    marketSegment,
    solutions,
    page = 1,
    limit = 10
  } = options;
  
  let filter = {
    status: 'published',
    isActive: true
  };
  
  if (query) {
    filter.$text = { $search: query };
  }
  
  if (software) filter.software = software;
  if (industries && industries.length) filter.industries = { $in: industries };
  if (marketSegment && marketSegment.length) filter.marketSegment = { $in: marketSegment };
  if (solutions && solutions.length) filter.solutions = { $in: solutions };
  
  return this.find(filter)
    .populate('vendor', 'firstName lastName companyName')
    .sort(query ? { score: { $meta: 'textScore' } } : { publishedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Instance methods
productSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

productSchema.methods.toggleLike = function() {
  // This could be expanded to track individual user likes
  this.likes = this.likes > 0 ? this.likes - 1 : this.likes + 1;
  return this.save();
};

module.exports = mongoose.model('Product', productSchema); 