const { Software } = require('../../models');
const mongoose = require('mongoose');

const softwareData = [
  // Development Tools
  {
    name: 'Visual Studio Code',
    description: 'A lightweight but powerful source code editor with built-in support for JavaScript, TypeScript and Node.js.',
    features: ['IntelliSense', 'Debugging', 'Built-in Git', 'Extensions', 'Integrated Terminal'],
    technologies: ['Electron', 'TypeScript', 'Node.js'],
    category: 'Development Tools',
    pricing: 'Free',
    website: 'https://code.visualstudio.com',
    status: 'active'
  },
  {
    name: 'JetBrains IntelliJ IDEA',
    description: 'The Leading Java and Kotlin IDE for enterprise, web, and mobile development.',
    features: ['Smart Code Completion', 'Framework-specific assistance', 'Built-in Developer Tools', 'Version Control'],
    technologies: ['Java', 'Kotlin', 'Swing'],
    category: 'Development Tools',
    pricing: 'Freemium',
    website: 'https://www.jetbrains.com/idea',
    status: 'active'
  },
  {
    name: 'Docker Desktop',
    description: 'The fastest way to containerize applications on your desktop.',
    features: ['Container Management', 'Kubernetes', 'Docker Compose', 'Volume Management'],
    technologies: ['Go', 'Docker', 'Kubernetes'],
    category: 'DevOps',
    pricing: 'Freemium',
    website: 'https://www.docker.com/products/docker-desktop',
    status: 'active'
  },
  {
    name: 'GitHub Desktop',
    description: 'Focus on what matters instead of fighting with Git.',
    features: ['Visual Git Interface', 'Branch Management', 'Pull Requests', 'Issue Tracking'],
    technologies: ['Electron', 'TypeScript', 'React'],
    category: 'Version Control',
    pricing: 'Free',
    website: 'https://desktop.github.com',
    status: 'active'
  },

  // Productivity Software
  {
    name: 'Notion',
    description: 'One workspace. Every team. We are more than a doc. Or a table. Customize Notion to work the way you do.',
    features: ['Note Taking', 'Database', 'Kanban Boards', 'Templates', 'Collaboration'],
    technologies: ['React', 'Node.js', 'PostgreSQL'],
    category: 'Productivity',
    pricing: 'Freemium',
    website: 'https://www.notion.so',
    status: 'active'
  },
  {
    name: 'Obsidian',
    description: 'A powerful knowledge base that works on top of a local folder of plain text Markdown files.',
    features: ['Linked References', 'Graph View', 'Plugins', 'Themes', 'Markdown Support'],
    technologies: ['Electron', 'TypeScript', 'CodeMirror'],
    category: 'Productivity',
    pricing: 'Freemium',
    website: 'https://obsidian.md',
    status: 'active'
  },
  {
    name: 'Slack',
    description: 'Slack is where work flows. It is the digital HQ that powers your distributed workforce.',
    features: ['Channels', 'Direct Messages', 'File Sharing', 'App Integrations', 'Video Calls'],
    technologies: ['React', 'Electron', 'Node.js'],
    category: 'Communication',
    pricing: 'Freemium',
    website: 'https://slack.com',
    status: 'active'
  },

  // Design Software
  {
    name: 'Figma',
    description: 'Figma connects everyone in the design process so teams can deliver better products, faster.',
    features: ['Real-time Collaboration', 'Prototyping', 'Design Systems', 'Developer Handoff'],
    technologies: ['WebAssembly', 'C++', 'TypeScript'],
    category: 'Design',
    pricing: 'Freemium',
    website: 'https://www.figma.com',
    status: 'active'
  },
  {
    name: 'Adobe Photoshop',
    description: 'Create beautiful images, graphics, paintings, and 3D artwork on desktop and iPad.',
    features: ['Photo Editing', 'Digital Painting', 'Typography', 'Layer Support', 'Filter Effects'],
    technologies: ['C++', 'JavaScript', 'CEP'],
    category: 'Design',
    pricing: 'Subscription',
    website: 'https://www.adobe.com/products/photoshop.html',
    status: 'active'
  },
  {
    name: 'Sketch',
    description: 'Create, prototype, collaborate and turn your ideas into incredible products with Sketch.',
    features: ['Vector Editing', 'Symbols', 'Libraries', 'Prototyping', 'Cloud Sync'],
    technologies: ['Objective-C', 'Swift', 'macOS'],
    category: 'Design',
    pricing: 'Subscription',
    website: 'https://www.sketch.com',
    status: 'active'
  },

  // Data & Analytics
  {
    name: 'Tableau',
    description: 'Tableau helps people see and understand data with analytics software that makes data visualization easy.',
    features: ['Data Visualization', 'Interactive Dashboards', 'Data Blending', 'Statistical Analysis'],
    technologies: ['C++', 'Java', 'JavaScript'],
    category: 'Analytics',
    pricing: 'Enterprise',
    website: 'https://www.tableau.com',
    status: 'active'
  },
  {
    name: 'Power BI',
    description: 'Microsoft Power BI is a business analytics service that delivers insights to enable fast, informed decisions.',
    features: ['Data Modeling', 'Real-time Dashboards', 'Natural Language Queries', 'Mobile Access'],
    technologies: ['.NET', 'Azure', 'DAX'],
    category: 'Analytics',
    pricing: 'Subscription',
    website: 'https://powerbi.microsoft.com',
    status: 'active'
  },

  // Database Software
  {
    name: 'MongoDB Compass',
    description: 'The GUI for MongoDB. Visually explore your data.',
    features: ['Query Builder', 'Schema Validation', 'Performance Monitoring', 'Index Management'],
    technologies: ['Electron', 'React', 'Node.js'],
    category: 'Database',
    pricing: 'Free',
    website: 'https://www.mongodb.com/products/compass',
    status: 'active'
  },
  {
    name: 'pgAdmin',
    description: 'pgAdmin is the most popular and feature rich Open Source administration and development platform for PostgreSQL.',
    features: ['SQL Query Tool', 'Database Browser', 'Server Administration', 'Backup & Restore'],
    technologies: ['Python', 'Flask', 'JavaScript'],
    category: 'Database',
    pricing: 'Free',
    website: 'https://www.pgadmin.org',
    status: 'active'
  },

  // Security Software
  {
    name: '1Password',
    description: 'Go ahead. Forget your passwords. 1Password remembers them all for you.',
    features: ['Password Management', 'Secure Notes', 'Two-Factor Authentication', 'Team Sharing'],
    technologies: ['Rust', 'React', 'Go'],
    category: 'Security',
    pricing: 'Subscription',
    website: 'https://1password.com',
    status: 'active'
  },
  {
    name: 'Burp Suite',
    description: 'The leading toolkit for web application security testing.',
    features: ['Web Vulnerability Scanner', 'Proxy Tool', 'Repeater', 'Intruder', 'Extensions'],
    technologies: ['Java', 'Swing'],
    category: 'Security',
    pricing: 'Freemium',
    website: 'https://portswigger.net/burp',
    status: 'active'
  },

  // Project Management
  {
    name: 'Jira',
    description: 'The #1 software development tool used by agile teams for project tracking and release management.',
    features: ['Issue Tracking', 'Agile Boards', 'Reports', 'Workflow Management', 'Integration Hub'],
    technologies: ['Java', 'Spring', 'React'],
    category: 'Project Management',
    pricing: 'Subscription',
    website: 'https://www.atlassian.com/software/jira',
    status: 'active'
  },
  {
    name: 'Trello',
    description: 'Trello brings all your tasks, teammates, and tools together.',
    features: ['Kanban Boards', 'Cards & Lists', 'Team Collaboration', 'Power-Ups', 'Templates'],
    technologies: ['CoffeeScript', 'Node.js', 'MongoDB'],
    category: 'Project Management',
    pricing: 'Freemium',
    website: 'https://trello.com',
    status: 'active'
  },
  {
    name: 'Linear',
    description: 'Linear helps streamline software projects, sprints, tasks, and bug tracking.',
    features: ['Issue Tracking', 'Project Planning', 'Team Workflows', 'Git Integration'],
    technologies: ['TypeScript', 'React', 'Node.js'],
    category: 'Project Management',
    pricing: 'Subscription',
    website: 'https://linear.app',
    status: 'active'
  },

  // Some legacy/inactive software
  {
    name: 'Internet Explorer',
    description: 'Legacy web browser from Microsoft.',
    features: ['Web Browsing', 'ActiveX Support'],
    technologies: ['C++', 'ActiveX'],
    category: 'Web Browser',
    pricing: 'Free',
    website: 'https://www.microsoft.com',
    status: 'inactive'
  },
  {
    name: 'Adobe Flash Player',
    description: 'Legacy multimedia software platform.',
    features: ['Flash Content', 'Animation Playback'],
    technologies: ['ActionScript', 'C++'],
    category: 'Multimedia',
    pricing: 'Free',
    website: 'https://www.adobe.com',
    status: 'inactive'
  }
];

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

    console.log(`✅ Successfully seeded ${createdSoftware.length} software items`);
    console.log('📊 Software breakdown:');
    console.log(`   - Active: ${createdSoftware.filter(s => s.status === 'active').length}`);
    console.log(`   - Inactive: ${createdSoftware.filter(s => s.status === 'inactive').length}`);
    
    // Log categories
    const categories = [...new Set(createdSoftware.map(s => s.category))];
    console.log(`   - Categories: ${categories.join(', ')}`);

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