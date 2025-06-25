const mongoose = require('mongoose');
const slugify = require('slugify');
const { Industry, User } = require('../models');
const ApiError = require('../utils/apiError');

const createIndustry = async (industryData, userId) => {
  try {
    const existingIndustry = await Industry.findOne({ name: industryData.name });
    if (existingIndustry) {
      throw new ApiError('Industry name already exists', 'DUPLICATE_INDUSTRY', 400);
    }

    const industry = new Industry({
      ...industryData,
      createdBy: userId
    });

    await industry.save();
    await industry.populate('createdBy', 'firstName lastName companyName email');
    
    return industry;
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      throw new ApiError(messages[0], 'VALIDATION_ERROR', 400, { details: error.errors });
    }
    throw error;
  }
};

const getAllIndustries = async (options) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status = '',
    category = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const query = {};
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }
  if (status) {
    query.status = status;
  }
  if (category) {
    query.category = category;
  }

  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [industries, total] = await Promise.all([
    Industry.find(query)
      .populate('createdBy', 'firstName lastName companyName email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Industry.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    industries,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage
    }
  };
};

const getActiveIndustries = async (options) => {
  return await getAllIndustries({ ...options, status: 'active' });
};

const getIndustriesByCategory = async (category, options) => {
  return await getAllIndustries({ ...options, category });
};

const getIndustryById = async (industryId) => {
  if (!mongoose.Types.ObjectId.isValid(industryId)) {
    throw new ApiError('Invalid industry ID', 'INVALID_ID', 400);
  }

  const industry = await Industry.findById(industryId)
    .populate('createdBy', 'firstName lastName companyName email');

  if (!industry) {
    throw new ApiError('Industry not found', 'INDUSTRY_NOT_FOUND', 404);
  }

  return industry;
};

const getIndustryBySlug = async (slug) => {
  const industry = await Industry.findOne({ slug })
    .populate('createdBy', 'firstName lastName companyName email');

  if (!industry) {
    throw new ApiError('Industry not found', 'INDUSTRY_NOT_FOUND', 404);
  }

  return industry;
};

const updateIndustry = async (industryId, updateData, userId) => {
  const industry = await Industry.findById(industryId);
  
  if (!industry) {
    throw new ApiError('Industry not found', 'INDUSTRY_NOT_FOUND', 404);
  }

  try {
    if (updateData.name && updateData.name !== industry.name) {
      let newSlug = slugify(updateData.name, {
        lower: true,
        strict: true,
        remove: /[*+~.()'\"!:@]/g
      });
      
      let uniqueSlug = newSlug;
      let counter = 1;
      while (await Industry.findOne({ slug: uniqueSlug, _id: { $ne: industryId } })) {
        uniqueSlug = `${newSlug}-${counter}`;
        counter++;
      }
      updateData.slug = uniqueSlug;
    }

    Object.assign(industry, updateData);
    await industry.save();
    await industry.populate('createdBy', 'firstName lastName companyName email');
    
    return industry;
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      throw new ApiError(messages[0], 'VALIDATION_ERROR', 400, { details: error.errors });
    }
    if (error.code === 11000) {
      throw new ApiError('Industry name already exists', 'DUPLICATE_INDUSTRY', 400);
    }
    throw error;
  }
};

const deleteIndustry = async (industryId, userId) => {
  const industry = await Industry.findById(industryId);
  
  if (!industry) {
    throw new ApiError('Industry not found', 'INDUSTRY_NOT_FOUND', 404);
  }

  await Industry.findByIdAndDelete(industryId);
  
  return { message: 'Industry deleted successfully' };
};

const toggleIndustryStatus = async (industryId, userId) => {
  const industry = await Industry.findById(industryId);
  
  if (!industry) {
    throw new ApiError('Industry not found', 'INDUSTRY_NOT_FOUND', 404);
  }

  industry.status = industry.status === 'active' ? 'inactive' : 'active';
  await industry.save();
  await industry.populate('createdBy', 'firstName lastName companyName email');
  
  return industry;
};

module.exports = {
  createIndustry,
  getAllIndustries,
  getActiveIndustries,
  getIndustriesByCategory,
  getIndustryById,
  getIndustryBySlug,
  updateIndustry,
  deleteIndustry,
  toggleIndustryStatus
};
