require('dotenv').config();
const mongoose = require('mongoose');
const { SubscriptionPlan } = require('../src/models');
const logger = require('../src/config/logger');

async function fixPlanTypes() {
  try {
    // Connect to database using environment variables
    const MONGODB_URI = process.env.MONGODB_URI;
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');
    
    // First, let's see what plans exist
    const allPlans = await SubscriptionPlan.find({});
    console.log('\n📋 Current plans in database:');
    allPlans.forEach(plan => {
      console.log(`- ID: ${plan._id}`);
      console.log(`  Name: ${plan.name}`);
      console.log(`  Price: $${plan.price}`);
      console.log(`  PlanType: ${plan.planType || 'MISSING ❌'}`);
      console.log(`  TrialDays: ${plan.trialPeriodDays}`);
      console.log(`  IsActive: ${plan.isActive}`);
      console.log('---');
    });
    
    console.log('\n🔧 Updating plans with missing planType...');
    
    // Update free plans (price = 0)
    const freeUpdate = await SubscriptionPlan.updateMany(
      { 
        $or: [
          { price: 0 },
          { name: { $regex: /free/i } },
          { name: { $regex: /basic/i } }
        ]
      },
      { 
        $set: { 
          planType: 'free', 
          trialPeriodDays: 0  // Remove trial periods from free plans
        } 
      }
    );
    
    // Update paid plans (price > 0)
    const paidUpdate = await SubscriptionPlan.updateMany(
      { 
        price: { $gt: 0 }
      },
      { 
        $set: { 
          planType: 'standard'
        } 
      }
    );
    
    console.log(`✅ Updated ${freeUpdate.modifiedCount} free plans`);
    console.log(`✅ Updated ${paidUpdate.modifiedCount} paid plans`);
    
    // Show updated plans
    const updatedPlans = await SubscriptionPlan.find({});
    console.log('\n🎉 Updated plans:');
    updatedPlans.forEach(plan => {
      console.log(`- ${plan.name}:`);
      console.log(`  Price: $${plan.price}`);
      console.log(`  PlanType: ${plan.planType} ✅`);
      console.log(`  TrialDays: ${plan.trialPeriodDays}`);
      console.log(`  IsActive: ${plan.isActive}`);
      console.log('---');
    });
    
    // Verify our query will work
    console.log('\n🔍 Testing query for free plans:');
    const freePlansFound = await SubscriptionPlan.find({ 
      planType: 'free',
      isActive: true 
    });
    console.log(`Found ${freePlansFound.length} active free plans that our code can use:`);
    freePlansFound.forEach(plan => {
      console.log(`  - ${plan.name} (ID: ${plan._id})`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    console.log('🎉 Plan types fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  fixPlanTypes();
}

module.exports = { fixPlanTypes }; 