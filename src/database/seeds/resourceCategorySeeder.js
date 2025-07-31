const { ResourceCategory } = require('../../models');
const slugify = require('slugify');

const resourceCategories = [
  {
    name: 'Webinars',
    status: 'active'
  },
  {
    name: 'XUTHORITY Edge',
    status: 'active'
  },
  {
    name: 'Guides and Tips',
    status: 'active'
  },
  {
    name: 'Success Hub',
    status: 'active'
  },
 
];

const seedResourceCategories = async () => {
  try {
    console.log('Starting Resource Category seeding...');

    // Clear existing data
    await ResourceCategory.deleteMany({});
    console.log('Cleared existing resource categories');

    // Create categories one by one to ensure slug generation
    const createdCategories = [];
    
    for (const categoryData of resourceCategories) {
      // Manually generate slug since insertMany doesn't trigger pre-save middleware
      const slug = slugify(categoryData.name, { 
        lower: true, 
        strict: true,
        remove: /[*+~.()'"!:@]/g
      });
      
      const category = new ResourceCategory({
        ...categoryData,
        slug: slug
      });
      
      await category.save();
      createdCategories.push(category);
    }

    console.log(`✅ Successfully seeded ${createdCategories.length} resource categories`);

    // Display created categories
    createdCategories.forEach(category => {
      console.log(`  - ${category.name} (${category.slug})`);
    });

    return createdCategories;
  } catch (error) {
    console.error('❌ Error seeding resource categories:', error);
    throw error;
  }
};

module.exports = {
  seedResourceCategories,
  resourceCategories
}; 