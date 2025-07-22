const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  firstName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  lastName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastLogin: { 
    type: Date, 
    default: null 
  },
  accessToken: { 
    type: String, 
    default: '' 
  },
  // Password reset fields
  passwordResetToken: { 
    type: String 
  },
  passwordResetExpires: { 
    type: Date 
  },
  // Admin notes
  notes: { 
    type: String, 
    default: '',
    trim: true 
  },
  // Profile avatar
  avatar: { 
    type: String, 
    default: '' 
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.accessToken;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Virtual for full name
adminSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Index for better query performance
adminSchema.index({ email: 1 });
adminSchema.index({ isActive: 1 });

module.exports = mongoose.model('Admin', adminSchema); 