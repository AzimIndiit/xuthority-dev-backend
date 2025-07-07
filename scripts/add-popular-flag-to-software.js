#!/usr/bin/env node

/**
 * Migration script to add isPopular flag to existing software documents
 * 
 * Usage: node scripts/add-popular-flag-to-software.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Software = require('../src/models/Software');
const config = require('../src/config');

// List of popular software names to mark as popular
const POPULAR_SOFTWARE_NAMES = [
  'Slack',
  'Notion',
  'Figma',
  'Jira',
  'Trello',
  'Visual Studio Code',
  'Docker Desktop',
  'GitHub Desktop',
  'Tableau',
  'Power BI'
];

async function migrate() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xuthority-dev';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // First, set all software to isPopular: false
    const resetResult = await Software.updateMany(
      {},
      { $set: { isPopular: false } }
    );
    console.log(`Reset ${resetResult.modifiedCount} software documents to isPopular: false`);

    // Then, update popular software to isPopular: true
    const updateResult = await Software.updateMany(
      { 
        name: { $in: POPULAR_SOFTWARE_NAMES },
        status: 'active'
      },
      { $set: { isPopular: true } }
    );
    console.log(`Updated ${updateResult.modifiedCount} software documents to isPopular: true`);

    // List all popular software
    const popularSoftware = await Software.find({ isPopular: true }).select('name slug');
    console.log('\nPopular Software:');
    popularSoftware.forEach(software => {
      console.log(`- ${software.name} (${software.slug})`);
    });

    // Show statistics
    const totalSoftware = await Software.countDocuments();
    const popularCount = await Software.countDocuments({ isPopular: true });
    const featuredCount = await Software.countDocuments({ isFeatured: true });

    console.log('\nStatistics:');
    console.log(`Total Software: ${totalSoftware}`);
    console.log(`Popular Software: ${popularCount}`);
    console.log(`Featured Software: ${featuredCount}`);

    console.log('\nMigration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate(); 