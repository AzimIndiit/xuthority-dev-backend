const mongoose = require('mongoose');

const SOCIAL_LINKS_SCHEMA = {
  linkedin: { type: String, trim: true, default: '' },
  twitter: { type: String, trim: true, default: '' },
};

const USER_ROLES = ['user', 'vendor', 'admin'];
const COMPANY_SIZES = [
  '1-10 Employees',
  '11-50 Employees',
  '51-100 Employees',
  '100-200 Employees',
  '201-500 Employees',
  '500+ Employees',
];

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  avatar: { type: String, required: false, default: '' },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: false }, // hashed
  region: { type: String, required: false, trim: true },
  description: { type: String, trim: false },
  industry: { type: String, trim: false },
  title: { type: String, trim: false },
  companyName: { type: String, trim: false },
  companySize: { type: String, enum: COMPANY_SIZES, required: false },
  companyEmail: { type: String, trim: true, default: '' },
  // Additional vendor-specific fields
  companyAvatar: { type: String, trim: true, default: '' },
  yearFounded: { type: String, trim: true, default: '' },
  hqLocation: { type: String, trim: true, default: '' },
  companyDescription: { type: String, trim: false, default: '' },
  companyWebsiteUrl: { type: String, trim: true, default: '' },
  socialLinks: {
    linkedin: { type: String, trim: true, default: '' },
    twitter: { type: String, trim: true, default: '' },
  },
  followersCount: {
    type: Number,
    default: 0,
    min: 0
  },
  followingCount: {
    type: Number,
    default: 0,
    min: 0
  },
  // Vendor statistics
  totalProducts: {
    type: Number,
    default: 0,
    min: 0
  },
  totalDisputes: {
    type: Number,
    default: 0,
    min: 0
  },
  role: { type: String, enum: USER_ROLES, default: 'user' },
  authProvider: { type: String, enum: ['email', 'google', 'linkedin'], default: 'email' },
  acceptedTerms: { type: Boolean, required: true },
  acceptedMarketing: { type: Boolean, default: false },
  accessToken: { type: String, default: '' },
  
  // Password reset fields
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  passwordResetAttempts: { type: Number, default: 0 },
  passwordResetLastAttempt: { type: Date },
  isVerified: { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('User', userSchema);
