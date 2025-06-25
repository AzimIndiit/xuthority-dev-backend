const { MarketSegment } = require('../../models');
const mongoose = require('mongoose');

const marketSegmentData = [
  // Business Size Segments
  {
    name: 'Small Business',
    status: 'active'
  },
  {
    name: 'Mid-Market',
    status: 'active'
  }
];

/**
 * Seed market segments data
 */
const seedMarketSegments = async (adminUserId) => {
  try {
    console.log('🌱 Starting market segment seeding...');

    // Clear existing market segments
    await MarketSegment.deleteMany({});
    console.log('📝 Cleared existing market segments');

    // Create market segments with proper user reference
    const segmentsToCreate = marketSegmentData.map(segment => ({
      ...segment,
      createdBy: adminUserId
    }));

    const createdSegments = [];
    for (const segmentData of segmentsToCreate) {
      const segment = new MarketSegment(segmentData);
      await segment.save();
      createdSegments.push(segment);
    }

    console.log(`✅ Successfully seeded ${createdSegments.length} market segments`);
    console.log('📊 Market Segments breakdown:');
    console.log(`   - Active: ${createdSegments.filter(s => s.status === 'active').length}`);
    console.log(`   - Inactive: ${createdSegments.filter(s => s.status === 'inactive').length}`);

    return createdSegments;
  } catch (error) {
    console.error('❌ Error seeding market segments:', error);
    throw error;
  }
};

module.exports = {
  seedMarketSegments,
  marketSegmentData
}; 