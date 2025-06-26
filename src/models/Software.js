const mongoose = require('mongoose');
const slugify = require('slugify');

const softwareSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Software name is required'],
    trim: true,
    unique: true,
    maxLength: [100, 'Software name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
softwareSchema.index({ name: 'text' });
softwareSchema.index({ status: 1 });
softwareSchema.index({ createdBy: 1 });
softwareSchema.index({ createdAt: -1 });

// Pre-save middleware to generate slug
softwareSchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    // Generate slug from name using slugify
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
    
    // Add timestamp if needed for uniqueness
    // if (this.isNew) {
    //   this.slug += '-' + Date.now();
    // }
  }
  next();
});

// Virtual for formatted creation date
softwareSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt ? this.createdAt.toLocaleDateString() : '';
});

// Static method to find active software
softwareSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Instance method to toggle status
softwareSchema.methods.toggleStatus = function() {
  this.status = this.status === 'active' ? 'inactive' : 'active';
  return this.save();
};

module.exports = mongoose.model('Software', softwareSchema); 