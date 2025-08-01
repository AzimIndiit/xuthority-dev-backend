const mongoose = require('mongoose');
const User = require('../src/models/User');
const Industry = require('../src/models/Industry');
require('dotenv').config();

async function testIndustryReference() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Create a test industry
    const testIndustry = new Industry({
      name: 'Test Industry',
      category: 'software',
      createdBy: new mongoose.Types.ObjectId(), // Dummy user ID
      status: 'active'
    });
    await testIndustry.save();
    console.log('Created test industry:', testIndustry.name);

    // Create a test user with industry reference
    const testUser = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      acceptedTerms: true,
      industry: testIndustry._id
    });
    await testUser.save();
    console.log('Created test user with industry reference');

    // Test population
    const populatedUser = await User.findById(testUser._id).populate('industry');
    console.log('User with populated industry:', {
      name: `${populatedUser.firstName} ${populatedUser.lastName}`,
      industry: populatedUser.industry ? populatedUser.industry.name : 'No industry'
    });

    // Test finding users by industry
    const usersInIndustry = await User.find({ industry: testIndustry._id });
    console.log(`Users in ${testIndustry.name}:`, usersInIndustry.length);

    // Clean up test data
    await User.findByIdAndDelete(testUser._id);
    await Industry.findByIdAndDelete(testIndustry._id);
    console.log('Cleaned up test data');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run test if called directly
if (require.main === module) {
  testIndustryReference();
}

module.exports = testIndustryReference; 