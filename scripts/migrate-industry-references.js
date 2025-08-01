const mongoose = require('mongoose');
const User = require('../src/models/User');
const Industry = require('../src/models/Industry');
require('dotenv').config();

async function migrateIndustryReferences() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get all users with string industry values
    const usersWithIndustry = await User.find({
      industry: { $exists: true, $ne: null, $ne: '' },
      $where: "typeof this.industry === 'string'"
    });

    console.log(`Found ${usersWithIndustry.length} users with string industry values`);

    for (const user of usersWithIndustry) {
      try {
        const industryName = user.industry;
        
        // Find or create industry
        let industry = await Industry.findOne({ 
          name: { $regex: new RegExp(`^${industryName}$`, 'i') } 
        });

        if (!industry) {
          // Create new industry if it doesn't exist
          industry = new Industry({
            name: industryName,
            category: 'software', // Default category
            createdBy: user._id, // Use the user as creator
            status: 'active'
          });
          await industry.save();
          console.log(`Created new industry: ${industryName}`);
        }

        // Update user's industry reference
        user.industry = industry._id;
        await user.save();
        console.log(`Updated user ${user.email} industry reference to: ${industry.name}`);

      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error.message);
      }
    }

    console.log('Migration completed successfully');
    
    // Verify migration
    const usersWithObjectIdIndustry = await User.find({
      industry: { $exists: true, $ne: null },
      $where: "this.industry && typeof this.industry === 'object'"
    });
    
    console.log(`Users with ObjectId industry references: ${usersWithObjectIdIndustry.length}`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateIndustryReferences();
}

module.exports = migrateIndustryReferences; 