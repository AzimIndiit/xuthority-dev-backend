const { Product, Software, Solution, Industry, Integration, Language, MarketSegment, UserRole, Admin } = require('../../models');
const mongoose = require('mongoose');

// Sample product data extracted and cleaned from the user's JSON file
const productData = [
  {
    name: "daIsaiah",
    slug: "daisaiah",
    websiteUrl: "https://www.zace.mobi",
    description: "Qui in qui eiusmod sit velit dolorum aspernatur sunt omnis labore quis",
    brandColors: "#7d2f51",
    logoUrl: "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640222051-file.webp",
    mediaUrls: [
      "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233173-file.webp",
      "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233752-file.webp",
        "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233173-file.webp",
      "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233752-file.webp",
      "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233752-file.webp"
    ],
    features: [
      {
        title: "Project & Task Management",
        description: [
          {
            value: "Nesciunt repellendus Eos perferendis consequat Nisi quia rem dolorem consectetur officia reiciendis quos"
          }
        ]
      }
    ],
    pricing: [
      {
        name: "Free",
        price: 0,
        seats: "3",
        description: "Adipisicing proident labore at quia ad quis qui consequatur Qui qui inventore atque ea et",
        features: [
          { value: "Adipisicing proident labore at quia ad quis qui consequatur" },
          { value: "Odit architecto ulla" },
          { value: "Reprehenderit dolor" }
        ]
      }
    ],
    totalReviews: 0,
    avgRating: 0,
    ratingDistribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
    status: "published",
    isActive: "active",
    isFeatured: false
  },
  {
    name: "TechFlow Pro",
    slug: "techflow-pro",
    websiteUrl: "https://www.techflowpro.com",
    description: "Advanced workflow automation platform for modern development teams",
    brandColors: "#2563eb",
    mediaUrls: [
      "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233173-file.webp",
      "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233752-file.webp",
        "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233173-file.webp",
      "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233752-file.webp",
      "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233752-file.webp"
    ],
    features: [
      {
        title: "Workflow Automation",
        description: [{ value: "Streamline your development processes with intelligent automation" }]
      },
      {
        title: "Team Collaboration",
        description: [{ value: "Enhanced team productivity with real-time collaboration tools" }]
      }
    ],
    pricing: [
      {
        name: "Starter",
        price: 29,
        seats: "5",
        description: "Perfect for small teams getting started with automation",
        features: [
          { value: "Basic workflow automation" },
          { value: "Team collaboration tools" },
          { value: "Email support" }
        ]
      },
      {
        name: "Professional",
        price: 89,
        seats: "15",
        description: "Advanced features for growing teams",
        features: [
          { value: "Advanced automation" },
          { value: "Custom integrations" },
          { value: "Priority support" },
          { value: "Analytics dashboard" }
        ]
      }
    ],
    totalReviews: 45,
    avgRating: 4.2,
    ratingDistribution: { "1": 1, "2": 2, "3": 8, "4": 20, "5": 14 },
    status: "published",
    isActive: "active",
    isFeatured: true
  },
  {
    name: "DataViz Analytics",
    slug: "dataviz-analytics",
    websiteUrl: "https://www.datavizanalytics.io",
    description: "Powerful data visualization and analytics platform for business intelligence",
    brandColors: "#10b981",
    mediaUrls: [
      "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233173-file.webp",
      "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233752-file.webp",
        "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233173-file.webp",
      "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233752-file.webp",
      "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233752-file.webp"
    ],
    features: [
      {
        title: "Interactive Dashboards",
        description: [{ value: "Create stunning interactive dashboards with drag-and-drop simplicity" }]
      },
      {
        title: "Real-time Analytics",
        description: [{ value: "Monitor your business metrics in real-time with automated insights" }]
      }
    ],
    pricing: [
      {
        name: "Basic",
        price: 39,
        seats: "3",
        description: "Essential analytics for small businesses",
        features: [
          { value: "Basic dashboards" },
          { value: "Data connectors" },
          { value: "Email reports" }
        ]
      }
    ],
    totalReviews: 0,
    avgRating: 0,
    ratingDistribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
    status: "published",
    isActive: "active",
    isFeatured: true
  },
  {
    name: "SecureCloud Manager",
    slug: "securecloud-manager",
    websiteUrl: "https://www.securecloudmanager.com",
    description: "Enterprise-grade cloud security and compliance management platform",
    brandColors: "#dc2626",
    mediaUrls: [
      "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233173-file.webp",
      "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233752-file.webp",
        "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233173-file.webp",
      "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233752-file.webp",
      "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233752-file.webp"
    ],
    features: [
      {
        title: "Security Monitoring",
        description: [{ value: "24/7 automated security monitoring and threat detection" }]
      },
      {
        title: "Compliance Management",
        description: [{ value: "Automated compliance reporting for SOC2, GDPR, and more" }]
      }
    ],
    pricing: [
      {
        name: "Enterprise",
        price: 199,
        seats: "Unlimited",
        description: "Complete security solution for large organizations",
        features: [
          { value: "Advanced threat detection" },
          { value: "Compliance automation" },
          { value: "24/7 support" },
          { value: "Custom integrations" }
        ]
      }
    ],
    totalReviews: 0,
    avgRating: 0,
    ratingDistribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
    status: "published",
    isActive: "active",
    isFeatured: false
  },
  {
    name: "DesignSystem Studio",
    slug: "designsystem-studio",
    websiteUrl: "https://www.designsystemstudio.com",
    description: "Collaborative design system creation and management platform for design teams",
    brandColors: "#8b5cf6",
    mediaUrls: [
      "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233173-file.webp",
      "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233752-file.webp",
        "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233173-file.webp",
      "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233752-file.webp",
      "https://nfls3.s3.us-east-1.amazonaws.com/uploads/compressed/1752640233752-file.webp"
    ],
    features: [
      {
        title: "Component Library",
        description: [{ value: "Build and maintain comprehensive component libraries" }]
      },
      {
        title: "Design Tokens",
        description: [{ value: "Manage design tokens across platforms and tools" }]
      }
    ],
    pricing: [
      {
        name: "Free",
        price: 0,
        seats: "2",
        description: "Perfect for individual designers and small projects",
        features: [
          { value: "Basic component library" },
          { value: "Design token management" },
          { value: "Community support" }
        ]
      },
      {
        name: "Team",
        price: 49,
        seats: "10",
        description: "Collaboration features for design teams",
        features: [
          { value: "Advanced components" },
          { value: "Team collaboration" },
          { value: "Version control" },
          { value: "Export capabilities" }
        ]
      }
    ],
    totalReviews: 0,
    avgRating: 0,
    ratingDistribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
    status: "published",
    isActive: "active",
    isFeatured: true
  }
];

// Helper function to get random elements from array
const getRandomElements = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
};

// Helper function to get random element from array
const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Seed product data with proper ID mapping
 */
const seedProducts = async (adminUserId) => {
  try {
    console.log('🌱 Starting product seeding...');

    // Get all available IDs from database
    const [software, solutions, industries, integrations, languages, marketSegments, userRoles] = await Promise.all([
      Software.find({}, '_id name slug'),
      Solution.find({}, '_id name slug'),
      Industry.find({}, '_id name slug'),
      Integration.find({}, '_id name slug'),
      Language.find({}, '_id name slug'),
      MarketSegment.find({}, '_id name slug'),
      UserRole.find({}, '_id name slug')
    ]);

    console.log('📊 Available reference data:');
    console.log(`   - Software: ${software.length}`);
    console.log(`   - Solutions: ${solutions.length}`);
    console.log(`   - Industries: ${industries.length}`);
    console.log(`   - Integrations: ${integrations.length}`);
    console.log(`   - Languages: ${languages.length}`);
    console.log(`   - Market Segments: ${marketSegments.length}`);
    console.log(`   - User Roles: ${userRoles.length}`);

    // Clear existing products
    await Product.deleteMany({});
    console.log('📝 Cleared existing products');

    // Create products with mapped IDs
    const createdProducts = [];
    
    for (const productItem of productData) {
      // Create product with random related IDs
      const product = new Product({
        ...productItem,
        userId: adminUserId,
        
        // Randomly assign 1-3 software categories
        softwareIds: software.length > 0 ? getRandomElements(software, Math.floor(Math.random() * 3) + 1).map(s => s._id) : [],
        
        // Randomly assign 1-2 solutions
        solutionIds: solutions.length > 0 ? getRandomElements(solutions, Math.floor(Math.random() * 2) + 1).map(s => s._id) : [],
        
        // Randomly assign 1-3 industries
        industries: industries.length > 0 ? getRandomElements(industries, Math.floor(Math.random() * 3) + 1).map(i => i._id) : [],
        
        // Randomly assign 2-5 integrations
        integrations: integrations.length > 0 ? getRandomElements(integrations, Math.floor(Math.random() * 4) + 2).map(i => i._id) : [],
        
        // Randomly assign 1-2 languages
        languages: languages.length > 0 ? getRandomElements(languages, Math.floor(Math.random() * 2) + 1).map(l => l._id) : [],
        
        // Randomly assign 1 market segment
        marketSegment: marketSegments.length > 0 ? [getRandomElement(marketSegments)._id] : [],
        
        // Randomly assign 2-4 user roles for whoCanUse
        whoCanUse: userRoles.length > 0 ? getRandomElements(userRoles, Math.floor(Math.random() * 3) + 2).map(r => r._id) : [],
        
        // Set some realistic flags
        isFree: productItem.pricing?.[0]?.price === 0,
        keywords: [productItem.name.toLowerCase(), 'software', 'productivity'],
        publishedAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000), // Random date within last 90 days
      });

      await product.save();
      createdProducts.push(product);
    }

    console.log(`✅ Successfully seeded ${createdProducts.length} products`);
    console.log('📊 Product breakdown:');
    console.log(`   - Published: ${createdProducts.filter(p => p.status === 'published').length}`);
    console.log(`   - Active: ${createdProducts.filter(p => p.isActive === 'active').length}`);
    console.log(`   - Featured: ${createdProducts.filter(p => p.isFeatured).length}`);
    console.log(`   - Free: ${createdProducts.filter(p => p.isFree).length}`);
    console.log(`   - Average Rating: ${(createdProducts.reduce((sum, p) => sum + p.avgRating, 0) / createdProducts.length).toFixed(1)}`);

    return createdProducts;
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  }
};

module.exports = {
  seedProducts,
  productData
}; 