#!/usr/bin/env node

/**
 * Pages Seeding Script
 * 
 * This script seeds the database with pages data.
 * 
 * Usage:
 *   npm run seed:pages
 *   node scripts/seed-pages.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Load environment variables
require('dotenv').config();

// Import models
const { Admin } = require('../src/models');

// Import seeder
const { seedPages } = require('../src/database/seeds/pageSeeder');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xuthority-dev';
const ADMIN_USER = {
  firstName: 'Admin',
  lastName: 'User', 
  email: 'admin@xuthority.com',
  password: 'Admin123!@#'
};

/**
 * Create or get admin user
 */
const createAdminUser = async () => {
  try {
    console.log('👤 Creating/finding admin user...');
    
    // Check if admin user already exists
    let adminUser = await Admin.findOne({ email: ADMIN_USER.email });
    
    if (adminUser) {
      console.log('✅ Admin user already exists');
      return adminUser;
    }
    
    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(ADMIN_USER.password, saltRounds);
    
    // Create new admin user
    adminUser = new Admin({
      firstName: ADMIN_USER.firstName,
      lastName: ADMIN_USER.lastName,
      email: ADMIN_USER.email,
      password: hashedPassword,
      isActive: true
    });
    
    await adminUser.save();
    console.log('✅ Admin user created successfully');
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`🔑 Password: ${ADMIN_USER.password}`);
    
    return adminUser;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
};

/**
 * Main seeding function
 */
const main = async () => {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting pages seeding...');
    console.log(`📅 ${new Date().toISOString()}`);
    console.log(`🔗 Database: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);
    
    // Connect to database
    console.log('\n🔌 Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Create admin user
    const adminUser = await createAdminUser();
    
    // Seed pages
    console.log('\n🌱 Starting pages seeding...');
    const pages = await seedPages(adminUser._id);
    
    // Display summary
    const totalDuration = Date.now() - startTime;
    console.log('\n📊 SEEDING SUMMARY');
    console.log('==================');
    console.log(`✅ Successfully seeded ${pages.length} pages`);
    console.log(`⏱️  Total duration: ${totalDuration}ms`);
    console.log(`📄 System pages: ${pages.filter(p => p.isSystemPage).length}`);
    console.log(`📝 Content pages: ${pages.filter(p => !p.isSystemPage).length}`);
    console.log(`🟢 Active pages: ${pages.filter(p => p.status === 'active').length}`);
    
    console.log('\n🎉 Pages seeding completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Fatal error during pages seeding:', error);
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

// Run the seeding script
if (require.main === module) {
  main();
}

module.exports = {
  main,
  createAdminUser
}; 