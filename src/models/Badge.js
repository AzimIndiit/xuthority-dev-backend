const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true, trim: true },
  icon: { type: String, required: true, trim: true },
  colorCode: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Badge', badgeSchema); 