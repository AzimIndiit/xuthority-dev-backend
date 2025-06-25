const mongoose = require('mongoose');
const slugify = require('slugify');

const solutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Solution name is required'],
    trim: true,
    unique: true,
    maxLength: [100, 'Solution name cannot exceed 100 characters']
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
solutionSchema.index({ name: 'text' });
solutionSchema.index({ status: 1 });
solutionSchema.index({ createdBy: 1 });
solutionSchema.index({ createdAt: -1 });

// Pre-save middleware to generate slug
solutionSchema.pre('save', function(next) {
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
solutionSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Static method to find active solutions
solutionSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Instance method to toggle status
solutionSchema.methods.toggleStatus = function() {
  this.status = this.status === 'active' ? 'inactive' : 'active';
  return this.save();
};

module.exports = mongoose.model('Solution', solutionSchema); 