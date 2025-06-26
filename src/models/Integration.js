const mongoose = require('mongoose');
const slugify = require('slugify');

const integrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Integration name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Integration name must be at least 2 characters'],
    maxlength: [100, 'Integration name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  image: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|svg|webp)$/i.test(v);
      },
      message: 'Image must be a valid URL ending with jpg, jpeg, png, gif, svg, or webp'
    }
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
integrationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-save middleware to generate slug
integrationSchema.pre('save', function(next) {
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
integrationSchema.index({ status: 1 });
integrationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Integration', integrationSchema); 