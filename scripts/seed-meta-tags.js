const mongoose = require('mongoose');
const MetaTag = require('../src/models/MetaTag');
const Admin = require('../src/models/Admin');
require('dotenv').config();

// Sample meta tags data
const sampleMetaTags = [
  {
    pageName: 'Landing Page',
    metaTitle: 'Discover Top Business Software',
    metaDescription: 'Discover top-rated business software tailored to your needs. Compare features, explore verified solutions, and read trusted user reviews.'
  },
  {
    pageName: 'About Us',
    metaTitle: 'About Xuthority',
    metaDescription: 'Learn how Xuthority connects businesses with trusted software solutions through comprehensive reviews and comparisons.'
  },
  {
    pageName: 'Softwares',
    metaTitle: 'Best Software by Category',
    metaDescription: 'Explore and compare the best business software solutions across different categories with detailed reviews and comparisons.'
  },
  {
    pageName: 'Vendors Page',
    metaTitle: 'Verified Software Vendors',
    metaDescription: 'Explore verified software vendors, view their solutions, and connect with trusted providers for your business needs.'
  },
  {
    pageName: 'Solutions',
    metaTitle: 'Software Insights & Guides',
    metaDescription: 'Explore business solutions by category and find the right software for your needs with expert insights and guides.'
  },
  {
    pageName: 'Blog Home',
    metaTitle: 'Explore Vendor Badges',
    metaDescription: 'Explore expert insights, tips, and guides on choosing the right business software with latest trends and best practices.'
  },
  {
    pageName: 'Badge Page',
    metaTitle: 'Top Business Solutions by Category',
    metaDescription: 'Explore trusted vendor badges that highlight top-rated software providers and verify credibility and quality.'
  },
  {
    pageName: 'Login / Signup',
    metaTitle: 'Software Integrations Directory',
    metaDescription: 'Access your account or create a new one to manage your software preferences, reviews, and personalized recommendations.'
  },
  {
    pageName: 'Solutions Page',
    metaTitle: 'Top Business Solutions by Category',
    metaDescription: 'Explore verified software vendors, view their solutions, and find the perfect match for your business requirements.'
  },
  {
    pageName: 'Integrations Page',
    metaTitle: 'Software Integrations Directory',
    metaDescription: 'Seamlessly connect and integrate your favorite tools and software solutions to streamline your workflow.'
  }
];

const seedMetaTags = async (adminUserId) => {
  try {
    console.log('🌱 Starting meta tags seeding...');

    // Clear existing meta tags
    await MetaTag.deleteMany({});
    console.log('✅ Cleared existing meta tags');

    // Create meta tags with proper admin reference
    const metaTags = await MetaTag.insertMany(
      sampleMetaTags.map(metaTag => ({
        ...metaTag,
        createdBy: adminUserId,
        status: 'active'
      }))
    );

    console.log(`✅ Successfully seeded ${metaTags.length} meta tags`);
    
    // Log created meta tags
    metaTags.forEach((metaTag, index) => {
      console.log(`${index + 1}. ${metaTag.pageName} - ${metaTag.metaTitle}`);
    });

    return metaTags;
  } catch (error) {
    console.error('❌ Error seeding meta tags:', error);
    throw error;
  }
};

const main = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find or create admin user
    let adminUser = await Admin.findOne({ email: 'admin@xuthority.com' });
    
    if (!adminUser) {
      console.log('⚠️  Admin user not found. Creating default admin...');
      adminUser = await Admin.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@xuthority.com',
        password: 'admin123', // This will be hashed by the model
        role: 'super_admin'
      });
      console.log('✅ Created default admin user');
    }

    // Seed meta tags
    const metaTags = await seedMetaTags(adminUser._id);
    
    console.log('🎉 Meta tags seeding completed successfully!');
    console.log(`📊 Total meta tags created: ${metaTags.length}`);
    
  } catch (error) {
    console.error('❌ Error in seeding process:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the seeding script
if (require.main === module) {
  main();
}

module.exports = { seedMetaTags }; 