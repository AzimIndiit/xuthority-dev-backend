const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models
const User = require('../src/models/User');
const UserSubscription = require('../src/models/UserSubscription');

/**
 * Migrate existing users to populate stripeCustomerId field
 */
async function migrateStripeCustomers() {
  try {
    console.log('Starting Stripe customer migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Connected to MongoDB');
    
    // Find all users who don't have stripeCustomerId but have subscriptions
    const usersWithSubscriptions = await UserSubscription.aggregate([
      {
        $match: {
          stripeCustomerId: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$user',
          stripeCustomerId: { $first: '$stripeCustomerId' }
        }
      }
    ]);
    
    console.log(`Found ${usersWithSubscriptions.length} users with Stripe subscriptions`);
    
    let updatedCount = 0;
    
    for (const userSub of usersWithSubscriptions) {
      try {
        const user = await User.findById(userSub._id);
        
        if (user && !user.stripeCustomerId) {
          user.stripeCustomerId = userSub.stripeCustomerId;
          await user.save();
          updatedCount++;
          console.log(`Updated user ${user.email} with customer ID: ${userSub.stripeCustomerId}`);
        }
      } catch (error) {
        console.error(`Error updating user ${userSub._id}:`, error.message);
      }
    }
    
    console.log(`\nMigration completed! Updated ${updatedCount} users with Stripe customer IDs.`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateStripeCustomers();
}

module.exports = migrateStripeCustomers; 