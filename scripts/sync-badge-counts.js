const mongoose = require('mongoose');
const Badge = require('../src/models/Badge');
const UserBadge = require('../src/models/UserBadge');
require('dotenv').config();

/**
 * Synchronize badge earnedBy counts with actual approved badge requests
 */
async function syncBadgeCounts() {
  try {
    console.log('🔄 Starting badge count synchronization...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get all badges
    const badges = await Badge.find({});
    console.log(`📊 Found ${badges.length} badges to check`);

    const fixes = [];
    let totalFixed = 0;

    // Check each badge
    for (const badge of badges) {
      // Count actual approved badge requests for this badge
      const actualCount = await UserBadge.countDocuments({
        badgeId: badge._id,
        status: 'approved'
      });

      const currentCount = badge.earnedBy || 0;

      if (actualCount !== currentCount) {
        console.log(`🔧 Fixing badge "${badge.title}": ${currentCount} → ${actualCount}`);
        
        // Update the badge count
        await Badge.findByIdAndUpdate(
          badge._id,
          { earnedBy: actualCount },
          { new: true }
        );

        fixes.push({
          badgeId: badge._id,
          title: badge.title,
          oldCount: currentCount,
          newCount: actualCount,
          difference: actualCount - currentCount
        });

        totalFixed++;
      } else {
        console.log(`✅ Badge "${badge.title}" is correct (${actualCount})`);
      }
    }

    // Generate report
    console.log('\n📋 SYNCHRONIZATION REPORT');
    console.log('========================');
    console.log(`Total badges checked: ${badges.length}`);
    console.log(`Badges fixed: ${totalFixed}`);
    console.log(`Badges already correct: ${badges.length - totalFixed}`);

    if (fixes.length > 0) {
      console.log('\n🔧 FIXES APPLIED:');
      fixes.forEach(fix => {
        console.log(`- ${fix.title}: ${fix.oldCount} → ${fix.newCount} (${fix.difference > 0 ? '+' : ''}${fix.difference})`);
      });
    }

    // Verify results
    console.log('\n🔍 VERIFICATION:');
    const allBadges = await Badge.find({}).lean();
    for (const badge of allBadges) {
      const actualCount = await UserBadge.countDocuments({
        badgeId: badge._id,
        status: 'approved'
      });
      
      if (badge.earnedBy !== actualCount) {
        console.log(`❌ VERIFICATION FAILED for ${badge.title}: DB shows ${badge.earnedBy} but actual is ${actualCount}`);
      }
    }

    console.log('✅ Badge count synchronization completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during badge count synchronization:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

/**
 * Generate a detailed report without making changes
 */
async function generateReport() {
  try {
    console.log('📊 Generating badge count report...');
    
    await mongoose.connect(process.env.MONGODB_URI || process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const badges = await Badge.find({}).lean();
    const inconsistencies = [];

    console.log('\n📋 BADGE COUNT REPORT');
    console.log('====================');
    console.log('Badge Title | Stored Count | Actual Count | Status');
    console.log('-----------|-------------|-------------|--------');

    for (const badge of badges) {
      const actualCount = await UserBadge.countDocuments({
        badgeId: badge._id,
        status: 'approved'
      });

      const storedCount = badge.earnedBy || 0;
      const status = storedCount === actualCount ? '✅ OK' : '❌ MISMATCH';
      
      console.log(`${badge.title.padEnd(20)} | ${storedCount.toString().padEnd(11)} | ${actualCount.toString().padEnd(11)} | ${status}`);

      if (storedCount !== actualCount) {
        inconsistencies.push({
          title: badge.title,
          stored: storedCount,
          actual: actualCount,
          difference: actualCount - storedCount
        });
      }
    }

    if (inconsistencies.length > 0) {
      console.log(`\n⚠️  Found ${inconsistencies.length} inconsistencies that need fixing`);
      console.log('Run with --fix flag to apply corrections');
    } else {
      console.log('\n✅ All badge counts are consistent!');
    }

  } catch (error) {
    console.error('❌ Error generating report:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');
  const reportOnly = args.includes('--report');

  try {
    if (reportOnly) {
      await generateReport();
    } else if (shouldFix) {
      await syncBadgeCounts();
    } else {
      console.log('Badge Count Synchronization Script');
      console.log('==================================');
      console.log('Usage:');
      console.log('  node sync-badge-counts.js --report   # Generate report only');
      console.log('  node sync-badge-counts.js --fix      # Fix inconsistencies');
      console.log('');
      console.log('Running in report mode by default...\n');
      await generateReport();
    }
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { syncBadgeCounts, generateReport }; 