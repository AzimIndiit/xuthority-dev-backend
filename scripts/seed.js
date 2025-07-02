#!/usr/bin/env node

/**
 * Comprehensive Database Seeding Script
 * 
 * This script seeds the database with sample data for all modules:
 * - Creates admin user
 * - Seeds Languages
 * - Seeds Industries  
 * - Seeds Integrations
 * - Seeds Market Segments
 * - Seeds User Roles
 * - Seeds Software
 * - Seeds Solutions
 * 
 * Usage:
 *   npm run seed
 *   node scripts/seed.js
 *   node scripts/seed.js --clear-only
 *   node scripts/seed.js --module=languages
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Import models
const { User } = require('../src/models');

// Import seeders
const { seedLanguages } = require('../src/database/seeds/languageSeeder');
const { seedIndustries } = require('../src/database/seeds/industrySeeder');
const { seedIntegrations } = require('../src/database/seeds/integrationSeeder');
const { seedMarketSegments } = require('../src/database/seeds/marketSegmentSeeder');
const { seedUserRoles } = require('../src/database/seeds/userRoleSeeder');
const { seedSoftware } = require('../src/database/seeds/softwareSeeder');
const { seedSolutions } = require('../src/database/seeds/solutionSeeder');
const { seedResourceCategories } = require('../src/database/seeds/resourceCategorySeeder');
const { seedBlogs } = require('../src/database/seeds/blogSeeder');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xuthority-dev';
const ADMIN_USER = {
  firstName: 'Admin',
  lastName: 'User',
  name: 'Admin User',
  email: 'admin@xuthority.com',
  password: 'Admin123!@#',
  role: 'vendor', // Using vendor role as it has more privileges than user
  acceptedTerms: true,
  acceptedMarketing: false,
  authProvider: 'email',
  status: 'active'
};

/**
 * Create or get admin user for seeding
 */
const createAdminUser = async () => {
  try {
    console.log('👤 Setting up admin user...');
    
    // Check if admin user already exists
    let adminUser = await User.findOne({ email: ADMIN_USER.email });
    
    if (adminUser) {
      console.log('✅ Admin user already exists');
      return adminUser;
    }
    
    // Create new admin user
    const hashedPassword = await bcrypt.hash(ADMIN_USER.password, 12);
    adminUser = new User({
      ...ADMIN_USER,
      password: hashedPassword
    });
    
    await adminUser.save();
    console.log('✅ Admin user created successfully');
    console.log(`📧 Email: ${ADMIN_USER.email}`);
    console.log(`🔑 Password: ${ADMIN_USER.password}`);
    
    return adminUser;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
};

/**
 * Clear all collections
 */
const clearDatabase = async () => {
  try {
    console.log('🗑️  Clearing database...');
    
    const collections = [
      'languages',
      'industries', 
      'integrations',
      'marketsegments',
      'userroles',
      'software',
      'solutions',
      'resourcecategories',
      'blogs'
    ];
    
    for (const collection of collections) {
      try {
        await mongoose.connection.db.collection(collection).deleteMany({});
        console.log(`   ✅ Cleared ${collection}`);
      } catch (error) {
        console.log(`   ⚠️  Collection ${collection} not found or already empty`);
      }
    }
    
    console.log('✅ Database cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
};

/**
 * Seed all modules
 */
const seedAllModules = async (adminUserId, specificModule = null) => {
  const seeders = [
    { name: 'languages', fn: seedLanguages },
    { name: 'industries', fn: seedIndustries },
    { name: 'integrations', fn: seedIntegrations },
    { name: 'market-segments', fn: seedMarketSegments },
    { name: 'user-roles', fn: seedUserRoles },
    { name: 'software', fn: seedSoftware },
    { name: 'solutions', fn: seedSolutions },
    { name: 'resource-categories', fn: seedResourceCategories },
    { name: 'blogs', fn: seedBlogs }
  ];
  
  const results = {};
  
  for (const seeder of seeders) {
    // Skip if specific module requested and this isn't it
    if (specificModule && seeder.name !== specificModule) {
      continue;
    }
    
    const startTime = Date.now(); // Define startTime for each seeder
    
    try {
      console.log(`\n🌱 Seeding ${seeder.name}...`);
      
      const result = await seeder.fn(adminUserId);
      results[seeder.name] = {
        success: true,
        count: result.length,
        duration: Date.now() - startTime
      };
      
      console.log(`✅ ${seeder.name} seeded successfully (${result.length} items, ${results[seeder.name].duration}ms)`);
    } catch (error) {
      console.error(`❌ Error seeding ${seeder.name}:`, error.message);
      results[seeder.name] = {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }
  
  return results;
};

/**
 * Display summary
 */
const displaySummary = (results, totalDuration) => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 SEEDING SUMMARY');
  console.log('='.repeat(60));
  
  let totalItems = 0;
  let successCount = 0;
  let failCount = 0;
  
  Object.entries(results).forEach(([module, result]) => {
    const status = result.success ? '✅' : '❌';
    const count = result.success ? result.count : 0;
    const duration = result.duration || 0;
    
    console.log(`${status} ${module.padEnd(20)} ${count.toString().padStart(3)} items (${duration}ms)`);
    
    if (result.success) {
      totalItems += count;
      successCount++;
    } else {
      failCount++;
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('='.repeat(60));
  console.log(`📈 Total Items Seeded: ${totalItems}`);
  console.log(`✅ Successful Modules: ${successCount}`);
  console.log(`❌ Failed Modules: ${failCount}`);
  console.log(`⏱️  Total Duration: ${totalDuration}ms`);
  console.log('='.repeat(60));
  
  if (failCount > 0) {
    console.log('\n⚠️  Some modules failed to seed. Check the errors above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All modules seeded successfully!');
  }
};

/**
 * Main seeding function
 */
const main = async () => {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting database seeding...');
    console.log(`📅 ${new Date().toISOString()}`);
    console.log(`🔗 Database: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const clearOnly = args.includes('--clear-only');
    const moduleArg = args.find(arg => arg.startsWith('--module='));
    const specificModule = moduleArg ? moduleArg.split('=')[1] : null;
    
    // Connect to database
    console.log('\n🔌 Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Clear database if requested
    if (clearOnly) {
      await clearDatabase();
      console.log('\n✅ Database clearing completed');
      return;
    }
    
    // Create admin user
    const adminUser = await createAdminUser();
    
    // Seed modules
    console.log('\n🌱 Starting module seeding...');
    const results = await seedAllModules(adminUser._id, specificModule);
    
    // Display summary
    const totalDuration = Date.now() - startTime;
    displaySummary(results, totalDuration);
    
  } catch (error) {
    console.error('\n💥 Fatal error during seeding:', error);
    process.exit(1);
  } finally {
    // Close database connection
    try {
      await mongoose.connection.close();
      console.log('\n🔌 Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }
};

/**
 * Handle graceful shutdown
 */
process.on('SIGINT', async () => {
  console.log('\n⚠️  Received SIGINT. Gracefully shutting down...');
  try {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled rejection:', error);
  process.exit(1);
});

// Run the seeding script
if (require.main === module) {
  main();
}

module.exports = {
  main,
  createAdminUser,
  clearDatabase,
  seedAllModules
}; 