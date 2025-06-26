const mongoose = require('mongoose');
const slugify = require('slugify');

const industrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Industry name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Industry name must be at least 2 characters'],
    maxlength: [100, 'Industry name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  category: {
    type: String,
    enum: ['software', 'solution'],
    required: [true, 'Industry category is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
industrySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-save middleware to generate slug
industrySchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    // Generate slug from name using slugify
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'\"!:@]/g
    });
    

  }
  next();
});

// Index for better query performance
// Removed duplicate indexes for name and slug (already indexed by unique: true)
industrySchema.index({ status: 1 });
industrySchema.index({ category: 1 });
industrySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Industry', industrySchema); 