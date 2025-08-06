const mongoose = require('mongoose');

const landingPageSchema = new mongoose.Schema({
  pageType: {
    type: String,
    required: true,
    enum: ['user', 'vendor', 'about'],
    index: true
  },
  sections: {
    // Hero Section
    hero: {
      heading: { type: String, required: false },
      subtext: { type: String, required: false },
      buttonText: { type: String, required: false },
      buttonLink: { type: String, required: false }
    },
    
    // Categories Section
    categories: {
      heading: { type: String, required: false },
      categories: [{
        id: { type: String, required: false },
        name: { type: mongoose.Schema.Types.ObjectId, ref:'Software',required: true },
        products: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        }],
      }]
    },
    
    // Review CTA Section
    reviewCta: {
      heading: { type: String, required: false },
      subtext: { type: String, required: false },
      buttonText: { type: String, required: false },
      buttonLink: { type: String, required: false }
    },
    
    // Insights Section
    insights: {
      heading: { type: String, required: false },
      subtext: { type: String, required: false },
      buttonText: { type: String, required: false },
      buttonLink: { type: String, required: false }
    },
    
    // Testimonials Section
    testimonials: {
      heading: { type: String, required: false },
      testimonials: [{
        id: { type: String, required: false },
        text: { type: String, required: false },
        userName: { type: String, required: false },
        userImage: { type: String, required: false }
      }]
    },
    
    // Vendor CTA Section
    vendorCta: {
      heading: { type: String, required: false },
      subtext: { type: String, required: false },
      buttonText: { type: String, required: false },
      buttonLink: { type: String, required: false }
    },
    
    // Popular Software & Solutions Section
    popular: {
      heading: { type: String, required: false },
      subtext: { type: String, required: false },
      solutions: [{
        id: { type: String, required: false },
        // Allow referencing either a Software or a Solution
        software: { type: mongoose.Schema.Types.ObjectId, ref: 'Software', required: false },
        solution: { type: mongoose.Schema.Types.ObjectId, ref: 'Solution', required: false },
        // Allow multiple products per solution/software
        products: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: false,
        }],
      }]
    },
    
    // Features Section
    features: {
      title: { type: String, required: false },
      subtitle: { type: String, required: false },
      features: [{
        title: { type: String, required: false },
        description: { type: String, required: false },
        icon: { type: String, required: false }
      }]
    },
    
    // Pricing Section
    pricing: {
      title: { type: String, required: false },
      plans: [{
        name: { type: String, required: false },
        price: { type: String, required: false },
        features: [{ type: String }]
      }]
    },
    
    // CTA Section
    cta: {
      heading: { type: String, required: false },
      subheading: { type: String, required: false },
      primaryButtonText: { type: String, required: false },
      primaryButtonLink: { type: String, required: false },
      secondaryButtonText: { type: String, required: false },
      secondaryButtonLink: { type: String, required: false }
    },
    
    // Mission Section
    mission: {
      heading: { type: String, required: false },
      content: { type: String, required: false },
      image: { type: String, required: false }
    },
    
    // Mission Support Section
    missionSupport: {
      heading: { type: String, required: false },
      subtext: { type: String, required: false },
      buttonText: { type: String, required: false },
      buttonLink: { type: String, required: false }
    },
    
    // Values Section
    values: {
      heading: { type: String, required: false },
      cards: [{
        id: { type: String, required: false },
        heading: { type: String, required: false },
        subtext: { type: String, required: false }
      }],
      buttonText: { type: String, required: false },
      buttonLink: { type: String, required: false }
    },
    
    // Team Section
    team: {
      title: { type: String, required: false },
      members: [{
        name: { type: String, required: false },
        role: { type: String, required: false },
        bio: { type: String, required: false },
        image: { type: String, required: false }
      }]
    },
    
    // Contact Section
    contact: {
      title: { type: String, required: false },
      email: { type: String, required: false },
      phone: { type: String, required: false },
      address: { type: String, required: false },
      hours: { type: String, required: false }
    },
    
    // Vendor-specific sections
    trustedTech: {
      heading: { type: String, required: false },
      cards: [{
        id: { type: String, required: false },
        heading: { type: String, required: false },
        subtext: { type: String, required: false }
      }],
      buttonText: { type: String, required: false },
      buttonLink: { type: String, required: false }
    },
    
    reachBuyers: {
      heading: { type: String, required: false },
      subtext: { type: String, required: false },
      buttonText: { type: String, required: false },
      buttonLink: { type: String, required: false }
    }
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
landingPageSchema.index({ pageType: 1 });
landingPageSchema.index({ updatedAt: -1 });

// Ensure only one document per pageType
landingPageSchema.index({ pageType: 1 }, { unique: true });

// Static method to get or create a landing page
landingPageSchema.statics.getOrCreate = async function(pageType) {
  let page = await this.findOne({ pageType });
  if (!page) {
    page = await this.create({ pageType, sections: {} });
  }
  return page;
};

// Instance method to update a specific section
landingPageSchema.methods.updateSection = async function(sectionName, sectionData) {
  if (!this.sections[sectionName]) {
    throw new Error(`Invalid section: ${sectionName}`);
  }
  
  this.sections[sectionName] = sectionData;
  this.markModified(`sections.${sectionName}`);
  
  return await this.save();
};

const LandingPage = mongoose.model('LandingPage', landingPageSchema);

module.exports = LandingPage;