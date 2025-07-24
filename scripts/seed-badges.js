const mongoose = require('mongoose');
const Badge = require('../src/models/Badge');
require('dotenv').config();

// Sample badge data
const badgeData = [
  {
    title: 'High Performer',
    description: 'Given for 10+ helpful reviews',
    icon: '🏆',
    colorCode: '#FFD700',
    criteria: ['Submit 10+ product reviews', 'Maintain high review quality'],
    status: 'active',
    earnedBy: 124
  },
  {
    title: 'Customer Satisfaction Badge',
    description: 'For profile verification',
    icon: '⭐',
    colorCode: '#4F46E5',
    criteria: ['Complete profile verification', 'Provide accurate business information'],
    status: 'active',
    earnedBy: 421
  },
  {
    title: 'Enterprise Leader',
    description: 'Highest review Growth in a quarter',
    icon: '💼',
    colorCode: '#10B981',
    criteria: ['Achieve highest review growth in quarter', 'Demonstrate consistent engagement'],
    status: 'inactive',
    earnedBy: 452
  },
  {
    title: 'Best Vendor Relationships',
    description: '10 Consecutive 5-star ratings',
    icon: '🤝',
    colorCode: '#F59E0B',
    criteria: ['Receive 10 consecutive 5-star ratings', 'Maintain excellent customer service'],
    status: 'active',
    earnedBy: 965
  },
  {
    title: 'Fast-Growing Products',
    description: '5 Review in a week',
    icon: '🚀',
    colorCode: '#EF4444',
    criteria: ['Receive 5+ reviews in one week', 'Show rapid product adoption'],
    status: 'inactive',
    earnedBy: 487
  },
  {
    title: 'Best Usability of Products',
    description: 'Avg rating above 4.5 for 6 months',
    icon: '💡',
    colorCode: '#8B5CF6',
    criteria: ['Maintain average rating above 4.5', 'Sustain rating for 6+ months'],
    status: 'active',
    earnedBy: 365
  },
  {
    title: 'Outstanding Customer Service',
    description: '3+ in-depth reviews in 30 days',
    icon: '🎯',
    colorCode: '#06B6D4',
    criteria: ['Receive 3+ detailed reviews in 30 days', 'Demonstrate exceptional service'],
    status: 'active',
    earnedBy: 254
  },
  {
    title: 'Users Love Us',
    description: 'Rapid weekly growth in user engagement',
    icon: '❤️',
    colorCode: '#EC4899',
    criteria: ['Show rapid weekly user growth', 'Maintain high engagement rates'],
    status: 'active',
    earnedBy: 87
  },
  {
    title: 'Momentum Leader',
    description: '5 upvoted review in a month',
    icon: '📈',
    colorCode: '#84CC16',
    criteria: ['Receive 5+ upvoted reviews monthly', 'Build community momentum'],
    status: 'inactive',
    earnedBy: 242
  },
  {
    title: 'Spotlight of the Week',
    description: '2+ flag reviews found in a month',
    icon: '🌟',
    colorCode: '#F97316',
    criteria: ['Featured as spotlight vendor', 'Maintain high visibility'],
    status: 'active',
    earnedBy: 545
  }
];

async function seedBadges() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/xuthority-dev';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing badges
    await Badge.deleteMany({});
    console.log('Cleared existing badges');

    // Insert new badges
    const createdBadges = await Badge.insertMany(badgeData);
    console.log(`Created ${createdBadges.length} badges`);

    // Log the created badges
    createdBadges.forEach((badge, index) => {
      console.log(`${index + 1}. ${badge.title} (${badge.status}) - ${badge.earnedBy} vendors`);
    });

    console.log('Badge seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding badges:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeder
if (require.main === module) {
  seedBadges();
}

module.exports = seedBadges; 