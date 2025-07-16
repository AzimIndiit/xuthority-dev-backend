#!/usr/bin/env node

/**
 * Fix Review Unique Index Migration Script
 * 
 * This script fixes the unique index issue for ProductReview collection
 * by replacing the existing unique index with a partial unique index
 * that only applies to non-deleted records.
 * 
 * Issue: Users can't create new reviews for products they previously reviewed
 * and then soft-deleted because the unique index doesn't account for isDeleted field.
 * 
 * Solution: Use a partial unique index that only enforces uniqueness for
 * records where isDeleted is false.
 * 
 * Usage:
 *   node scripts/fix-review-unique-index.js
 *   node scripts/fix-review-unique-index.js --dry-run
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Get MongoDB URI directly from environment
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xuthority-dev';

/**
 * Fix the review unique index
 */
const fixReviewUniqueIndex = async (dryRun = false) => {
  try {
    console.log('🔧 Fixing ProductReview unique index...');
    
    const db = mongoose.connection.db;
    const collection = db.collection('productreviews');
    
    // Check if collection exists
    const collectionExists = await db.listCollections({ name: 'productreviews' }).hasNext();
    
    if (!collectionExists) {
      console.log('⚠️  ProductReview collection does not exist. Nothing to fix.');
      return;
    }
    
    // Get existing indexes
    console.log('📊 Checking existing indexes...');
    const existingIndexes = await collection.listIndexes().toArray();
    
    // Find the problematic unique index
    const problematicIndex = existingIndexes.find(idx => 
      idx.key && 
      idx.key.reviewer === 1 && 
      idx.key.product === 1 && 
      idx.unique === true &&
      !idx.partialFilterExpression // This means it's not a partial index
    );
    
    if (!problematicIndex) {
      console.log('✅ No problematic unique index found. Index may already be fixed.');
      return;
    }
    
    console.log(`🔍 Found problematic index: ${problematicIndex.name}`);
    console.log('   Index key:', JSON.stringify(problematicIndex.key));
    console.log('   Unique:', problematicIndex.unique);
    console.log('   Partial filter:', problematicIndex.partialFilterExpression || 'None');
    
    if (dryRun) {
      console.log('\n[DRY RUN] Would perform the following operations:');
      console.log(`1. Drop index: ${problematicIndex.name}`);
      console.log('2. Create new partial unique index: reviewer_1_product_1_partial');
      console.log('   - Key: { reviewer: 1, product: 1 }');
      console.log('   - Unique: true');
      console.log('   - Partial filter: { isDeleted: false }');
      return;
    }
    
    // Step 1: Drop the existing problematic index
    console.log(`\n🗑️  Dropping existing index: ${problematicIndex.name}`);
    await collection.dropIndex(problematicIndex.name);
    console.log('✅ Existing index dropped successfully');
    
    // Step 2: Create new partial unique index
    console.log('\n🔨 Creating new partial unique index...');
    const newIndexName = 'reviewer_1_product_1_partial';
    
    await collection.createIndex(
      { reviewer: 1, product: 1 },
      {
        name: newIndexName,
        unique: true,
        partialFilterExpression: { isDeleted: false },
        background: true
      }
    );
    
    console.log(`✅ Created new partial unique index: ${newIndexName}`);
    console.log('   - Key: { reviewer: 1, product: 1 }');
    console.log('   - Unique: true');
    console.log('   - Partial filter: { isDeleted: false }');
    
    // Verify the new index
    console.log('\n🔍 Verifying new index...');
    const updatedIndexes = await collection.listIndexes().toArray();
    const newIndex = updatedIndexes.find(idx => idx.name === newIndexName);
    
    if (newIndex) {
      console.log('✅ New index verified successfully');
      console.log('   Index details:', {
        name: newIndex.name,
        key: newIndex.key,
        unique: newIndex.unique,
        partialFilterExpression: newIndex.partialFilterExpression
      });
    } else {
      throw new Error('Failed to verify new index creation');
    }
    
  } catch (error) {
    console.error('❌ Error fixing review unique index:', error);
    throw error;
  }
};

/**
 * Display current review statistics
 */
const displayReviewStats = async () => {
  try {
    console.log('\n📊 Review Statistics:');
    console.log('='.repeat(50));
    
    const db = mongoose.connection.db;
    const collection = db.collection('productreviews');
    
    // Check if collection exists
    const collectionExists = await db.listCollections({ name: 'productreviews' }).hasNext();
    
    if (!collectionExists) {
      console.log('ProductReview collection does not exist.');
      return;
    }
    
    const totalReviews = await collection.countDocuments();
    const activeReviews = await collection.countDocuments({ isDeleted: false });
    const deletedReviews = await collection.countDocuments({ isDeleted: true });
    
    console.log(`Total Reviews:        ${totalReviews.toString().padStart(6)}`);
    console.log(`Active Reviews:       ${activeReviews.toString().padStart(6)}`);
    console.log(`Soft-Deleted Reviews: ${deletedReviews.toString().padStart(6)}`);
    
    // Check for potential duplicate issues
    const duplicateCheck = await collection.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $group: {
          _id: { reviewer: '$reviewer', product: '$product' },
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray();
    
    if (duplicateCheck.length > 0) {
      console.log(`\n⚠️  Found ${duplicateCheck.length} potential duplicate review combinations (active reviews only)`);
      console.log('These should be resolved before applying the index fix.');
    } else {
      console.log('\n✅ No duplicate review combinations found in active reviews');
    }
    
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Error displaying review statistics:', error);
  }
};

/**
 * Main migration function
 */
const main = async () => {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting ProductReview unique index fix...');
    console.log(`📅 ${new Date().toISOString()}`);
    console.log(`🔗 Database: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    
    if (dryRun) {
      console.log('🧪 Running in DRY RUN mode - no changes will be made');
    }
    
    // Connect to database
    console.log('\n🔌 Connecting to database...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Keep existing timeout
      connectTimeoutMS: 10000 // Keep existing timeout
    });
    console.log('✅ Connected to database');
    
    // Display current statistics
    await displayReviewStats();
    
    // Fix the unique index
    await fixReviewUniqueIndex(dryRun);
    
    // Display updated statistics
    if (!dryRun) {
      await displayReviewStats();
    }
    
    const totalDuration = Date.now() - startTime;
    console.log(`\n✅ Index fix completed in ${totalDuration}ms`);
    
    if (!dryRun) {
      console.log('\n💡 What this fix does:');
      console.log('   - Users can now create new reviews for products they previously reviewed and deleted');
      console.log('   - Unique constraint still applies to active (non-deleted) reviews');
      console.log('   - Soft-deleted reviews no longer block new review creation');
    }
    
  } catch (error) {
    console.error('\n💥 Fatal error during index fix:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Make sure no other applications are using the database');
    console.log('   - Ensure you have sufficient database permissions');
    console.log('   - Run with --dry-run first to preview changes');
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

// Run the migration script
if (require.main === module) {
  main();
}

module.exports = {
  main,
  fixReviewUniqueIndex,
  displayReviewStats
}; 