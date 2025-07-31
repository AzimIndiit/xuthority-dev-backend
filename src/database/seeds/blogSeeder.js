const { Blog, ResourceCategory, User } = require('../../models');
const slugify = require('slugify');

const sampleBlogs = [
  // Webinars
  {
    authorName: 'Eric Gilpin',
    designation: 'Chief Revenue Officer',
    title: 'Unlock Revenue Growth: Exclusive Fireside Chat',
    description: 'Facts: Sales is harder than ever. Sales cycles are longer, shortlists are shorter, and buyer behavior has fundamentally shifted. Join us for an exclusive fireside chat where we dive deep into revenue growth strategies.',
    mediaUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=340&fit=crop&crop=center',
    watchUrl: 'https://example.com/webinar/revenue-growth',
    tag: 'Revenue Growth',
    status: 'active',
    categoryName: 'Webinars'
  },
  {
    authorName: 'Sarah Chen',
    designation: 'VP of Marketing',
    title: 'Intent to Revenue: Leveraging Intent Data',
    description: 'Why waste money on prospects who aren\'t actively in-market? Join speakers from leading companies as we explore how to leverage intent data to drive revenue.',
    mediaUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=340&fit=crop&crop=center',
    watchUrl: 'https://example.com/webinar/intent-data',
    tag: 'Intent Data',
    status: 'active',
    categoryName: 'Webinars'
  },
  {
    authorName: 'Michael Torres',
    designation: 'Senior Product Manager',
    title: 'Building a Unified GTM Strategy',
    description: 'Learn how to build a unified go-to-market strategy that aligns sales, marketing, and customer success teams for maximum impact.',
    mediaUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&h=340&fit=crop&crop=center',
    watchUrl: 'https://example.com/webinar/gtm-strategy',
    tag: 'GTM Strategy',
    status: 'active',
    categoryName: 'Webinars'
  },

  // XUTHORITY Edge
  {
    authorName: 'Jessica Rodriguez',
    designation: 'Head of Product Innovation',
    title: 'AI-Powered Buyer Intelligence Revolution',
    description: 'Discover how artificial intelligence is transforming the way we understand and engage with B2B buyers. Get insights into the latest AI technologies.',
    mediaUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=340&fit=crop&crop=center',
    tag: 'AI Innovation',
    status: 'active',
    categoryName: 'XUTHORITY Edge'
  },
  {
    authorName: 'David Park',
    designation: 'Chief Technology Officer',
    title: 'The Future of B2B Data Analytics',
    description: 'Explore cutting-edge analytics technologies that are reshaping how businesses make data-driven decisions in the B2B space.',
    mediaUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=340&fit=crop&crop=center',
    tag: 'Data Analytics',
    status: 'active',
    categoryName: 'XUTHORITY Edge'
  },

  // Guides and Tips
  {
    authorName: 'Lisa Wang',
    designation: 'Sales Enablement Specialist',
    title: 'Complete Guide to B2B Lead Qualification',
    description: 'A comprehensive step-by-step guide to qualifying leads effectively, reducing time-to-close, and improving your sales conversion rates.',
    mediaUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=340&fit=crop&crop=center',
    tag: 'Lead Qualification',
    status: 'active',
    categoryName: 'Guides and Tips'
  },
  {
    authorName: 'Robert Kim',
    designation: 'Marketing Operations Manager',
    title: '10 Essential KPIs Every B2B Marketer Should Track',
    description: 'Learn about the most important key performance indicators that successful B2B marketers use to measure and optimize their campaigns.',
    mediaUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=340&fit=crop&crop=center',
    tag: 'KPIs',
    status: 'active',
    categoryName: 'Guides and Tips'
  },

  // Success Hub
  {
    authorName: 'Amanda Foster',
    designation: 'Customer Success Director',
    title: 'How TechCorp Increased Revenue by 300%',
    description: 'Discover how TechCorp leveraged data-driven insights and strategic partnerships to achieve unprecedented revenue growth in just 18 months.',
    mediaUrl: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=600&h=340&fit=crop&crop=center',
    tag: 'Success Story',
    status: 'active',
    categoryName: 'Success Hub'
  },
  {
    authorName: 'Mark Thompson',
    designation: 'VP of Sales',
    title: 'Enterprise Client Retention: A Case Study',
    description: 'Learn from a detailed case study showing how proper client onboarding and success programs can achieve 95%+ retention rates.',
    mediaUrl: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=340&fit=crop&crop=center',
    tag: 'Case Study',
    status: 'active',
    categoryName: 'Success Hub'
  },

  // Case Studies
  {
    authorName: 'Emily Johnson',
    designation: 'Strategy Consultant',
    title: 'Digital Transformation Success at Scale',
    description: 'A detailed analysis of how a Fortune 500 company successfully implemented digital transformation initiatives across multiple departments.',
    mediaUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&h=340&fit=crop&crop=center',
    tag: 'Digital Transformation',
    status: 'active',
    categoryName: 'Case Studies'
  },


];

const seedBlogs = async () => {
  try {
    console.log('Starting Blog seeding...');

    // Get resource categories
    const categories = await ResourceCategory.find({ status: 'active' });
    if (categories.length === 0) {
      throw new Error('No resource categories found. Please seed resource categories first.');
    }

    // Get or create a default user for blog creation
    let defaultUser = await User.findOne({ email: 'admin@xuthority.com' });
    if (!defaultUser) {
      console.log('Creating default admin user for blog seeding...');
      defaultUser = await User.create({
        name: 'Admin User',
        email: 'admin@xuthority.com',
        password: 'defaultpassword123',
        role: 'admin',
        isVerified: true
      });
    }

    // Clear existing blogs
    await Blog.deleteMany({});
    console.log('Cleared existing blogs');

    // Create blogs one by one to ensure slug generation
    const createdBlogs = [];
    
    for (const blogData of sampleBlogs) {
      const category = categories.find(cat => cat.name === blogData.categoryName);
      if (category) {
        // Manually generate slug since save() should work but let's be safe
        const slug = slugify(blogData.title, { 
          lower: true, 
          strict: true,
          remove: /[*+~.()'"!:@]/g
        });
        
        const blog = new Blog({
          ...blogData,
          slug: slug,
          resourceCategoryId: category._id,
          createdBy: defaultUser._id
        });
        
        await blog.save();
        createdBlogs.push(blog);
      }
    }

    console.log(`✅ Successfully seeded ${createdBlogs.length} blogs`);

    // Display created blogs by category
    for (const category of categories) {
      const categoryBlogs = createdBlogs.filter(blog => 
        blog.resourceCategoryId.toString() === category._id.toString()
      );
      if (categoryBlogs.length > 0) {
        console.log(`\n📁 ${category.name} (${categoryBlogs.length} blogs):`);
        categoryBlogs.forEach(blog => {
          console.log(`  - ${blog.title}`);
        });
      }
    }

    return createdBlogs;
  } catch (error) {
    console.error('❌ Error seeding blogs:', error);
    throw error;
  }
};

module.exports = {
  seedBlogs,
  sampleBlogs
}; 