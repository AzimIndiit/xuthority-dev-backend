const authService = require('./authService');
const userService = require('./userService');
const fileService = require('./fileService');
const emailService = require('./emailService');
const cacheService = require('./cacheService');
const auditService = require('./auditService');
const notificationService = require('./notificationService');
const followService = require('./followService');
const productService = require('./productService');
const softwareService = require('./softwareService');
const solutionService = require('./solutionService');
const languageService = require('./languageService');
const marketSegmentService = require('./marketSegmentService');
const integrationService = require('./integrationService');
const industryService = require('./industryService');
const userRoleService = require('./userRoleService');

const resourceCategoryService = require('./resourceCategoryService');
const blogService = require('./blogService');
const productReviewService = require('./productReviewService');
const reviewReplyService = require('./reviewReplyService');
const disputeService = require('./disputeService');

module.exports = {
  authService,
  userService,
  fileService,
  emailService,
  cacheService,
  auditService,
  notificationService,
  followService,
  productService,
  softwareService,
  solutionService,
  languageService,
  marketSegmentService,
  integrationService,
  industryService,
  userRoleService,
  resourceCategoryService,
  blogService,
  productReviewService,
  reviewReplyService,
  disputeService,
  searchService: require('./searchService')
};
