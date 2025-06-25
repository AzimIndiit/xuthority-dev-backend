const { UserRole } = require('../../models');
const mongoose = require('mongoose');

const userRoleData = [
  // Executive Roles
  {
    name: 'Chief Executive Officer',
    status: 'active'
  },
  {
    name: 'Chief Technology Officer',
    status: 'active'
  },
  {
    name: 'Chief Information Officer',
    status: 'active'
  },
  {
    name: 'Chief Data Officer',
    status: 'active'
  },
  {
    name: 'Chief Security Officer',
    status: 'active'
  },
  {
    name: 'Chief Product Officer',
    status: 'active'
  },
  {
    name: 'Chief Operating Officer',
    status: 'active'
  },
  {
    name: 'Chief Financial Officer',
    status: 'active'
  },
  {
    name: 'Chief Marketing Officer',
    status: 'active'
  },

  // Management Roles
  {
    name: 'Engineering Manager',
    status: 'active'
  },
  {
    name: 'Product Manager',
    status: 'active'
  },
  {
    name: 'Project Manager',
    status: 'active'
  },
  {
    name: 'Program Manager',
    status: 'active'
  },
  {
    name: 'IT Manager',
    status: 'active'
  },
  {
    name: 'Development Manager',
    status: 'active'
  },
  {
    name: 'Operations Manager',
    status: 'active'
  },
  {
    name: 'Security Manager',
    status: 'active'
  },
  {
    name: 'Quality Assurance Manager',
    status: 'active'
  },
  {
    name: 'Technical Lead',
    status: 'active'
  },
  {
    name: 'Team Lead',
    status: 'active'
  },

  // Development Roles
  {
    name: 'Software Engineer',
    status: 'active'
  },
  {
    name: 'Senior Software Engineer',
    status: 'active'
  },
  {
    name: 'Staff Software Engineer',
    status: 'active'
  },
  {
    name: 'Principal Software Engineer',
    status: 'active'
  },
  {
    name: 'Frontend Developer',
    status: 'active'
  },
  {
    name: 'Backend Developer',
    status: 'active'
  },
  {
    name: 'Full Stack Developer',
    status: 'active'
  },
  {
    name: 'Mobile Developer',
    status: 'active'
  },
  {
    name: 'Web Developer',
    status: 'active'
  },
  {
    name: 'Software Architect',
    status: 'active'
  },
  {
    name: 'Solutions Architect',
    status: 'active'
  },
  {
    name: 'Enterprise Architect',
    status: 'active'
  },
  {
    name: 'Cloud Architect',
    status: 'active'
  },
  {
    name: 'Security Architect',
    status: 'active'
  },

  // DevOps & Infrastructure
  {
    name: 'DevOps Engineer',
    status: 'active'
  },
  {
    name: 'Site Reliability Engineer',
    status: 'active'
  },
  {
    name: 'Platform Engineer',
    status: 'active'
  },
  {
    name: 'Infrastructure Engineer',
    status: 'active'
  },
  {
    name: 'Cloud Engineer',
    status: 'active'
  },
  {
    name: 'Network Engineer',
    status: 'active'
  },
  {
    name: 'Systems Administrator',
    status: 'active'
  },
  {
    name: 'Database Administrator',
    status: 'active'
  },

  // Quality & Testing
  {
    name: 'Quality Assurance Engineer',
    status: 'active'
  },
  {
    name: 'Test Engineer',
    status: 'active'
  },
  {
    name: 'Automation Engineer',
    status: 'active'
  },
  {
    name: 'Performance Engineer',
    status: 'active'
  },
  {
    name: 'Security Engineer',
    status: 'active'
  },
  {
    name: 'Penetration Tester',
    status: 'active'
  },

  // Data & Analytics
  {
    name: 'Data Engineer',
    status: 'active'
  },
  {
    name: 'Data Scientist',
    status: 'active'
  },
  {
    name: 'Data Analyst',
    status: 'active'
  },
  {
    name: 'Business Intelligence Analyst',
    status: 'active'
  },
  {
    name: 'Machine Learning Engineer',
    status: 'active'
  },
  {
    name: 'AI Researcher',
    status: 'active'
  },

  // Design & UX
  {
    name: 'UX Designer',
    status: 'active'
  },
  {
    name: 'UI Designer',
    status: 'active'
  },
  {
    name: 'Product Designer',
    status: 'active'
  },
  {
    name: 'Design Lead',
    status: 'active'
  },
  {
    name: 'Creative Director',
    status: 'active'
  },

  // Business & Strategy
  {
    name: 'Business Analyst',
    status: 'active'
  },
  {
    name: 'Technical Business Analyst',
    status: 'active'
  },
  {
    name: 'Systems Analyst',
    status: 'active'
  },
  {
    name: 'Strategy Consultant',
    status: 'active'
  },
  {
    name: 'Digital Transformation Lead',
    status: 'active'
  },

  // Sales & Marketing
  {
    name: 'Sales Engineer',
    status: 'active'
  },
  {
    name: 'Technical Sales Specialist',
    status: 'active'
  },
  {
    name: 'Solutions Consultant',
    status: 'active'
  },
  {
    name: 'Pre-Sales Engineer',
    status: 'active'
  },
  {
    name: 'Marketing Manager',
    status: 'active'
  },
  {
    name: 'Digital Marketing Specialist',
    status: 'active'
  },

  // Support & Operations
  {
    name: 'Technical Support Engineer',
    status: 'active'
  },
  {
    name: 'Customer Success Manager',
    status: 'active'
  },
  {
    name: 'Implementation Specialist',
    status: 'active'
  },
  {
    name: 'Training Specialist',
    status: 'active'
  },
  {
    name: 'Documentation Specialist',
    status: 'active'
  },

  // Compliance & Governance
  {
    name: 'Compliance Officer',
    status: 'active'
  },
  {
    name: 'IT Governance Specialist',
    status: 'active'
  },
  {
    name: 'Risk Management Specialist',
    status: 'active'
  },
  {
    name: 'Privacy Officer',
    status: 'active'
  },

  // Consultant Roles
  {
    name: 'Technical Consultant',
    status: 'active'
  },
  {
    name: 'Implementation Consultant',
    status: 'active'
  },
  {
    name: 'Integration Consultant',
    status: 'active'
  },
  {
    name: 'Digital Consultant',
    status: 'active'
  },

  // Junior/Entry Level Roles
  {
    name: 'Junior Developer',
    status: 'active'
  },
  {
    name: 'Graduate Developer',
    status: 'active'
  },
  {
    name: 'Intern',
    status: 'active'
  },
  {
    name: 'Junior Analyst',
    status: 'active'
  },
  {
    name: 'Junior Consultant',
    status: 'active'
  },

  // Freelance/Contract Roles
  {
    name: 'Freelance Developer',
    status: 'active'
  },
  {
    name: 'Contract Specialist',
    status: 'active'
  },
  {
    name: 'Independent Consultant',
    status: 'active'
  },

  // Some inactive/deprecated roles
  {
    name: 'Flash Developer',
    status: 'inactive'
  },
  {
    name: 'Silverlight Developer',
    status: 'inactive'
  },
  {
    name: 'Internet Explorer Specialist',
    status: 'inactive'
  }
];

/**
 * Seed user roles data
 */
const seedUserRoles = async (adminUserId) => {
  try {
    console.log('🌱 Starting user role seeding...');

    // Clear existing user roles
    await UserRole.deleteMany({});
    console.log('📝 Cleared existing user roles');

    // Create user roles with proper user reference
    const rolesToCreate = userRoleData.map(role => ({
      ...role,
      createdBy: adminUserId
    }));

    const createdRoles = [];
    for (const roleData of rolesToCreate) {
      const role = new UserRole(roleData);
      await role.save();
      createdRoles.push(role);
    }

    console.log(`✅ Successfully seeded ${createdRoles.length} user roles`);
    console.log('📊 User Roles breakdown:');
    console.log(`   - Active: ${createdRoles.filter(r => r.status === 'active').length}`);
    console.log(`   - Inactive: ${createdRoles.filter(r => r.status === 'inactive').length}`);

    return createdRoles;
  } catch (error) {
    console.error('❌ Error seeding user roles:', error);
    throw error;
  }
};

module.exports = {
  seedUserRoles,
  userRoleData
}; 