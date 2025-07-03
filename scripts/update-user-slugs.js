const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

// Helper function to generate slug from name
const generateSlug = (firstName, lastName) => {
  if (!firstName || !lastName) {
    return '';
  }
  
  const slug = `${firstName}-${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim('-'); // Remove leading/trailing hyphens
    
  return slug;
};

// Function to ensure unique slug
const ensureUniqueSlug = async (baseSlug, excludeId = null) => {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existingUser = await User.findOne({ 
      slug: slug, 
      _id: { $ne: excludeId } 
    });
    
    if (!existingUser) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

async function updateUserSlugs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Find all users without slugs
    const usersWithoutSlugs = await User.find({ 
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    });
    
    console.log(`Found ${usersWithoutSlugs.length} users without slugs`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const user of usersWithoutSlugs) {
      try {
        if (!user.firstName || !user.lastName) {
          console.log(`Skipping user ${user._id} - missing firstName or lastName`);
          skipped++;
          continue;
        }
        
        const baseSlug = generateSlug(user.firstName, user.lastName);
        const uniqueSlug = await ensureUniqueSlug(baseSlug, user._id);
        
        // Update the user directly (bypassing pre-save hook)
        await User.updateOne(
          { _id: user._id },
          { $set: { slug: uniqueSlug } }
        );
        
        console.log(`Updated user ${user._id} (${user.firstName} ${user.lastName}) with slug: ${uniqueSlug}`);
        updated++;
        
      } catch (error) {
        console.error(`Error updating user ${user._id}:`, error.message);
        skipped++;
      }
    }
    
    console.log(`\nMigration completed:`);
    console.log(`- Updated: ${updated} users`);
    console.log(`- Skipped: ${skipped} users`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
updateUserSlugs(); 