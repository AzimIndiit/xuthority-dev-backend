const { Industry } = require('../../models');
const mongoose = require('mongoose');

const industryData = [
  // Software Industries
  {
    name: 'Financial Services',
    category: 'software',
    status: 'active'
  },
  {
    name: 'Healthcare',
    category: 'software',
    status: 'active'
  },
  {
    name: 'E-commerce',
    category: 'software',
    status: 'active'
  },
  {
    name: 'Education Technology',
    category: 'software',
    status: 'active'
  },
  {
    name: 'Gaming',
    category: 'software',
    status: 'active'
  },
  {
    name: 'Social Media',
    category: 'software',
    status: 'active'
  },
  {
    name: 'Cybersecurity',
    category: 'software',
    status: 'active'
  },
  {
    name: 'Developer Tools',
    category: 'software',
    status: 'active'
  },
  {
    name: 'Artificial Intelligence',
    category: 'software',
    status: 'active'
  },
  {
    name: 'Data Analytics',
    category: 'software',
    status: 'active'
  },
  {
    name: 'Cloud Computing',
    category: 'software',
    status: 'active'
  },
  {
    name: 'Mobile Applications',
    category: 'software',
    status: 'active'
  },
  {
    name: 'Enterprise Software',
    category: 'software',
    status: 'active'
  },
  {
    name: 'DevOps',
    category: 'software',
    status: 'active'
  },
  {
    name: 'Productivity Software',
    category: 'software',
    status: 'active'
  },
  {
    name: 'Communication Tools',
    category: 'software',
    status: 'active'
  },
  {
    name: 'Marketing Technology',
    category: 'software',
    status: 'active'
  },
  {
    name: 'Human Resources',
    category: 'software',
    status: 'active'
  },
  {
    name: 'Customer Relationship Management',
    category: 'software',
    status: 'active'
  },
  {
    name: 'Supply Chain Management',
    category: 'software',
    status: 'active'
  },

  // Solution Industries
  {
    name: 'Digital Transformation',
    category: 'solution',
    status: 'active'
  },
  {
    name: 'Business Process Automation',
    category: 'solution',
    status: 'active'
  },
  {
    name: 'Data Migration',
    category: 'solution',
    status: 'active'
  },
  {
    name: 'System Integration',
    category: 'solution',
    status: 'active'
  },
  {
    name: 'Cloud Migration',
    category: 'solution',
    status: 'active'
  },
  {
    name: 'Legacy System Modernization',
    category: 'solution',
    status: 'active'
  },
  {
    name: 'API Development',
    category: 'solution',
    status: 'active'
  },
  {
    name: 'Database Optimization',
    category: 'solution',
    status: 'active'
  },
  {
    name: 'Performance Optimization',
    category: 'solution',
    status: 'active'
  },
  {
    name: 'Security Implementation',
    category: 'solution',
    status: 'active'
  },
  {
    name: 'Compliance Solutions',
    category: 'solution',
    status: 'active'
  },
  {
    name: 'Disaster Recovery',
    category: 'solution',
    status: 'active'
  },
  {
    name: 'Backup Solutions',
    category: 'solution',
    status: 'active'
  },
  {
    name: 'Monitoring & Analytics',
    category: 'solution',
    status: 'active'
  },
  {
    name: 'Custom Development',
    category: 'solution',
    status: 'active'
  },
  {
    name: 'Third-party Integrations',
    category: 'solution',
    status: 'active'
  },
  {
    name: 'Workflow Automation',
    category: 'solution',
    status: 'active'
  },
  {
    name: 'Reporting Solutions',
    category: 'solution',
    status: 'active'
  },
  {
    name: 'Training & Support',
    category: 'solution',
    status: 'active'
  },
  {
    name: 'Maintenance & Updates',
    category: 'solution',
    status: 'active'
  },

  // Some inactive industries
  {
    name: 'Legacy Mainframe',
    category: 'software',
    status: 'inactive'
  },
  {
    name: 'Flash Development',
    category: 'software',
    status: 'inactive'
  },
  {
    name: 'Physical Media Distribution',
    category: 'solution',
    status: 'inactive'
  }
];

/**
 * Seed industries data
 */
const seedIndustries = async (adminUserId) => {
  try {
    console.log('🌱 Starting industry seeding...');

    // Clear existing industries
    await Industry.deleteMany({});
    console.log('📝 Cleared existing industries');

    // Create industries with proper user reference
    const industriesToCreate = industryData.map(industry => ({
      ...industry,
      createdBy: adminUserId
    }));

    const createdIndustries = [];
    for (const industryData of industriesToCreate) {
      const industry = new Industry(industryData);
      await industry.save();
      createdIndustries.push(industry);
    }

    console.log(`✅ Successfully seeded ${createdIndustries.length} industries`);
    console.log('📊 Industries breakdown:');
    console.log(`   - Software: ${createdIndustries.filter(i => i.category === 'software').length}`);
    console.log(`   - Solution: ${createdIndustries.filter(i => i.category === 'solution').length}`);
    console.log(`   - Active: ${createdIndustries.filter(i => i.status === 'active').length}`);
    console.log(`   - Inactive: ${createdIndustries.filter(i => i.status === 'inactive').length}`);

    return createdIndustries;
  } catch (error) {
    console.error('❌ Error seeding industries:', error);
    throw error;
  }
};

module.exports = {
  seedIndustries,
  industryData
}; 