const mongoose = require('mongoose');
const LandingPage = require('../src/models/LandingPage');
require('dotenv').config();

/**
 * Migration script to convert old trustedTech format to new cards format
 */
async function migrateTrustedTechData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Find all landing pages
    const landingPages = await LandingPage.find({});
    
    for (const page of landingPages) {
      if (page.sections && page.sections.trustedTech) {
        const trustedTech = page.sections.trustedTech;
        
        // Check if it's the old format (has heading/subtext at root level)
        if (trustedTech.heading || trustedTech.subtext) {
          console.log(`Migrating trustedTech data for ${page.pageType} page...`);
          
          // Convert to new format with cards array
          const newTrustedTech = {
            cards: [{
              id: '1',
              heading: trustedTech.heading || '',
              subtext: trustedTech.subtext || ''
            }],
            buttonText: trustedTech.buttonText || '',
            buttonLink: trustedTech.buttonLink || ''
          };
          
          // Update the section
          page.sections.trustedTech = newTrustedTech;
          page.markModified('sections.trustedTech');
          
          await page.save();
          console.log(`✓ Migrated trustedTech data for ${page.pageType} page`);
        } else if (trustedTech.cards) {
          console.log(`✓ ${page.pageType} page already has new format`);
        }
      }
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateTrustedTechData();