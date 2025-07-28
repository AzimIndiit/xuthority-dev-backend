const mongoose = require('mongoose');
const slugify = require('slugify');

const PAGE_STATUS = ['active', 'inactive'];

const pageSchema = new mongoose.Schema({
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
    trim: true
  },
  content: {
    type: String,
    default: '',
    maxlength: 50000 // 50KB limit for content
  },
  isSystemPage: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: PAGE_STATUS,
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient querying
pageSchema.index({ name: 1, status: 1 });
pageSchema.index({ slug: 1 });
pageSchema.index({ status: 1, isSystemPage: 1 });
pageSchema.index({ updatedAt: -1 });

// Generate slug before saving if not provided
pageSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Static method to find active pages
pageSchema.statics.findActive = function() {
  return this.find({ status: 'active' }).sort({ name: 1 });
};

// Instance method to toggle status
pageSchema.methods.toggleStatus = function() {
  this.status = this.status === 'active' ? 'inactive' : 'active';
  return this.save();
};

const Page = mongoose.model('Page', pageSchema);

module.exports = Page; 