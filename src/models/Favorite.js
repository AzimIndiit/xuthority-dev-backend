const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  listName: {
    type: String,
    required: true,
    trim: true,
    default: 'Favorite List',
    maxLength: 100
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true,
    maxLength: 500
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to prevent duplicate favorites in same list
favoriteSchema.index({ userId: 1, productId: 1, listName: 1 }, { unique: true });

// Index for efficient lookups
favoriteSchema.index({ userId: 1, listName: 1 });
favoriteSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Favorite', favoriteSchema); 