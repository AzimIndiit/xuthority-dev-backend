const mongoose = require('mongoose');
const slugify = require('slugify');
const { Integration, User } = require('../models');
const ApiError = require('../utils/apiError');

const createIntegration = async (integrationData, userId) => {
  try {
    const existingIntegration = await Integration.findOne({ name: integrationData.name });
    if (existingIntegration) {
      throw new ApiError('Integration name already exists', 'DUPLICATE_INTEGRATION', 400);
    }

    const integration = new Integration({
      ...integrationData,
      createdBy: userId
    });

    await integration.save();
    await integration.populate('createdBy', 'firstName lastName companyName email');
    
    return integration;
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      throw new ApiError(messages[0], 'VALIDATION_ERROR', 400, { details: error.errors });
    }
    throw error;
  }
};

const getAllIntegrations = async (options) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status = '',
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

  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [integrations, total] = await Promise.all([
    Integration.find(query)
      .populate('createdBy', 'firstName lastName companyName email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Integration.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    integrations,
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

const getActiveIntegrations = async (options) => {
  return await getAllIntegrations({ ...options, status: 'active' });
};

const getIntegrationById = async (integrationId) => {
  if (!mongoose.Types.ObjectId.isValid(integrationId)) {
    throw new ApiError('Invalid integration ID', 'INVALID_ID', 400);
  }

  const integration = await Integration.findById(integrationId)
    .populate('createdBy', 'firstName lastName companyName email');

  if (!integration) {
    throw new ApiError('Integration not found', 'INTEGRATION_NOT_FOUND', 404);
  }

  return integration;
};

const getIntegrationBySlug = async (slug) => {
  const integration = await Integration.findOne({ slug })
    .populate('createdBy', 'firstName lastName companyName email');

  if (!integration) {
    throw new ApiError('Integration not found', 'INTEGRATION_NOT_FOUND', 404);
  }

  return integration;
};

const updateIntegration = async (integrationId, updateData, userId) => {
  const integration = await Integration.findById(integrationId);
  
  if (!integration) {
    throw new ApiError('Integration not found', 'INTEGRATION_NOT_FOUND', 404);
  }

  try {
    if (updateData.name && updateData.name !== integration.name) {
      let newSlug = slugify(updateData.name, {
        lower: true,
        strict: true,
        remove: /[*+~.()'\"!:@]/g
      });
      
      let uniqueSlug = newSlug;
      let counter = 1;
      while (await Integration.findOne({ slug: uniqueSlug, _id: { $ne: integrationId } })) {
        uniqueSlug = `${newSlug}-${counter}`;
        counter++;
      }
      updateData.slug = uniqueSlug;
    }

    Object.assign(integration, updateData);
    await integration.save();
    await integration.populate('createdBy', 'firstName lastName companyName email');
    
    return integration;
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      throw new ApiError(messages[0], 'VALIDATION_ERROR', 400, { details: error.errors });
    }
    if (error.code === 11000) {
      throw new ApiError('Integration name already exists', 'DUPLICATE_INTEGRATION', 400);
    }
    throw error;
  }
};

const deleteIntegration = async (integrationId, userId) => {
  const integration = await Integration.findById(integrationId);
  
  if (!integration) {
    throw new ApiError('Integration not found', 'INTEGRATION_NOT_FOUND', 404);
  }

  await Integration.findByIdAndDelete(integrationId);
  
  return { message: 'Integration deleted successfully' };
};

const toggleIntegrationStatus = async (integrationId, userId) => {
  const integration = await Integration.findById(integrationId);
  
  if (!integration) {
    throw new ApiError('Integration not found', 'INTEGRATION_NOT_FOUND', 404);
  }

  integration.status = integration.status === 'active' ? 'inactive' : 'active';
  await integration.save();
  await integration.populate('createdBy', 'firstName lastName companyName email');
  
  return integration;
};

module.exports = {
  createIntegration,
  getAllIntegrations,
  getActiveIntegrations,
  getIntegrationById,
  getIntegrationBySlug,
  updateIntegration,
  deleteIntegration,
  toggleIntegrationStatus
};
