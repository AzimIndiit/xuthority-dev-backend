const favoriteService = require('../services/favoriteService');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('express-async-handler');

/**
 * Add product to favorites
 * @route POST /api/favorites
 * @access Private
 */
const addToFavorites = asyncHandler(async (req, res) => {
  const { productId, listName = 'Favorite List' } = req.body;
  const userId = req.user._id;

  const favorite = await favoriteService.addToFavorites(userId, productId, listName);
  
  res.status(201).json(
    ApiResponse.success(favorite, 'Product added to favorites successfully')
  );
});

/**
 * Remove product from favorites
 * @route DELETE /api/favorites/:productId
 * @access Private
 */
const removeFromFavorites = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { listName } = req.query;
  const userId = req.user._id;

  const result = await favoriteService.removeFromFavorites(userId, productId, listName);
  
  res.json(
    ApiResponse.success(result, 'Product removed from favorites successfully')
  );
});

/**
 * Get user's favorite lists
 * @route GET /api/favorites/lists
 * @access Private
 */
const getUserFavoriteLists = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10, search = '' } = req.query;

  const result = await favoriteService.getUserFavoriteLists(userId, {
    page: parseInt(page),
    limit: parseInt(limit),
    search
  });
  
  res.json(
    ApiResponse.success(result, 'Favorite lists retrieved successfully')
  );
});

/**
 * Get products in a specific favorite list
 * @route GET /api/favorites/lists/:listName/products
 * @access Private
 */
const getFavoriteListProducts = asyncHandler(async (req, res) => {
  const { listName } = req.params;
  const userId = req.user._id;
  const { page = 1, limit = 12, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const result = await favoriteService.getFavoriteListProducts(
    userId, 
    decodeURIComponent(listName), 
    {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    }
  );
  
  res.json(
    ApiResponse.success(result, 'Favorite list products retrieved successfully')
  );
});

/**
 * Create a new favorite list
 * @route POST /api/favorites/lists
 * @access Private
 */
const createFavoriteList = asyncHandler(async (req, res) => {
  const { listName } = req.body;
  const userId = req.user._id;

  if (!listName || listName.trim() === '') {
    throw new ApiError('List name is required', 'LIST_NAME_REQUIRED', 400);
  }

  const result = await favoriteService.createFavoriteList(userId, listName.trim());
  
  res.status(201).json(
    ApiResponse.success(result, 'Favorite list created successfully')
  );
});

/**
 * Rename a favorite list
 * @route PUT /api/favorites/lists/:listName
 * @access Private
 */
const renameFavoriteList = asyncHandler(async (req, res) => {
  const { listName } = req.params;
  const { newListName } = req.body;
  const userId = req.user._id;

  if (!newListName || newListName.trim() === '') {
    throw new ApiError('New list name is required', 'NEW_LIST_NAME_REQUIRED', 400);
  }

  const result = await favoriteService.renameFavoriteList(
    userId,
    decodeURIComponent(listName),
    newListName.trim()
  );
  
  res.json(
    ApiResponse.success(result, 'Favorite list renamed successfully')
  );
});

/**
 * Delete a favorite list
 * @route DELETE /api/favorites/lists/:listName
 * @access Private
 */
const deleteFavoriteList = asyncHandler(async (req, res) => {
  const { listName } = req.params;
  const userId = req.user._id;

  const result = await favoriteService.deleteFavoriteList(
    userId,
    decodeURIComponent(listName)
  );
  
  res.json(
    ApiResponse.success(result, 'Favorite list deleted successfully')
  );
});

/**
 * Check if product is in user's favorites
 * @route GET /api/favorites/check/:productId
 * @access Private
 */
const checkIfFavorite = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  const result = await favoriteService.checkIfFavorite(userId, productId);
  
  res.json(
    ApiResponse.success(result, 'Favorite status retrieved successfully')
  );
});

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