#!/usr/bin/env node

/**
 * Database Migration Script
 * 
 * This script handles database migrations and index creation for all modules:
 * - Creates necessary indexes for performance
 * - Ensures proper schema validation
 * - Updates existing documents if needed
 * 
 * Usage:
 *   npm run migrate
 *   node scripts/migrate.js
 *   node scripts/migrate.js --dry-run
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Import configuration
const config = require('../src/config');

// Import all models to ensure they're registered
require('../src/models');

/**
 * Create indexes for all collections
 */
const createIndexes = async (dryRun = false) => {
  try {
    console.log('📊 Creating database indexes...');
    
    const collections = [
      {
        name: 'users',
        indexes: [
          { key: { email: 1 }, options: { unique: true } },
          { key: { slug: 1 }, options: { unique: true, sparse: true } },
          { key: { status: 1 } },
          { key: { role: 1 } },
          { key: { isVerified: 1 } },
          { key: { createdAt: -1 } }
        ]
      },
      {
        name: 'languages',
        indexes: [
          { key: { name: 1 }, options: { unique: true } },
          { key: { slug: 1 }, options: { unique: true } },
          { key: { status: 1 } },
          { key: { createdAt: -1 } },
          { key: { createdBy: 1 } }
        ]
      },
      {
        name: 'industries',
        indexes: [
          { key: { name: 1 }, options: { unique: true } },
          { key: { slug: 1 }, options: { unique: true } },
          { key: { category: 1 } },
          { key: { status: 1 } },
          { key: { createdAt: -1 } },
          { key: { createdBy: 1 } },
          { key: { category: 1, status: 1 } }
        ]
      },
      {
        name: 'integrations',
        indexes: [
          { key: { name: 1 }, options: { unique: true } },
          { key: { slug: 1 }, options: { unique: true } },
          { key: { status: 1 } },
          { key: { createdAt: -1 } },
          { key: { createdBy: 1 } }
        ]
      },
      {
        name: 'marketsegments',
        indexes: [
          { key: { name: 1 }, options: { unique: true } },
          { key: { slug: 1 }, options: { unique: true } },
          { key: { status: 1 } },
          { key: { createdAt: -1 } },
          { key: { createdBy: 1 } }
        ]
      },
      {
        name: 'userroles',
        indexes: [
          { key: { name: 1 }, options: { unique: true } },
          { key: { slug: 1 }, options: { unique: true } },
          { key: { status: 1 } },
          { key: { createdAt: -1 } },
          { key: { createdBy: 1 } }
        ]
      },
      {
        name: 'software',
        indexes: [
          { key: { name: 1 }, options: { unique: true } },
          { key: { slug: 1 }, options: { unique: true } },
          { key: { status: 1 } },
          { key: { category: 1 } },
          { key: { pricing: 1 } },
          { key: { technologies: 1 } },
          { key: { createdAt: -1 } },
          { key: { createdBy: 1 } },
          { key: { category: 1, status: 1 } },
          { key: { status: 1, createdAt: -1 } }
        ]
      },
      {
        name: 'solutions',
        indexes: [
          { key: { name: 1 }, options: { unique: true } },
          { key: { slug: 1 }, options: { unique: true } },
          { key: { status: 1 } },
          { key: { category: 1 } },
          { key: { complexity: 1 } },
          { key: { pricing: 1 } },
          { key: { createdAt: -1 } },
          { key: { createdBy: 1 } },
          { key: { category: 1, status: 1 } },
          { key: { complexity: 1, status: 1 } },
          { key: { status: 1, createdAt: -1 } }
        ]
      },
      {
        name: 'products',
        indexes: [
          { key: { name: 1 }, options: { unique: true } },
          { key: { slug: 1 }, options: { unique: true } },
          { key: { status: 1 } },
          { key: { category: 1 } },
          { key: { pricing: 1 } },
          { key: { createdAt: -1 } },
          { key: { createdBy: 1 } },
          { key: { category: 1, status: 1 } }
        ]
      },
      {
        name: 'follows',
        indexes: [
          { key: { follower: 1, following: 1 }, options: { unique: true } },
          { key: { follower: 1 } },
          { key: { following: 1 } },
          { key: { createdAt: -1 } }
        ]
      },
      {
        name: 'files',
        indexes: [
          { key: { filename: 1 } },
          { key: { uploadedBy: 1 } },
          { key: { mimetype: 1 } },
          { key: { uploadDate: -1 } },
          { key: { uploadedBy: 1, uploadDate: -1 } }
        ]
      },
      {
        name: 'auditlogs',
        indexes: [
          { key: { user: 1 } },
          { key: { action: 1 } },
          { key: { resource: 1 } },
          { key: { timestamp: -1 } },
          { key: { user: 1, timestamp: -1 } },
          { key: { resource: 1, action: 1 } }
        ]
      }
    ];
    
    let totalIndexes = 0;
    
    for (const collection of collections) {
      try {
        console.log(`\n📋 Processing collection: ${collection.name}`);
        
        // Check if collection exists
        const collectionExists = await mongoose.connection.db.listCollections({ name: collection.name }).hasNext();
        
        if (!collectionExists) {
          console.log(`   ⚠️  Collection ${collection.name} does not exist, skipping...`);
          continue;
        }
        
        const coll = mongoose.connection.db.collection(collection.name);
        
        // Get existing indexes
        const existingIndexes = await coll.listIndexes().toArray();
        const existingIndexNames = existingIndexes.map(idx => idx.name);
        
        console.log(`   📊 Existing indexes: ${existingIndexNames.length}`);
        
        for (const index of collection.indexes) {
          const indexName = Object.keys(index.key).join('_') + '_' + Object.values(index.key).join('_');
          
          if (dryRun) {
            console.log(`   [DRY RUN] Would create index: ${indexName}`);
            continue;
          }
          
          try {
            await coll.createIndex(index.key, {
              ...index.options,
              background: true,
              name: indexName
            });
            console.log(`   ✅ Created index: ${indexName}`);
            totalIndexes++;
          } catch (error) {
            if (error.code === 11000 || error.message.includes('already exists')) {
              console.log(`   ⚠️  Index ${indexName} already exists`);
            } else {
              console.error(`   ❌ Failed to create index ${indexName}:`, error.message);
            }
          }
        }
        
      } catch (error) {
        console.error(`❌ Error processing collection ${collection.name}:`, error.message);
      }
    }
    
    if (!dryRun) {
      console.log(`\n✅ Created ${totalIndexes} new indexes`);
    }
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
};

/**
 * Validate data integrity
 */
const validateDataIntegrity = async (dryRun = false) => {
  try {
    console.log('\n🔍 Validating data integrity...');
    
    const issues = [];
    
    // Check for documents without required fields
    const collections = ['languages', 'industries', 'integrations', 'marketsegments', 'userroles', 'software', 'solutions'];
    
    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        
        // Check for documents without slug
        const documentsWithoutSlug = await collection.countDocuments({ slug: { $exists: false } });
        if (documentsWithoutSlug > 0) {
          issues.push(`${collectionName}: ${documentsWithoutSlug} documents missing slug field`);
        }
        
        // Check for documents without createdBy
        const documentsWithoutCreatedBy = await collection.countDocuments({ createdBy: { $exists: false } });
        if (documentsWithoutCreatedBy > 0) {
          issues.push(`${collectionName}: ${documentsWithoutCreatedBy} documents missing createdBy field`);
        }
        
      } catch (error) {
        console.log(`   ⚠️  Collection ${collectionName} not found or error checking: ${error.message}`);
      }
    }
    
    if (issues.length > 0) {
      console.log('\n⚠️  Data integrity issues found:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      
      if (!dryRun) {
        console.log('\n💡 Run with --dry-run to see potential fixes without applying them');
      }
    } else {
      console.log('✅ No data integrity issues found');
    }
    
  } catch (error) {
    console.error('❌ Error validating data integrity:', error);
    throw error;
  }
};

/**
 * Display database statistics
 */
const displayStatistics = async () => {
  try {
    console.log('\n📊 Database Statistics:');
    console.log('='.repeat(50));
    
    const collections = ['users', 'languages', 'industries', 'integrations', 'marketsegments', 'userroles', 'software', 'solutions', 'products', 'follows'];
    
    let totalDocuments = 0;
    
    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`${collectionName.padEnd(20)} ${count.toString().padStart(6)} documents`);
        totalDocuments += count;
      } catch (error) {
        console.log(`${collectionName.padEnd(20)}      0 documents (not found)`);
      }
    }
    
    console.log('='.repeat(50));
    console.log(`${'Total'.padEnd(20)} ${totalDocuments.toString().padStart(6)} documents`);
    
  } catch (error) {
    console.error('❌ Error displaying statistics:', error);
  }
};

/**
 * Main migration function
 */
const main = async () => {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting database migration...');
    console.log(`📅 ${new Date().toISOString()}`);
    console.log(`🔗 Database: ${config.database.uri.replace(/\/\/.*@/, '//***:***@')}`);
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    
    if (dryRun) {
      console.log('🧪 Running in DRY RUN mode - no changes will be made');
    }
    
    // Connect to database
    console.log('\n🔌 Connecting to database...');
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('✅ Connected to database');
    
    // Create indexes
    await createIndexes(dryRun);
    
    // Validate data integrity
    await validateDataIntegrity(dryRun);
    
    // Display statistics
    await displayStatistics();
    
    const totalDuration = Date.now() - startTime;
    console.log(`\n✅ Migration completed in ${totalDuration}ms`);
    
  } catch (error) {
    console.error('\n💥 Fatal error during migration:', error);
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

// Run the migration script
if (require.main === module) {
  main();
}

module.exports = {
  main,
  createIndexes,
  validateDataIntegrity,
  displayStatistics
}; 