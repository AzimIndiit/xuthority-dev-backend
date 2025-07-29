const LandingPage = require('../models/LandingPage');
const ApiError = require('../utils/apiError');
const { success } = require('../utils/apiResponse');
const logger = require('../config/logger');

/**
 * Get landing page data by type
 */
exports.getLandingPage = async (req, res, next) => {
  try {
    const { pageType } = req.params;
    
    // Validate page type
    if (!['user', 'vendor', 'about'].includes(pageType)) {
      throw new ApiError('Invalid page type', 'INVALID_PAGE_TYPE', 400);
    }
    
    // Get or create the landing page
    const landingPage = await LandingPage.getOrCreate(pageType);
    
    return res.json(
      success(landingPage, 'Landing page retrieved successfully')
    );
  } catch (error) {
    logger.error('Error getting landing page:', error);
    next(error);
  }
};

/**
 * Get specific section data
 */
exports.getSection = async (req, res, next) => {
  try {
    const { pageType, sectionName } = req.params;
    
    // Validate page type
    if (!['user', 'vendor', 'about'].includes(pageType)) {
      throw new ApiError('Invalid page type', 'INVALID_PAGE_TYPE', 400);
    }
    
    // Convert hyphenated section names to camelCase for consistency
    const sectionNameMap = {
      'review-cta': 'reviewCta',
      'vendor-cta': 'vendorCta',
      'trusted-tech': 'trustedTech',
      'reach-buyers': 'reachBuyers'
    };
    
    const normalizedSectionName = sectionNameMap[sectionName] || sectionName;
    
    const landingPage = await LandingPage.getOrCreate(pageType);
    
    if (!landingPage.sections || !landingPage.sections[normalizedSectionName]) {
      return res.json(
        success({}, 'Section data retrieved successfully')
      );
    }
    
    return res.json(
      success(landingPage.sections[normalizedSectionName], 'Section data retrieved successfully')
    );
  } catch (error) {
    logger.error('Error getting section:', error);
    next(error);
  }
};

/**
 * Update landing page section
 */
exports.updateSection = async (req, res, next) => {
  try {
    const { pageType, sectionName } = req.params;
    const sectionData = req.body;
    
    // Validate page type
    if (!['user', 'vendor', 'about'].includes(pageType)) {
      throw new ApiError('Invalid page type', 'INVALID_PAGE_TYPE', 400);
    }
    
    // Get or create the landing page
    let landingPage = await LandingPage.getOrCreate(pageType);
    
    // Update the specific section
    if (!landingPage.sections) {
      landingPage.sections = {};
    }
    
    // Convert hyphenated section names to camelCase for consistency
    const sectionNameMap = {
      'review-cta': 'reviewCta',
      'vendor-cta': 'vendorCta',
      'trusted-tech': 'trustedTech',
      'reach-buyers': 'reachBuyers'
    };
    
    const normalizedSectionName = sectionNameMap[sectionName] || sectionName;
    
    // Validate section name
    const validSections = [
      'hero', 'categories', 'reviewCta', 'insights', 'testimonials',
      'vendorCta', 'popular', 'features', 'pricing', 'cta',
      'mission', 'values', 'team', 'contact', 'trustedTech', 'reachBuyers'
    ];
    
    if (!validSections.includes(normalizedSectionName)) {
      throw new ApiError('Invalid section name', 'INVALID_SECTION', 400);
    }
    
    // Update section data
    landingPage.sections[normalizedSectionName] = sectionData;
    landingPage.updatedBy = req.user._id;
    landingPage.markModified(`sections.${normalizedSectionName}`);
    
    await landingPage.save();
    
    return res.json(
      success(landingPage, 'Section updated successfully')
    );
  } catch (error) {
    logger.error('Error updating section:', error);
    next(error);
  }
};

/**
 * Update entire landing page
 */
exports.updateLandingPage = async (req, res, next) => {
  try {
    const { pageType } = req.params;
    const { sections } = req.body;
    
    // Validate page type
    if (!['user', 'vendor', 'about'].includes(pageType)) {
      throw new ApiError('Invalid page type', 'INVALID_PAGE_TYPE', 400);
    }
    
    let landingPage = await LandingPage.getOrCreate(pageType);
    
    // Update all sections
    if (sections) {
      landingPage.sections = sections;
      landingPage.updatedBy = req.user._id;
      landingPage.markModified('sections');
    }
    
    await landingPage.save();
    
    return res.json(
      success(landingPage, 'Landing page updated successfully')
    );
  } catch (error) {
    logger.error('Error updating landing page:', error);
    next(error);
  }
};

/**
 * Reset landing page section to default
 */
exports.resetSection = async (req, res, next) => {
  try {
    const { pageType, sectionName } = req.params;
    
    // Validate page type
    if (!['user', 'vendor', 'about'].includes(pageType)) {
      throw new ApiError('Invalid page type', 'INVALID_PAGE_TYPE', 400);
    }
    
    // Convert hyphenated section names to camelCase for consistency
    const sectionNameMap = {
      'review-cta': 'reviewCta',
      'vendor-cta': 'vendorCta',
      'trusted-tech': 'trustedTech',
      'reach-buyers': 'reachBuyers'
    };
    
    const normalizedSectionName = sectionNameMap[sectionName] || sectionName;
    
    const landingPage = await LandingPage.getOrCreate(pageType);
    
    // Reset the specific section
    if (landingPage.sections && landingPage.sections[normalizedSectionName]) {
      landingPage.sections[normalizedSectionName] = {};
      landingPage.updatedBy = req.user._id;
      landingPage.markModified(`sections.${normalizedSectionName}`);
      await landingPage.save();
    }
    
    return res.json(
      success(landingPage, 'Section reset successfully')
    );
  } catch (error) {
    logger.error('Error resetting section:', error);
    next(error);
  }
};

/**
 * Get all landing pages summary
 */
exports.getAllLandingPages = async (req, res, next) => {
  try {
    const landingPages = await LandingPage.find({})
      .select('pageType updatedAt createdAt')
      .populate('updatedBy', 'name email')
      .sort({ pageType: 1 });
    
    const summary = landingPages.map(page => ({
      pageType: page.pageType,
      lastUpdated: page.updatedAt,
      updatedBy: page.updatedBy,
      sectionsCount: page.sections ? Object.keys(page.sections).filter(key => 
        page.sections[key] && Object.keys(page.sections[key]).length > 0
      ).length : 0
    }));
    
    return res.json(
      success(summary, 'Landing pages summary retrieved successfully')
    );
  } catch (error) {
    logger.error('Error getting landing pages summary:', error);
    next(error);
  }
};