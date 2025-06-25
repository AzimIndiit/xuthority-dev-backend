const { Solution } = require('../../models');
const mongoose = require('mongoose');

const solutionData = [
  // Cloud Migration Solutions
  {
    name: 'AWS Cloud Migration',
    description: 'Complete migration of legacy systems to Amazon Web Services cloud infrastructure with minimal downtime.',
    deliverables: ['Migration Assessment', 'Infrastructure Design', 'Data Migration', 'Application Porting', 'Testing & Validation', 'Go-Live Support'],
    timeline: '12-16 weeks',
    teamSize: '4-6 specialists',
    complexity: 'high',
    category: 'Cloud Migration',
    pricing: 'Custom Quote',
    status: 'active'
  },
  {
    name: 'Azure DevOps Implementation',
    description: 'Implementation of Azure DevOps platform for CI/CD pipelines, project management, and team collaboration.',
    deliverables: ['Current State Analysis', 'Pipeline Design', 'Environment Setup', 'Team Training', 'Documentation'],
    timeline: '8-10 weeks',
    teamSize: '3-4 specialists',
    complexity: 'medium',
    category: 'DevOps',
    pricing: 'Fixed Price',
    status: 'active'
  },
  {
    name: 'Google Cloud Platform Setup',
    description: 'Complete setup and configuration of GCP services for scalable web applications.',
    deliverables: ['Architecture Planning', 'Service Configuration', 'Security Setup', 'Monitoring Implementation', 'Cost Optimization'],
    timeline: '6-8 weeks',
    teamSize: '2-3 specialists',
    complexity: 'medium',
    category: 'Cloud Setup',
    pricing: 'Time & Materials',
    status: 'active'
  },

  // Digital Transformation Solutions
  {
    name: 'Digital Transformation Strategy',
    description: 'Comprehensive digital transformation roadmap for traditional businesses moving to digital-first operations.',
    deliverables: ['Current State Assessment', 'Technology Roadmap', 'Process Redesign', 'Change Management Plan', 'Implementation Timeline'],
    timeline: '16-20 weeks',
    teamSize: '5-8 specialists',
    complexity: 'high',
    category: 'Digital Transformation',
    pricing: 'Custom Quote',
    status: 'active'
  },
  {
    name: 'Legacy System Modernization',
    description: 'Modernization of legacy applications using cloud-native technologies and microservices architecture.',
    deliverables: ['Legacy Assessment', 'Modernization Strategy', 'Application Refactoring', 'Database Migration', 'Performance Optimization'],
    timeline: '20-24 weeks',
    teamSize: '6-10 specialists',
    complexity: 'high',
    category: 'Modernization',
    pricing: 'Custom Quote',
    status: 'active'
  },

  // API Development Solutions
  {
    name: 'RESTful API Development',
    description: 'Design and development of scalable REST APIs with comprehensive documentation and testing.',
    deliverables: ['API Design', 'Implementation', 'Documentation', 'Testing Suite', 'Deployment Guide'],
    timeline: '4-6 weeks',
    teamSize: '2-3 specialists',
    complexity: 'low',
    category: 'API Development',
    pricing: 'Fixed Price',
    status: 'active'
  },
  {
    name: 'GraphQL API Implementation',
    description: 'Implementation of GraphQL API for flexible and efficient data fetching with real-time capabilities.',
    deliverables: ['Schema Design', 'Resolver Implementation', 'Subscription Setup', 'Documentation', 'Client Integration'],
    timeline: '6-8 weeks',
    teamSize: '3-4 specialists',
    complexity: 'medium',
    category: 'API Development',
    pricing: 'Time & Materials',
    status: 'active'
  },
  {
    name: 'Microservices Architecture',
    description: 'Design and implementation of microservices architecture for scalable and maintainable applications.',
    deliverables: ['Service Design', 'API Gateway Setup', 'Service Implementation', 'Inter-service Communication', 'Monitoring & Logging'],
    timeline: '12-16 weeks',
    teamSize: '4-6 specialists',
    complexity: 'high',
    category: 'Architecture',
    pricing: 'Custom Quote',
    status: 'active'
  },

  // Data Solutions
  {
    name: 'Data Warehouse Implementation',
    description: 'Design and implementation of enterprise data warehouse for business intelligence and analytics.',
    deliverables: ['Data Modeling', 'ETL Pipeline', 'Warehouse Setup', 'BI Dashboard', 'Training & Support'],
    timeline: '14-18 weeks',
    teamSize: '4-5 specialists',
    complexity: 'high',
    category: 'Data Engineering',
    pricing: 'Custom Quote',
    status: 'active'
  },
  {
    name: 'Real-time Analytics Platform',
    description: 'Implementation of real-time data processing and analytics platform using modern streaming technologies.',
    deliverables: ['Stream Processing Setup', 'Data Pipeline', 'Real-time Dashboards', 'Alert System', 'Performance Optimization'],
    timeline: '10-12 weeks',
    teamSize: '3-4 specialists',
    complexity: 'high',
    category: 'Real-time Analytics',
    pricing: 'Time & Materials',
    status: 'active'
  },

  // Security Solutions
  {
    name: 'Security Audit & Compliance',
    description: 'Comprehensive security audit and implementation of compliance frameworks (SOC2, ISO 27001, GDPR).',
    deliverables: ['Security Assessment', 'Vulnerability Report', 'Compliance Gap Analysis', 'Security Implementation', 'Documentation'],
    timeline: '8-12 weeks',
    teamSize: '2-3 specialists',
    complexity: 'medium',
    category: 'Security',
    pricing: 'Fixed Price',
    status: 'active'
  },
  {
    name: 'Zero Trust Security Implementation',
    description: 'Implementation of Zero Trust security model for enhanced enterprise security posture.',
    deliverables: ['Security Architecture', 'Identity Management', 'Network Segmentation', 'Monitoring Setup', 'Policy Implementation'],
    timeline: '12-16 weeks',
    teamSize: '4-5 specialists',
    complexity: 'high',
    category: 'Security',
    pricing: 'Custom Quote',
    status: 'active'
  },

  // Mobile App Development
  {
    name: 'Cross-Platform Mobile App',
    description: 'Development of cross-platform mobile application using React Native or Flutter.',
    deliverables: ['UI/UX Design', 'App Development', 'Backend Integration', 'Testing', 'App Store Deployment'],
    timeline: '12-16 weeks',
    teamSize: '4-5 specialists',
    complexity: 'medium',
    category: 'Mobile Development',
    pricing: 'Fixed Price',
    status: 'active'
  },
  {
    name: 'Progressive Web App (PWA)',
    description: 'Development of Progressive Web Application with offline capabilities and native-like experience.',
    deliverables: ['PWA Development', 'Service Worker Implementation', 'Offline Support', 'Push Notifications', 'Performance Optimization'],
    timeline: '8-10 weeks',
    teamSize: '3-4 specialists',
    complexity: 'medium',
    category: 'Web Development',
    pricing: 'Time & Materials',
    status: 'active'
  },

  // E-commerce Solutions
  {
    name: 'E-commerce Platform Development',
    description: 'Custom e-commerce platform development with payment gateway integration and inventory management.',
    deliverables: ['Platform Development', 'Payment Integration', 'Inventory System', 'Admin Dashboard', 'Mobile Optimization'],
    timeline: '16-20 weeks',
    teamSize: '5-7 specialists',
    complexity: 'high',
    category: 'E-commerce',
    pricing: 'Custom Quote',
    status: 'active'
  },
  {
    name: 'Shopify Plus Customization',
    description: 'Advanced Shopify Plus customization with custom apps and third-party integrations.',
    deliverables: ['Theme Customization', 'Custom App Development', 'Third-party Integrations', 'Performance Optimization', 'Training'],
    timeline: '6-8 weeks',
    teamSize: '2-3 specialists',
    complexity: 'medium',
    category: 'E-commerce',
    pricing: 'Fixed Price',
    status: 'active'
  },

  // Integration Solutions
  {
    name: 'Enterprise System Integration',
    description: 'Integration of multiple enterprise systems (CRM, ERP, HR) for seamless data flow and process automation.',
    deliverables: ['Integration Design', 'API Development', 'Data Mapping', 'Testing', 'Documentation'],
    timeline: '10-14 weeks',
    teamSize: '4-5 specialists',
    complexity: 'high',
    category: 'System Integration',
    pricing: 'Time & Materials',
    status: 'active'
  },
  {
    name: 'Salesforce Integration',
    description: 'Custom Salesforce integration with existing business systems and third-party applications.',
    deliverables: ['Salesforce Configuration', 'Custom Objects', 'API Integration', 'Workflow Automation', 'User Training'],
    timeline: '8-10 weeks',
    teamSize: '2-3 specialists',
    complexity: 'medium',
    category: 'CRM Integration',
    pricing: 'Fixed Price',
    status: 'active'
  },

  // Performance Optimization
  {
    name: 'Website Performance Optimization',
    description: 'Comprehensive website performance optimization for improved loading speeds and user experience.',
    deliverables: ['Performance Audit', 'Code Optimization', 'Image Optimization', 'CDN Setup', 'Monitoring Implementation'],
    timeline: '4-6 weeks',
    teamSize: '2-3 specialists',
    complexity: 'low',
    category: 'Performance',
    pricing: 'Fixed Price',
    status: 'active'
  },
  {
    name: 'Database Performance Tuning',
    description: 'Database performance optimization including query tuning, indexing, and architecture improvements.',
    deliverables: ['Performance Analysis', 'Query Optimization', 'Index Strategy', 'Architecture Review', 'Monitoring Setup'],
    timeline: '6-8 weeks',
    teamSize: '2-3 specialists',
    complexity: 'medium',
    category: 'Database Optimization',
    pricing: 'Time & Materials',
    status: 'active'
  },

  // Some inactive/legacy solutions
  {
    name: 'Flash Website Migration',
    description: 'Migration of Flash-based websites to modern web technologies.',
    deliverables: ['Flash Analysis', 'HTML5 Conversion', 'Interactive Elements', 'Testing'],
    timeline: '8-10 weeks',
    teamSize: '3-4 specialists',
    complexity: 'medium',
    category: 'Legacy Migration',
    pricing: 'Fixed Price',
    status: 'inactive'
  },
  {
    name: 'Internet Explorer Compatibility',
    description: 'Website compatibility fixes for Internet Explorer browsers.',
    deliverables: ['Compatibility Testing', 'CSS Fixes', 'JavaScript Polyfills', 'Testing'],
    timeline: '2-4 weeks',
    teamSize: '1-2 specialists',
    complexity: 'low',
    category: 'Browser Compatibility',
    pricing: 'Fixed Price',
    status: 'inactive'
  }
];

/**
 * Seed solutions data
 */
const seedSolutions = async (adminUserId) => {
  try {
    console.log('🌱 Starting solution seeding...');

    // Clear existing solutions
    await Solution.deleteMany({});
    console.log('📝 Cleared existing solutions');

    // Create solutions with proper user reference
    const solutionsToCreate = solutionData.map(solution => ({
      ...solution,
      createdBy: adminUserId
    }));

    const createdSolutions = [];
    for (const solutionItem of solutionsToCreate) {
      const solution = new Solution(solutionItem);
      await solution.save();
      createdSolutions.push(solution);
    }

    console.log(`✅ Successfully seeded ${createdSolutions.length} solutions`);
    console.log('📊 Solutions breakdown:');
    console.log(`   - Active: ${createdSolutions.filter(s => s.status === 'active').length}`);
    console.log(`   - Inactive: ${createdSolutions.filter(s => s.status === 'inactive').length}`);
    
    // Log categories
    const categories = [...new Set(createdSolutions.map(s => s.category))];
    console.log(`   - Categories: ${categories.join(', ')}`);
    
    // Log complexity distribution
    const complexities = createdSolutions.reduce((acc, s) => {
      acc[s.complexity] = (acc[s.complexity] || 0) + 1;
      return acc;
    }, {});
    console.log(`   - Complexity: ${Object.entries(complexities).map(([k,v]) => `${k}: ${v}`).join(', ')}`);

    return createdSolutions;
  } catch (error) {
    console.error('❌ Error seeding solutions:', error);
    throw error;
  }
};

module.exports = {
  seedSolutions,
  solutionData
}; 