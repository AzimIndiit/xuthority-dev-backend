const mongoose = require('mongoose');

const SOCIAL_LINKS_SCHEMA = {
  linkedin: { type: String, trim: true, default: '' },
  twitter: { type: String, trim: true, default: '' },
};

const USER_ROLES = ['user', 'vendor'];
const USER_STATUS = ['approved', 'pending', 'blocked'];
const COMPANY_SIZES = [
  '1-10 Employees',
  '11-50 Employees',
  '51-100 Employees',
  '100-200 Employees',
  '201-500 Employees',
  '500+ Employees',
];

// Helper function to generate slug from name
const generateSlug = (firstName, lastName) => {
  if (!firstName || !lastName) {
    return '';
  }
  
  const slug = `${firstName}-${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim('-'); // Remove leading/trailing hyphens
    
  return slug;
};

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  slug: { 
    type: String, 
    unique: true, 
    trim: true
  },
  avatar: { type: String, required: false, default: '' },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: false }, // hashed
  region: { type: String, required: false, trim: true },
  description: { type: String, trim: false },
  industry: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Industry',
    required: false 
  },
  title: { type: String, trim: false },
  companyName: { type: String, trim: false },
  companySize: { 
    type: String, 
    required: false,
    validate: {
      validator: function(value) {
        // Allow empty string or null/undefined
        if (!value || value === '') return true;
        // If value is provided, it must be in the allowed sizes
        return COMPANY_SIZES.includes(value);
      },
      message: 'Company size must be one of the predefined options'
    }
  },
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
  status: { 
    type: String, 
    enum: USER_STATUS, 
    default: function() {
      // Default status based on role
      return this.role === 'vendor' ? 'pending' : 'approved';
    },
    index: true // Add index for faster filtering
  },
  authProvider: { type: String, enum: ['email', 'google', 'linkedin'], default: 'email' },
  acceptedTerms: { type: Boolean, required: true },
  acceptedMarketing: { type: Boolean, default: false },
  accessToken: { type: String, default: '' },
  
  // Stripe customer ID for payment processing
  stripeCustomerId: { 
    type: String, 
    trim: true,
    default: null,
    index: true // Add index for faster lookups
  },
  
  // Password reset fields
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  passwordResetAttempts: { type: Number, default: 0 },
  passwordResetLastAttempt: { type: Date },
  isVerified: { type: Boolean, default: false },
  
  // Vendor rejection fields
  rejectionReason: { type: String, trim: true },
  rejectionDate: { type: Date },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes for better query performance
userSchema.index({ industry: 1 });
userSchema.index({ status: 1, role: 1 });
userSchema.index({ email: 1 });
userSchema.index({ slug: 1 });

// Pre-save hook to generate unique slug
userSchema.pre('save', async function(next) {
  // Only generate slug if firstName or lastName has changed, or slug doesn't exist
  if (this.isModified('firstName') || this.isModified('lastName') || !this.slug) {
    let baseSlug = generateSlug(this.firstName, this.lastName);
    
    if (!baseSlug) {
      return next(new Error('Unable to generate slug from firstName and lastName'));
    }
    
    let slug = baseSlug;
    let counter = 1;
    
    // Check for uniqueness and add counter if needed
    while (true) {
      const existingUser = await this.constructor.findOne({ 
        slug: slug, 
        _id: { $ne: this._id } // Exclude current document
      });
      
      if (!existingUser) {
        this.slug = slug;
        break;
      }
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
  
  next();
});

module.exports = mongoose.model('User', userSchema);
