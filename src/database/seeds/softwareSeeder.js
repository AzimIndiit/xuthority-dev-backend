const { Software } = require('../../models');
const mongoose = require('mongoose');

const softwareData =[
  {
    "_id": "687f3362900e8fd81cedb061",
    "name": "Marketing Services",
    "isFeatured": true,
    "isPopular": true,
    "slug": "marketing-services",
    "status": "active",
    "createdBy": null,
    "createdAt": "2025-07-22T06:44:50.768Z",
    "updatedAt": "2025-07-22T06:44:50.768Z",
    "__v": 0
  },
  {
    "_id": "687f3362900e8fd81cedb05f",
    "name": "Routers",
    "isFeatured": false,
    "isPopular": false,
    "slug": "routers",
    "status": "active",
    "createdBy": null,
    "createdAt": "2025-07-22T06:44:50.724Z",
    "updatedAt": "2025-07-22T06:44:50.724Z",
    "__v": 0
  },
  {
    "_id": "687f3362900e8fd81cedb05d",
    "name": "Sales Tools",
    "isFeatured": false,
    "isPopular": false,
    "slug": "sales-tools",
    "status": "active",
    "createdBy": null,
    "createdAt": "2025-07-22T06:44:50.685Z",
    "updatedAt": "2025-07-22T06:44:50.685Z",
    "__v": 0
  },
  {
    "_id": "687f3362900e8fd81cedb05b",
    "name": "Development",
    "isFeatured": false,
    "isPopular": true,
    "slug": "development",
    "status": "active",
    "createdBy": null,
    "createdAt": "2025-07-22T06:44:50.648Z",
    "updatedAt": "2025-07-22T06:44:50.648Z",
    "__v": 0
  },
  {
    "_id": "687f3362900e8fd81cedb059",
    "name": "Ecosystem Service Providers",
    "isFeatured": false,
    "isPopular": false,
    "slug": "ecosystem-service-providers",
    "status": "active",
    "createdBy": null,
    "createdAt": "2025-07-22T06:44:50.609Z",
    "updatedAt": "2025-07-22T06:44:50.609Z",
    "__v": 0
  },
  {
    "_id": "687f3362900e8fd81cedb057",
    "name": "Design",
    "isFeatured": false,
    "isPopular": false,
    "slug": "design",
    "status": "active",
    "createdBy": null,
    "createdAt": "2025-07-22T06:44:50.571Z",
    "updatedAt": "2025-07-22T06:44:50.571Z",
    "__v": 0
  },
  {
    "_id": "687f3362900e8fd81cedb055",
    "name": "E-Commerce Platforms",
    "isFeatured": true,
    "isPopular": true,
    "slug": "e-commerce-platforms",
    "status": "active",
    "createdBy": null,
    "createdAt": "2025-07-22T06:44:50.529Z",
    "updatedAt": "2025-07-22T06:44:50.529Z",
    "__v": 0
  },
  {
    "_id": "687f3362900e8fd81cedb053",
    "name": "Data Privacy",
    "isFeatured": false,
    "isPopular": false,
    "slug": "data-privacy",
    "status": "active",
    "createdBy": null,
    "createdAt": "2025-07-22T06:44:50.491Z",
    "updatedAt": "2025-07-22T06:44:50.491Z",
    "__v": 0
  },
  {
    "_id": "687f3362900e8fd81cedb051",
    "name": "Artificial Intelligence",
    "isFeatured": true,
    "isPopular": true,
    "slug": "artificial-intelligence",
    "status": "active",
    "createdBy": null,
    "createdAt": "2025-07-22T06:44:50.454Z",
    "updatedAt": "2025-07-22T06:44:50.454Z",
    "__v": 0
  },
  {
    "_id": "687f3362900e8fd81cedb04f",
    "name": "Professional Services",
    "isFeatured": false,
    "isPopular": true,
    "slug": "professional-services",
    "status": "active",
    "createdBy": null,
    "createdAt": "2025-07-22T06:44:50.415Z",
    "updatedAt": "2025-07-22T06:44:50.415Z",
    "__v": 0
  }
]

/**
 * Seed software data
 */
const seedSoftware = async (adminUserId) => {
  try {
    console.log('🌱 Starting software seeding...');

    // Clear existing software
    await Software.deleteMany({});
    console.log('📝 Cleared existing software');

    // Create software with proper user reference
    const softwareToCreate = softwareData.map(software => ({
      ...software,
      createdBy: adminUserId
    }));

    const createdSoftware = [];
    for (const softwareItem of softwareToCreate) {
      const software = new Software(softwareItem);
      await software.save();
      createdSoftware.push(software);
    }

    console.log(`✅ Successfully seeded ${createdSoftware.length} software categories`);
    console.log('📊 Software breakdown:');
    console.log(`   - Active: ${createdSoftware.filter(s => s.status === 'active').length}`);
    console.log(`   - Inactive: ${createdSoftware.filter(s => s.status === 'inactive').length}`);
    console.log(`   - Popular: ${createdSoftware.filter(s => s.isPopular).length}`);
    console.log(`   - Featured: ${createdSoftware.filter(s => s.isFeatured).length}`);

    return createdSoftware;
  } catch (error) {
    console.error('❌ Error seeding software:', error);
    throw error;
  }
};

module.exports = {
  seedSoftware,
  softwareData
}; 