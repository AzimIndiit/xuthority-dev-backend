const { Integration } = require('../../models');
const mongoose = require('mongoose');

const integrationData = [
  // Development Tools
  {
    name: 'GitHub',
    image: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    status: 'active'
  },
  {
    name: 'GitLab',
    image: 'https://about.gitlab.com/images/press/logo/png/gitlab-logo-gray-rgb.png',
    status: 'active'
  },
  {
    name: 'Bitbucket',
    image: 'https://wac-cdn.atlassian.com/dam/jcr:8f7be6ec-b1bb-4e73-9ba8-c1ebf75bb2b1/bitbucket-logo-blue.png',
    status: 'active'
  },
  {
    name: 'Docker',
    image: 'https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png',
    status: 'active'
  },
  {
    name: 'Kubernetes',
    image: 'https://kubernetes.io/images/kubernetes-horizontal-color.png',
    status: 'active'
  },

  // Cloud Platforms
  {
    name: 'Amazon Web Services',
    image: 'https://a0.awsstatic.com/libra-css/images/logos/aws_logo_smile_1200x630.png',
    status: 'active'
  },
  {
    name: 'Microsoft Azure',
    image: 'https://swimburger.net/media/ppnn3pcl/azure.png',
    status: 'active'
  },
  {
    name: 'Google Cloud Platform',
    image: 'https://cloud.google.com/_static/cloud/images/social-icon-google-cloud-1200-630.png',
    status: 'active'
  },
  {
    name: 'DigitalOcean',
    image: 'https://www.digitalocean.com/_next/static/media/intro-to-cloud.d49bc5f7.jpeg',
    status: 'active'
  },
  {
    name: 'Heroku',
    image: 'https://brand.heroku.com/static/media/heroku-logo-solid-color.61d928ba.png',
    status: 'active'
  },

  // Databases
  {
    name: 'MongoDB',
    image: 'https://webassets.mongodb.com/_com_assets/cms/mongodb_logo1-76twgcu2dm.png',
    status: 'active'
  },
  {
    name: 'PostgreSQL',
    image: 'https://www.postgresql.org/media/img/about/press/elephant.png',
    status: 'active'
  },
  {
    name: 'MySQL',
    image: 'https://www.mysql.com/common/logos/logo-mysql-170x115.png',
    status: 'active'
  },
  {
    name: 'Redis',
    image: 'https://redis.io/images/redis-white.png',
    status: 'active'
  },
  {
    name: 'Elasticsearch',
    image: 'https://www.elastic.co/static-res/images/elastic-logo-200.png',
    status: 'active'
  },

  // Communication & Collaboration
  {
    name: 'Slack',
    image: 'https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png',
    status: 'active'
  },
  {
    name: 'Microsoft Teams',
    image: 'https://statics.teams.cdn.office.net/hashedassets-launcher/launcher_meetings_0.91e3b74a6a85c2b198571b5cc49e1414.png',
    status: 'active'
  },
  {
    name: 'Discord',
    image: 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png',
    status: 'active'
  },
  {
    name: 'Zoom',
    image: 'https://st1.zoom.us/static/6.3.24909/image/new/ZoomLogo_112x112.png',
    status: 'active'
  },

  // CI/CD & DevOps
  {
    name: 'Jenkins',
    image: 'https://www.jenkins.io/images/logos/jenkins/jenkins.png',
    status: 'active'
  },
  {
    name: 'CircleCI',
    image: 'https://assets.website-files.com/5f10ed4c0ebf7221fb5661a5/5f2af2b3f003d45db5b8ab6e_logo-circleci.svg',
    status: 'active'
  },
  {
    name: 'Travis CI',
    image: 'https://travis-ci.com/images/logos/TravisCI-Mascot-pride.png',
    status: 'active'
  },
  {
    name: 'GitHub Actions',
    image: 'https://github.githubassets.com/images/modules/site/features/actions-icon-actions.svg',
    status: 'active'
  },

  // Monitoring & Analytics
  {
    name: 'Google Analytics',
    image: 'https://www.google.com/analytics/static/img/1x/analytics_logo_color.png',
    status: 'active'
  },
  {
    name: 'Datadog',
    image: 'https://www.datadoghq.com/img/dd_logo_v_rgb.png',
    status: 'active'
  },
  {
    name: 'New Relic',
    image: 'https://newrelic.com/static-assets/images/icons/avatar-newrelic.png',
    status: 'active'
  },
  {
    name: 'Sentry',
    image: 'https://sentry-brand.storage.googleapis.com/sentry-logo-black.png',
    status: 'active'
  },

  // Payment Gateways
  {
    name: 'Stripe',
    image: 'https://stripe.com/img/v3/home/twitter.png',
    status: 'active'
  },
  {
    name: 'PayPal',
    image: 'https://www.paypalobjects.com/webstatic/mktg/logo-center/PP_Acceptance_Marks_for_LogoCenter_266x142.png',
    status: 'active'
  },
  {
    name: 'Square',
    image: 'https://images.squarespace-cdn.com/content/v1/5e51c5eb089fb73ab1b5b918/1582587396349-7W8ZMJ5MJ9HS0CZYZ1JG/square-logo.png',
    status: 'active'
  },

  // Email Services
  {
    name: 'SendGrid',
    image: 'https://sendgrid.com/wp-content/themes/sgdotcom/pages/resource/brand/2016/SendGrid-Logomark.png',
    status: 'active'
  },
  {
    name: 'Mailchimp',
    image: 'https://mailchimp.com/release/plums/cxp/images/apple-touch-icon-192.ce8f3e6d.png',
    status: 'active'
  },
  {
    name: 'Twilio',
    image: 'https://www.twilio.com/content/dam/twilio-com/global/en/blog/2019/twilio-logo-red.png',
    status: 'active'
  },

  // CRM & Marketing
  {
    name: 'Salesforce',
    image: 'https://c1.sfdcstatic.com/content/dam/web/en_us/www/images/nav/salesforce-cloud.png',
    status: 'active'
  },
  {
    name: 'HubSpot',
    image: 'https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inversed-Favicon.png',
    status: 'active'
  },
  {
    name: 'Zapier',
    image: 'https://cdn.zapier.com/storage/photos/9ec65c79de8ae54080c98e5e0063e4fd.png',
    status: 'active'
  },

  // Project Management
  {
    name: 'Jira',
    image: 'https://wac-cdn.atlassian.com/dam/jcr:8f7be6ec-b1bb-4e73-9ba8-c1ebf75bb2b1/jira-logo-blue.png',
    status: 'active'
  },
  {
    name: 'Trello',
    image: 'https://d2k1ftgv7pobq7.cloudfront.net/meta/c/p/res/images/trello-meta-logo.png',
    status: 'active'
  },
  {
    name: 'Asana',
    image: 'https://d3ki9tyy5l5ruj.cloudfront.net/obj/2a4add50d59266b61de45b37cd06bb4dad8ff228/asana-logo.svg',
    status: 'active'
  },
  {
    name: 'Linear',
    image: 'https://cdn.sanity.io/images/ornj730p/production/f7bb82c3b4b0e8a42abef0b5067e3a8e78b6b88b-512x512.png',
    status: 'active'
  },

  // Content Management
  {
    name: 'WordPress',
    image: 'https://s.w.org/style/images/about/WordPress-logotype-simplified.png',
    status: 'active'
  },
  {
    name: 'Contentful',
    image: 'https://images.contentful.com/alneenqid6w5/7ceeda6d-3988-4526-9cab-8c55995a90b3/b2e68b8a5de04d5aa9562a23ac59e3e4/contentful-logo-square.png',
    status: 'active'
  },
  {
    name: 'Strapi',
    image: 'https://strapi.io/assets/images/logos/strapi-logo-light.svg',
    status: 'active'
  },

  // Design & Media
  {
    name: 'Figma',
    image: 'https://static.figma.com/app/icon/1/favicon.png',
    status: 'active'
  },
  {
    name: 'Adobe Creative Cloud',
    image: 'https://www.adobe.com/content/dam/shared/images/product-icons/svg/creative-cloud.svg',
    status: 'active'
  },
  {
    name: 'Canva',
    image: 'https://www.canva.com/img/logos/canva-logos_2018_portrait_black.png',
    status: 'active'
  },

  // Social Media
  {
    name: 'Facebook',
    image: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg',
    status: 'active'
  },
  {
    name: 'Twitter',
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg',
    status: 'active'
  },
  {
    name: 'LinkedIn',
    image: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png',
    status: 'active'
  },
  {
    name: 'Instagram',
    image: 'https://static.cdninstagram.com/rsrc.php/v3/yt/r/30PrGfR3xhB.png',
    status: 'active'
  },

  // Some inactive/legacy integrations
  {
    name: 'Internet Explorer',
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Internet_Explorer_10%2B11_logo.svg',
    status: 'inactive'
  },
  {
    name: 'Flash Player',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Adobe_Flash_Player_v11_icon.png',
    status: 'inactive'
  },
  {
    name: 'Google Plus',
    image: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Google%2B_Logo.svg',
    status: 'inactive'
  }
];

/**
 * Seed integrations data
 */
const seedIntegrations = async (adminUserId) => {
  try {
    console.log('🌱 Starting integration seeding...');

    // Clear existing integrations
    await Integration.deleteMany({});
    console.log('📝 Cleared existing integrations');

    // Create integrations with proper user reference
    const integrationsToCreate = integrationData.map(integration => ({
      ...integration,
      createdBy: adminUserId
    }));

    const createdIntegrations = [];
    for (const integrationData of integrationsToCreate) {
      const integration = new Integration(integrationData);
      await integration.save();
      createdIntegrations.push(integration);
    }

    console.log(`✅ Successfully seeded ${createdIntegrations.length} integrations`);
    console.log('📊 Integrations breakdown:');
    console.log(`   - Active: ${createdIntegrations.filter(i => i.status === 'active').length}`);
    console.log(`   - Inactive: ${createdIntegrations.filter(i => i.status === 'inactive').length}`);
    console.log(`   - With Images: ${createdIntegrations.filter(i => i.image).length}`);

    return createdIntegrations;
  } catch (error) {
    console.error('❌ Error seeding integrations:', error);
    throw error;
  }
};

module.exports = {
  seedIntegrations,
  integrationData
}; 