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
      'mission', 'missionSupport', 'values', 'team', 'contact', 'trustedTech', 'reachBuyers'
    ];
    
    if (!validSections.includes(normalizedSectionName)) {
      throw new ApiError('Invalid section name', 'INVALID_SECTION', 400);
    }
    
    // Process categories section - keep IDs but populate product details
    if (normalizedSectionName === 'categories' && sectionData.categories) {
      const Product = require('../models/Product');
      
      // Process each category
      for (let category of sectionData.categories) {
        // Keep the software ID as is (don't convert to name)
        // The frontend will handle displaying the name
        
        // Process products - convert IDs to objects with id, name, logo
        if (category.products && Array.isArray(category.products)) {
          const processedProducts = [];
          for (let productItem of category.products) {
            // If it's just an ID string, fetch the product details
            if (typeof productItem === 'string') {
              const product = await Product.findById(productItem).select('name logoUrl').lean();
              if (product) {
                processedProducts.push({
                  id: productItem,
                  name: product.name,
                  logo: product.logoUrl || ''
                });
              }
            } else if (productItem && productItem.id) {
              // It's already an object, keep it
              processedProducts.push(productItem);
            }
          }
          category.products = processedProducts;
        }
      }
    }
    
    // Process popular section - keep IDs but populate product details
    if (normalizedSectionName === 'popular' && sectionData.solutions) {
      const Product = require('../models/Product');
      
      // Process each solution
      for (let solution of sectionData.solutions) {
        // Process types - convert product IDs to objects with id and name
        if (solution.types && Array.isArray(solution.types)) {
          const processedTypes = [];
          for (let productId of solution.types) {
            if (typeof productId === 'string') {
              const product = await Product.findById(productId).select('name').lean();
              if (product) {
                processedTypes.push({
                  id: productId,
                  name: product.name
                });
              }
            }
          }
          solution.types = processedTypes;
        }
        
        // Keep the prefixed value as is (e.g., "software_id" or "solution_id")
        // The frontend will handle displaying the name
      }
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