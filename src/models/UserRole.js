const mongoose = require('mongoose');
const slugify = require('slugify');

const userRoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User role name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'User role name must be at least 2 characters'],
    maxlength: [100, 'User role name cannot exceed 100 characters']
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
userRoleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-save middleware to generate slug
userRoleSchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    // Generate slug from name using slugify
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'\"!:@]/g
    });
    
    // Add timestamp if needed for uniqueness
    // if (this.isNew) {
    //   this.slug += '-' + Date.now();
    // }
  }
  next();
});

// Index for better query performance
userRoleSchema.index({ name: 1 });
userRoleSchema.index({ slug: 1 });
userRoleSchema.index({ status: 1 });
userRoleSchema.index({ createdAt: -1 });

module.exports = mongoose.model('UserRole', userRoleSchema); 