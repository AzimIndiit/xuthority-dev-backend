const LandingPage = require('../models/LandingPage');
const ApiError = require('../utils/apiError');
const { success } = require('../utils/apiResponse');
const logger = require('../config/logger');
const mongoose = require('mongoose');

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
    let landingPage = await LandingPage.getOrCreate(pageType);
    
    // Populate categories section if it exists
    if (landingPage.sections && landingPage.sections.categories) {
      landingPage = await landingPage.populate([
        {
          path: 'sections.categories.categories.name',
          select: 'name slug'
        },
        {
          path: 'sections.categories.categories.products',
          select: 'name slug logo logoUrl'
        }
      ]);
    }
    
    // Populate popular section if it exists
    if (landingPage.sections && landingPage.sections.popular) {
      landingPage = await landingPage.populate([
        {
          path: 'sections.popular.solutions.software',
          select: 'name slug'
        },
        {
          path: 'sections.popular.solutions.solution',
          select: 'name slug'
        },
        {
          path: 'sections.popular.solutions.products',
          select: 'name slug logo logoUrl'
        }
      ]);
    }
    
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
    
    let landingPage = await LandingPage.getOrCreate(pageType);
    
    if (!landingPage.sections || !landingPage.sections[normalizedSectionName]) {
      return res.json(
        success({}, 'Section data retrieved successfully')
      );
    }
    
    // Populate data based on section name
    if (normalizedSectionName === 'categories' && landingPage.sections.categories) {
      landingPage = await landingPage.populate([
        {
          path: 'sections.categories.categories.name',
          select: 'name slug'
        },
        {
          path: 'sections.categories.categories.products',
          select: 'name slug logo logoUrl'
        }
      ]);
    } else if (normalizedSectionName === 'popular' && landingPage.sections.popular) {
      landingPage = await landingPage.populate([
        {
          path: 'sections.popular.solutions.software',
          select: 'name slug'
        },
        {
          path: 'sections.popular.solutions.solution',
          select: 'name slug'
        },
        {
          path: 'sections.popular.solutions.products',
          select: 'name slug logo logoUrl'
        }
      ]);
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
    
    // Process categories section - handle new schema with ObjectId references
    if (normalizedSectionName === 'categories' && sectionData.categories) {
      const Product = require('../models/Product');
      const Software = require('../models/Software');
      
      // Process each category
      for (let category of sectionData.categories) {
        // Validate software ID (name field)
        if (category.name && typeof category.name === 'string') {
          // Ensure it's a valid ObjectId
          if (!mongoose.Types.ObjectId.isValid(category.name)) {
            throw new ApiError('Invalid software ID', 'INVALID_SOFTWARE_ID', 400);
          }
          
          // Verify software exists
          const software = await Software.findById(category.name).lean();
          if (!software) {
            throw new ApiError('Software not found', 'SOFTWARE_NOT_FOUND', 400);
          }
        }
        
        // Process products array - validate each product ID
        if (category.products && Array.isArray(category.products)) {
          const processedProducts = [];
          
          for (let productId of category.products) {
            // Handle if product is an object with _id
            if (typeof productId === 'object' && productId._id) {
              productId = productId._id || productId.id;
            }
            
            if (productId && typeof productId === 'string') {
              // Validate product ID
              if (!mongoose.Types.ObjectId.isValid(productId)) {
                throw new ApiError('Invalid product ID', 'INVALID_PRODUCT_ID', 400);
              }
              
              // Verify product exists
              const product = await Product.findById(productId).lean();
              if (!product) {
                throw new ApiError('Product not found', 'PRODUCT_NOT_FOUND', 400);
              }
              
              // Add to processed products array
              processedProducts.push(productId);
            }
          }
          
          // Update category with processed products array
          category.products = processedProducts;
        }
      }
    }
    
    // Process popular section - handle new schema with ObjectId references
    if (normalizedSectionName === 'popular' && sectionData.solutions) {
      const Product = require('../models/Product');
      const Software = require('../models/Software');
      const Solution = require('../models/Solution');
      
      // Process each solution
      for (let solution of sectionData.solutions) {
        // Validate software or solution reference
        if (solution.software) {
          if (!mongoose.Types.ObjectId.isValid(solution.software)) {
            throw new ApiError('Invalid software ID', 'INVALID_SOFTWARE_ID', 400);
          }
          const software = await Software.findById(solution.software).lean();
          if (!software) {
            throw new ApiError('Software not found', 'SOFTWARE_NOT_FOUND', 400);
          }
        } else if (solution.solution) {
          if (!mongoose.Types.ObjectId.isValid(solution.solution)) {
            throw new ApiError('Invalid solution ID', 'INVALID_SOLUTION_ID', 400);
          }
          const solutionDoc = await Solution.findById(solution.solution).lean();
          if (!solutionDoc) {
            throw new ApiError('Solution not found', 'SOLUTION_NOT_FOUND', 400);
          }
        }
        
        // Process products array
        if (solution.products && Array.isArray(solution.products)) {
          const processedProducts = [];
          for (let productId of solution.products) {
            if (typeof productId === 'string') {
              if (!mongoose.Types.ObjectId.isValid(productId)) {
                throw new ApiError('Invalid product ID', 'INVALID_PRODUCT_ID', 400);
              }
              const product = await Product.findById(productId).lean();
              if (!product) {
                throw new ApiError('Product not found', 'PRODUCT_NOT_FOUND', 400);
              }
              processedProducts.push(productId);
            }
          }
          solution.products = processedProducts;
        }
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