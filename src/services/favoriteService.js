const mongoose = require('mongoose');
const Favorite = require('../models/Favorite');
const Product = require('../models/Product');
const ApiError = require('../utils/apiError');

/**
 * Add product to favorites list
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @param {string} listName - List name (default: 'Favorite List')
 * @returns {Object} Created favorite
 */
const addToFavorites = async (userId, productId, listName = 'Favorite List') => {
  // Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError('Product not found', 'PRODUCT_NOT_FOUND', 404);
  }

  // Check if already in favorites
  const existingFavorite = await Favorite.findOne({
    userId,
    productId,
    listName
  });

  if (existingFavorite) {
    throw new ApiError('Product already in this list', 'ALREADY_FAVORITED', 409);
  }

  // Create favorite
  const favorite = new Favorite({
    userId,
    productId,
    listName,
    isDefault: listName === 'Favorite List'
  });

  await favorite.save();

  // Populate product details
  await favorite.populate('productId', 'name slug logoUrl avgRating totalReviews');

  return favorite;
};

/**
 * Remove product from favorites
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @param {string} listName - List name (optional)
 * @returns {Object} Result
 */
const removeFromFavorites = async (userId, productId, listName = null) => {
  const filter = { userId, productId };
  if (listName) {
    filter.listName = listName;
  }

  const favorite = await Favorite.findOneAndDelete(filter);
  
  if (!favorite) {
    throw new ApiError('Favorite not found', 'FAVORITE_NOT_FOUND', 404);
  }

  return { message: 'Product removed from favorites' };
};

/**
 * Get user's favorite lists with products
 * @param {string} userId - User ID
 * @param {object} options - Query options
 * @returns {Object} Favorite lists with products
 */
const getUserFavoriteLists = async (userId, options = {}) => {
  const { page = 1, limit = 10, search = '' } = options;

  // Build aggregation pipeline
  const pipeline = [
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $match: {
        'product.status': { $in: ['published', 'approved'] },
        'product.isActive': 'active',
        ...(search && {
          $or: [
            { 'product.name': { $regex: search, $options: 'i' } },
            { listName: { $regex: search, $options: 'i' } }
          ]
        })
      }
    },
    {
      $group: {
        _id: '$listName',
        products: {
          $push: {
            favoriteId: '$_id',
            productId: '$product._id',
            name: '$product.name',
            slug: '$product.slug',
            logoUrl: '$product.logoUrl',
            avgRating: '$product.avgRating',
            totalReviews: '$product.totalReviews',
            addedAt: '$createdAt',
            notes: '$notes'
          }
        },
        totalProducts: { $sum: 1 },
        lastUpdated: { $max: '$updatedAt' },
        isDefault: { $first: '$isDefault' }
      }
    },
    {
      $project: {
        listName: '$_id',
        products: { $slice: ['$products', (page - 1) * limit, limit] },
        totalProducts: 1,
        lastUpdated: 1,
        isDefault: 1,
        _id: 0
      }
    },
    { $sort: { isDefault: -1, lastUpdated: -1 } }
  ];

  const lists = await Favorite.aggregate(pipeline);

  return {
    lists,
    totalLists: lists.length,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(lists.length / limit),
      totalItems: lists.reduce((sum, list) => sum + list.totalProducts, 0),
      itemsPerPage: limit
    }
  };
};

/**
 * Get products in a specific favorite list
 * @param {string} userId - User ID
 * @param {string} listName - List name
 * @param {object} options - Query options
 * @returns {Object} Products in the list
 */
const getFavoriteListProducts = async (userId, listName, options = {}) => {
  const { page = 1, limit = 12, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  const skip = (page - 1) * limit;

  const sortOptions = {};
  sortOptions[sortBy === 'createdAt' ? 'createdAt' : `product.${sortBy}`] = sortOrder === 'desc' ? -1 : 1;

  const [favorites, total] = await Promise.all([
    Favorite.find({ userId, listName })
      .populate({
        path: 'productId',
        select: 'name slug logoUrl avgRating totalReviews description',
        match: { status: { $in: ['published', 'approved'] }, isActive: 'active' }
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    Favorite.countDocuments({ userId, listName })
  ]);

  // Filter out favorites with deleted products
  const validFavorites = favorites.filter(fav => fav.productId);

  return {
    products: validFavorites.map(fav => ({
      favoriteId: fav._id,
      ...fav.productId.toObject(),
      addedAt: fav.createdAt,
      notes: fav.notes
    })),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
};

/**
 * Create a new favorite list
 * @param {string} userId - User ID
 * @param {string} listName - List name
 * @returns {Object} Created list info
 */
const createFavoriteList = async (userId, listName) => {
  // Check if list already exists
  const existingList = await Favorite.findOne({ userId, listName });
  if (existingList) {
    throw new ApiError('List with this name already exists', 'LIST_EXISTS', 409);
  }

  return { listName, message: 'List created successfully' };
};

/**
 * Rename a favorite list
 * @param {string} userId - User ID
 * @param {string} oldListName - Current list name
 * @param {string} newListName - New list name
 * @returns {Object} Update result
 */
const renameFavoriteList = async (userId, oldListName, newListName) => {
  const result = await Favorite.updateMany(
    { userId, listName: oldListName },
    { listName: newListName }
  );

  if (result.matchedCount === 0) {
    throw new ApiError('List not found', 'LIST_NOT_FOUND', 404);
  }

  return { message: 'List renamed successfully', updatedCount: result.modifiedCount };
};

/**
 * Delete a favorite list
 * @param {string} userId - User ID
 * @param {string} listName - List name
 * @returns {Object} Delete result
 */
const deleteFavoriteList = async (userId, listName) => {
  if (listName === 'Favorite List') {
    throw new ApiError('Cannot delete default list', 'CANNOT_DELETE_DEFAULT', 400);
  }

  const result = await Favorite.deleteMany({ userId, listName });

  if (result.deletedCount === 0) {
    throw new ApiError('List not found', 'LIST_NOT_FOUND', 404);
  }

  return { message: 'List deleted successfully', deletedCount: result.deletedCount };
};

/**
 * Check if product is in user's favorites
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @returns {Object} Favorite status
 */
const checkIfFavorite = async (userId, productId) => {
  const favorites = await Favorite.find({ userId, productId }).select('listName');
  
  return {
    isFavorite: favorites.length > 0,
    lists: favorites.map(fav => fav.listName)
  };
};

module.exports = {
  addToFavorites,
  removeFromFavorites,
  getUserFavoriteLists,
  getFavoriteListProducts,
  createFavoriteList,
  renameFavoriteList,
  deleteFavoriteList,
  checkIfFavorite
}; 