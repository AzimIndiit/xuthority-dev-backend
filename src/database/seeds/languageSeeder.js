const { Language } = require('../../models');
const mongoose = require('mongoose');

const languageData = [
  {
    name: 'English',
    status: 'active'
  },
  {
    name: 'French',
    status: 'active'
  },
  {
    name: 'Spanish',
    status: 'active'
  },
  {
    name: 'German',
    status: 'active'
  },
  {
    name: 'Italian',
    status: 'active'
  },
  {
    name: 'Portuguese',
    status: 'active'
  },
  {
    name: 'Russian',
    status: 'active'
  },
  {
    name: 'Chinese',
    status: 'active'
  },
  {
    name: 'Japanese',
    status: 'active'
  },
  {
    name: 'Korean',
    status: 'active'
  },
  {
    name: 'Arabic',
    status: 'active'
  },
  {
    name: 'Hindi',
    status: 'active'
  },
  {
    name: 'Dutch',
    status: 'active'
  },
  {
    name: 'Swedish',
    status: 'active'
  },
  {
    name: 'Norwegian',
    status: 'active'
  },
  {
    name: 'Danish',
    status: 'active'
  },
  {
    name: 'Finnish',
    status: 'active'
  },
  {
    name: 'Polish',
    status: 'active'
  },
  {
    name: 'Turkish',
    status: 'active'
  },
  {
    name: 'Greek',
    status: 'active'
  },
  {
    name: 'Hebrew',
    status: 'active'
  },
  {
    name: 'Thai',
    status: 'active'
  },
  {
    name: 'Vietnamese',
    status: 'active'
  },
  {
    name: 'Indonesian',
    status: 'active'
  },
  {
    name: 'Malay',
    status: 'active'
  },
  {
    name: 'Filipino',
    status: 'active'
  },
  {
    name: 'Bengali',
    status: 'active'
  },
  {
    name: 'Urdu',
    status: 'active'
  },
  {
    name: 'Persian',
    status: 'active'
  },
  {
    name: 'Latin',
    status: 'inactive'
  },
  {
    name: 'Ancient Greek',
    status: 'inactive'
  },
  {
    name: 'Sanskrit',
    status: 'inactive'
  }
];

/**
 * Seed languages data
 */
const seedLanguages = async (adminUserId) => {
  try {
    console.log('🌱 Starting language seeding...');

    // Clear existing languages
    await Language.deleteMany({});
    console.log('📝 Cleared existing languages');

    // Create languages with proper user reference
    const languagesToCreate = languageData.map(lang => ({
      ...lang,
      createdBy: adminUserId
    }));

    const createdLanguages = [];
    for (const languageData of languagesToCreate) {
      const language = new Language(languageData);
      await language.save();
      createdLanguages.push(language);
    }

    console.log(`✅ Successfully seeded ${createdLanguages.length} languages`);
    console.log('📊 Languages breakdown:');
    console.log(`   - Active: ${createdLanguages.filter(l => l.status === 'active').length}`);
    console.log(`   - Inactive: ${createdLanguages.filter(l => l.status === 'inactive').length}`);

    return createdLanguages;
  } catch (error) {
    console.error('❌ Error seeding languages:', error);
    throw error;
  }
};

module.exports = {
  seedLanguages,
  languageData
}; 