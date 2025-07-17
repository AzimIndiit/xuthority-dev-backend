const mongoose = require('mongoose');
const Badge = require('../../models/Badge');

const badges = [{
    "_id": {
      "$oid": "6877b812bbf86cb4c083b94f"
    },
    "title": "High Performer",
    "icon": "https://nfls3.s3.amazonaws.com/uploads/4GMWMC6I80FzJey.svg",
    "colorCode": "#10B981",
    "description": "The High Performer badge proves that customers love your product, even if you're not the biggest player in the market. It highlights strong user satisfaction, helping you build trust and attract more buyers.",
    "status": "active",
    "__v": 0,
    "createdAt": {
      "$date": "2025-07-16T14:32:50.404Z"
    },
    "updatedAt": {
      "$date": "2025-07-16T14:32:50.404Z"
    }
  },
  {
    "_id": {
      "$oid": "6877b812bbf86cb4c083b950"
    },
    "title": "Customer Satisfaction Badge",
    "icon": "https://nfls3.s3.amazonaws.com/uploads/4GMWMC6I80FzJey.svg",
    "colorCode": "#E1FBFF",
    "description": "Awarded to products that consistently receive high customer satisfaction ratings and positive feedback from users.",
    "status": "active",
    "__v": 0,
    "createdAt": {
      "$date": "2025-07-16T14:32:50.405Z"
    },
    "updatedAt": {
      "$date": "2025-07-16T14:32:50.405Z"
    }
  },
  {
    "_id": {
      "$oid": "6877b812bbf86cb4c083b951"
    },
    "title": "Enterprise Leader",
    "icon": "https://nfls3.s3.amazonaws.com/uploads/xhMPBaoHBYQClAu.svg",
    "colorCode": "#DEDAFF",
    "description": "Recognizes software solutions that excel in enterprise environments with robust features, scalability, and security.",
    "status": "active",
    "__v": 0,
    "createdAt": {
      "$date": "2025-07-16T14:32:50.405Z"
    },
    "updatedAt": {
      "$date": "2025-07-16T14:32:50.405Z"
    }
  },
  {
    "_id": {
      "$oid": "6877b812bbf86cb4c083b952"
    },
    "title": "Best Vendor Relationships",
    "icon": "https://nfls3.s3.amazonaws.com/uploads/32VjyQn2HHFmueP.svg",
    "colorCode": "#FFE1DB",
    "description": "Awarded to vendors who maintain exceptional relationships with their clients through outstanding support and service.",
    "status": "active",
    "__v": 0,
    "createdAt": {
      "$date": "2025-07-16T14:32:50.405Z"
    },
    "updatedAt": {
      "$date": "2025-07-16T14:32:50.405Z"
    }
  },
  {
    "_id": {
      "$oid": "6877b812bbf86cb4c083b953"
    },
    "title": "Fast-Growing Products",
    "icon": "https://nfls3.s3.amazonaws.com/uploads/xhMPBaoHBYQClAu.svg",
    "colorCode": "#FFE1DB",
    "description": "Recognizes products that demonstrate rapid growth in user adoption, market share, and feature development.",
    "status": "active",
    "__v": 0,
    "createdAt": {
      "$date": "2025-07-16T14:32:50.405Z"
    },
    "updatedAt": {
      "$date": "2025-07-16T14:32:50.405Z"
    }
  },
  {
    "_id": {
      "$oid": "6877b812bbf86cb4c083b954"
    },
    "title": "Best Usability of Products",
   "icon": "https://nfls3.s3.amazonaws.com/uploads/Ly4pmmwhEcfjagD.svg",
    "colorCode": "#FFE1DB",
    "description": "Awarded to products that excel in user experience design, ease of use, and intuitive interface.",
    "status": "active",
    "__v": 0,
    "createdAt": {
      "$date": "2025-07-16T14:32:50.405Z"
    },
    "updatedAt": {
      "$date": "2025-07-16T14:32:50.405Z"
    }
  },
  {
    "_id": {
      "$oid": "6877b812bbf86cb4c083b955"
    },
    "title": "Outstanding Customer Service",
   "icon": "https://nfls3.s3.amazonaws.com/uploads/xhMPBaoHBYQClAu.svg",
    "colorCode": "#FFE1DB",
    "description": "Recognizes companies that provide exceptional customer support with quick response times and effective problem resolution.",
    "status": "active",
    "__v": 0,
    "createdAt": {
      "$date": "2025-07-16T14:32:50.405Z"
    },
    "updatedAt": {
      "$date": "2025-07-16T14:32:50.405Z"
    }
  },
  {
    "_id": {
      "$oid": "6877b812bbf86cb4c083b956"
    },
    "title": "Users Love Us",
    "icon": "https://nfls3.s3.amazonaws.com/uploads/TA5XwqNvbBrQdnp.svg",
    "colorCode": "#FFE1DB",
    "description": "Awarded to products that receive consistently high user ratings and positive reviews across all platforms.",
    "status": "active",
    "__v": 0,
    "createdAt": {
      "$date": "2025-07-16T14:32:50.406Z"
    },
    "updatedAt": {
      "$date": "2025-07-16T14:32:50.406Z"
    }
  },
  {
    "_id": {
      "$oid": "6877b812bbf86cb4c083b957"
    },
    "title": "Momentum Leader",
    "icon": "https://nfls3.s3.amazonaws.com/uploads/xhMPBaoHBYQClAu.svg",
    "colorCode": "#FFE1DB",
    "description": "Recognizes products that show exceptional momentum in market adoption, innovation, and industry recognition.",
    "status": "active",
    "__v": 0,
    "createdAt": {
      "$date": "2025-07-16T14:32:50.406Z"
    },
    "updatedAt": {
      "$date": "2025-07-16T14:32:50.406Z"
    }
  },
  {
    "_id": {
      "$oid": "6877b812bbf86cb4c083b958"
    },
    "title": "Spotlight of the Week",
    "icon": "https://nfls3.s3.amazonaws.com/uploads/aXMyPm3D0hRBsX9.svg",
    "colorCode": "#FFE1DB",
    "description": "Weekly recognition for outstanding products that demonstrate exceptional performance, innovation, or user satisfaction.",
    "status": "active",
    "__v": 0,
    "createdAt": {
      "$date": "2025-07-16T14:32:50.406Z"
    },
    "updatedAt": {
      "$date": "2025-07-16T14:32:50.406Z"
    }
  }]

const seedBadges = async () => {
  try {
    console.log('🌱 Starting badge seeding...');
    
    // Clear existing badges
    await Badge.deleteMany({});
    console.log('✅ Cleared existing badges');
    
    // Insert new badges
    const insertedBadges = await Badge.insertMany(badges);
    console.log(`✅ Successfully seeded ${insertedBadges.length} badges:`);
    
    insertedBadges.forEach(badge => {
      console.log(`   - ${badge.title} (${badge.icon})`);
    });
    
    return insertedBadges;
  } catch (error) {
    console.error('❌ Error seeding badges:', error);
    throw error;
  }
};

// Run seeder if called directly
if (require.main === module) {
  const runSeeder = async () => {
    try {
      if (!mongoose.connection.readyState) {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/xuthority');
        console.log('📦 Connected to MongoDB for seeding');
      }
      
      await seedBadges();
      
      console.log('🎉 Badge seeding completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('💥 Badge seeding failed:', error);
      process.exit(1);
    }
  };
  
  runSeeder();
}

module.exports = { seedBadges, badges }; 