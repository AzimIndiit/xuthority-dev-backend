/**
 * Migration script to add status field to existing vendor users
 * Run this script once after adding the status field to User model
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const migrateVendorStatus = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('📝 Connected to MongoDB...');

    // Find all vendors without status field or with null status
    const vendorsToUpdate = await User.find({
      role: 'vendor',
      $or: [
        { status: { $exists: false } },
        { status: null },
        { status: '' }
      ]
    });

    console.log(`📊 Found ${vendorsToUpdate.length} vendors to update...`);

    if (vendorsToUpdate.length === 0) {
      console.log('✅ All vendors already have status field set.');
      return;
    }

    // Update vendors with default status based on isVerified field
    const updatePromises = vendorsToUpdate.map(async (vendor) => {
      // Set status based on current isVerified status
      // isVerified: true -> 'approved'
      // isVerified: false -> 'pending'
      const newStatus = vendor.isVerified ? 'approved' : 'pending';
      
      return User.findByIdAndUpdate(
        vendor._id,
        { status: newStatus },
        { new: true }
      );
    });

    await Promise.all(updatePromises);

    console.log(`✅ Successfully updated ${vendorsToUpdate.length} vendors with status field.`);
    
    // Log summary
    const statusCounts = await User.aggregate([
      { $match: { role: 'vendor' } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n📈 Vendor status distribution:');
    statusCounts.forEach(({ _id, count }) => {
      console.log(`   ${_id}: ${count} vendors`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run migration
migrateVendorStatus(); 