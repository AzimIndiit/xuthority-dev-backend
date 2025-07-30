const mongoose = require('mongoose');
const LandingPage = require('../src/models/LandingPage');
require('dotenv').config();

/**
 * Migration script to convert old values format to new cards format
 */
async function migrateValuesData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all landing pages
    const landingPages = await LandingPage.find({});
    console.log(`Found ${landingPages.length} landing pages`);

    for (const page of landingPages) {
      console.log(`Processing ${page.pageType} page...`);
      
      if (page.sections && page.sections.values) {
        const valuesSection = page.sections.values;
        
        // Check if already in new format
        if (valuesSection.cards && Array.isArray(valuesSection.cards)) {
          console.log(`✓ ${page.pageType} page already has new format`);
          continue;
        }
        
        // Convert from old format to new format
        if (valuesSection.values && Array.isArray(valuesSection.values)) {
          const cards = valuesSection.values.map((value, index) => ({
            id: value.id || `card-${index}`,
            heading: value.title || '',
            subtext: value.description || '',
          }));
          
          // Update to new format
          page.sections.values = {
            cards: cards,
            buttonText: valuesSection.buttonText || '',
            buttonLink: valuesSection.buttonLink || '',
          };
          
          page.markModified('sections.values');
          await page.save();
          console.log(`✓ ${page.pageType} page converted to new format`);
        } else {
          // No existing data, set default structure
          page.sections.values = {
            cards: [],
            buttonText: '',
            buttonLink: '',
          };
          page.markModified('sections.values');
          await page.save();
          console.log(`✓ ${page.pageType} page initialized with new format`);
        }
      } else {
        // No values section exists, create it
        if (!page.sections) {
          page.sections = {};
        }
        page.sections.values = {
          cards: [],
          buttonText: '',
          buttonLink: '',
        };
        page.markModified('sections.values');
        await page.save();
        console.log(`✓ ${page.pageType} page created with new format`);
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration
migrateValuesData(); 