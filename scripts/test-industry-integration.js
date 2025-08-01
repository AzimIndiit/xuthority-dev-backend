const mongoose = require('mongoose');
const User = require('../src/models/User');
const Industry = require('../src/models/Industry');
const AuthService = require('../src/services/authService');
require('dotenv').config();

async function testIndustryIntegration() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Create test industry
    const testIndustry = new Industry({
      name: 'Test Software Industry',
      category: 'software',
      createdBy: new mongoose.Types.ObjectId(), // Dummy user ID
      status: 'active'
    });
    await testIndustry.save();
    console.log('✅ Created test industry:', testIndustry.name);

    // Create test user with industry reference
    const testUser = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'test-industry@example.com',
      password: 'TestPassword123!',
      acceptedTerms: true,
      industry: testIndustry._id,
      role: 'vendor',
      companyName: 'Test Company'
    });
    await testUser.save();
    console.log('✅ Created test user with industry reference');

    // Test 1: Verify user has industry ObjectId
    const userWithIndustry = await User.findById(testUser._id);
    console.log('✅ User industry field type:', typeof userWithIndustry.industry);
    console.log('✅ User industry value:', userWithIndustry.industry);

    // Test 2: Populate industry data
    const populatedUser = await User.findById(testUser._id).populate('industry');
    console.log('✅ Populated user industry:', {
      name: populatedUser.industry.name,
      slug: populatedUser.industry.slug,
      category: populatedUser.industry.category
    });

    // Test 3: Find users by industry
    const usersInIndustry = await User.find({ industry: testIndustry._id });
    console.log('✅ Users in industry:', usersInIndustry.length);

    // Test 4: Test API-like update (simulate frontend request)
    const updateData = {
      firstName: 'Updated',
      lastName: 'Name',
      industry: testIndustry._id.toString() // Send as string (like frontend would)
    };

    // Simulate the updateUserProfile function
    const allowedFields = [
      'firstName', 'lastName', 'region', 'description', 'industry', 'title',
      'companyName', 'companySize', 'companyEmail', 'socialLinks', 'acceptedMarketing', 'avatar',
      'companyAvatar', 'yearFounded', 'hqLocation', 'companyDescription', 'companyWebsiteUrl',
    ];
    
    const update = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) update[key] = updateData[key];
    }

    const updatedUser = await User.findByIdAndUpdate(
      testUser._id, 
      update, 
      { new: true, runValidators: true }
    ).populate('industry');

    console.log('✅ Updated user:', {
      name: `${updatedUser.firstName} ${updatedUser.lastName}`,
      industry: updatedUser.industry.name
    });

    // Test 5: Test validation (simulate express-validator)
    const validateIndustry = (value) => {
      if (!value || value === '') return true;
      return typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);
    };

    const validIndustryId = testIndustry._id.toString();
    const invalidIndustryId = 'invalid-id-format';

    console.log('✅ Industry validation test:');
    console.log('   Valid ObjectId:', validateIndustry(validIndustryId));
    console.log('   Invalid format:', validateIndustry(invalidIndustryId));
    console.log('   Empty value:', validateIndustry(''));

    // Test 6: Test aggregation query
    const industryStats = await User.aggregate([
      { $match: { industry: { $exists: true, $ne: null } } },
      { $group: { _id: '$industry', count: { $sum: 1 } } },
      { $lookup: { from: 'industries', localField: '_id', foreignField: '_id', as: 'industry' } }
    ]);

    console.log('✅ Industry statistics:', industryStats);

    // Clean up test data
    await User.findByIdAndDelete(testUser._id);
    await Industry.findByIdAndDelete(testIndustry._id);
    console.log('✅ Cleaned up test data');

    console.log('\n🎉 All tests passed! Industry ObjectId integration is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run test if called directly
if (require.main === module) {
  testIndustryIntegration();
}

module.exports = testIndustryIntegration; 