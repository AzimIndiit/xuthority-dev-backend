const { Page } = require('../../models');
const mongoose = require('mongoose');

const pageData = [
  {
    name: 'Softwares',
    slug: 'softwares',
    isSystemPage: true,
    status: 'active'
  },
  {
    name: 'Solutions',
    slug: 'solutions',
    isSystemPage: true,
    status: 'active'
  },
  {
    name: 'Who can use',
    slug: 'who-can-use',
    isSystemPage: true,
    status: 'active'
  },
  {
    name: 'Industries',
    slug: 'industries',
    isSystemPage: true,
    status: 'active'
  },
  {
    name: 'Integrations',
    slug: 'integrations',
    isSystemPage: true,
    status: 'active'
  },
  {
    name: 'Languages',
    slug: 'languages',
    isSystemPage: true,
    status: 'active'
  },
  {
    name: 'Market Segment',
    slug: 'market-segment',
    isSystemPage: true,
    status: 'active'
  },
  {
    name: 'Landing Page',
    slug: 'landing-page',
    isSystemPage: true,
    status: 'active'
  },
  {
    name: 'About Us',
    slug: 'about-us',
    isSystemPage: false,
    status: 'active'
  },
  {
    name: 'Terms & Conditions',
    slug: 'terms-conditions',
    isSystemPage: false,
    status: 'active'
  },
  {
    name: 'Privacy Policy',
    slug: 'privacy-policy',
    isSystemPage: false,
    status: 'active'
  }
];

/**
 * Seed pages data
 */
const seedPages = async (adminUserId) => {
  try {
    console.log('🌱 Starting page seeding...');

    // Clear existing pages
    await Page.deleteMany({});
    console.log('📝 Cleared existing pages');

    // Create pages with proper admin reference
    const pagesToCreate = pageData.map(page => ({
      ...page,
      createdBy: adminUserId
    }));

    const createdPages = [];
    for (const pageData of pagesToCreate) {
      const page = new Page(pageData);
      await page.save();
      createdPages.push(page);
    }

    console.log(`✅ Successfully seeded ${createdPages.length} pages`);
    console.log('📊 Pages breakdown:');
    console.log(`   - System pages: ${createdPages.filter(p => p.isSystemPage).length}`);
    console.log(`   - Content pages: ${createdPages.filter(p => !p.isSystemPage).length}`);
    console.log(`   - Active: ${createdPages.filter(p => p.status === 'active').length}`);
    console.log(`   - Inactive: ${createdPages.filter(p => p.status === 'inactive').length}`);

    return createdPages;
  } catch (error) {
    console.error('❌ Error seeding pages:', error);
    throw error;
  }
};

module.exports = {
  seedPages,
  pageData
}; 