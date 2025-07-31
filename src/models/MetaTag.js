const mongoose = require('mongoose');

const META_TAG_STATUS = ['active', 'inactive'];

const metaTagSchema = new mongoose.Schema({
  pageName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  metaTitle: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60,
    index: true
  },
  metaDescription: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160
  },
  status: {
    type: String,
    enum: META_TAG_STATUS,
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
metaTagSchema.index({ pageName: 1, status: 1 });
metaTagSchema.index({ status: 1 });
metaTagSchema.index({ updatedAt: -1 });

// Static method to find active meta tags
metaTagSchema.statics.findActive = function() {
  return this.find({ status: 'active' }).sort({ pageName: 1 });
};

// Instance method to toggle status
metaTagSchema.methods.toggleStatus = function() {
  this.status = this.status === 'active' ? 'inactive' : 'active';
  return this.save();
};

const MetaTag = mongoose.model('MetaTag', metaTagSchema);

module.exports = MetaTag; 