const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { auth } = require('../middleware');

/**
 * @openapi
 * components:
 *   schemas:
 *     Favorite:
 *       type: object
 *       required:
 *         - userId
 *         - productId
 *         - listName
 *       properties:
 *         _id:
 *           type: string
 *           format: objectId
 *         userId:
 *           type: string
 *           format: objectId
 *         productId:
 *           type: string
 *           format: objectId
 *         listName:
 *           type: string
 *           maxLength: 100
 *         isDefault:
 *           type: boolean
 *         notes:
 *           type: string
 *           maxLength: 500
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @openapi
 * /api/favorites:
 *   post:
 *     summary: Add product to favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *                 format: objectId
 *               listName:
 *                 type: string
 *                 default: "Favorite List"
 *     responses:
 *       201:
 *         description: Product added to favorites successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       409:
 *         description: Product already in favorites
 */
router.post('/', auth, favoriteController.addToFavorites);

/**
 * @openapi
 * /api/favorites/{productId}:
 *   delete:
 *     summary: Remove product from favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *       - in: query
 *         name: listName
 *         schema:
 *           type: string
 *         description: Specific list name (optional)
 *     responses:
 *       200:
 *         description: Product removed from favorites successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Favorite not found
 */
router.delete('/:productId', auth, favoriteController.removeFromFavorites);

/**
 * @openapi
 * /api/favorites/lists:
 *   get:
 *     summary: Get user's favorite lists
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in list names and product names
 *     responses:
 *       200:
 *         description: Favorite lists retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/lists', auth, favoriteController.getUserFavoriteLists);

/**
 * @openapi
 * /api/favorites/lists:
 *   post:
 *     summary: Create a new favorite list
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - listName
 *             properties:
 *               listName:
 *                 type: string
 *                 maxLength: 100
 *     responses:
 *       201:
 *         description: Favorite list created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: List already exists
 */
router.post('/lists', auth, favoriteController.createFavoriteList);

/**
 * @openapi
 * /api/favorites/lists/{listName}/products:
 *   get:
 *     summary: Get products in a specific favorite list
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listName
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, avgRating]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Favorite list products retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: List not found
 */
router.get('/lists/:listName/products', auth, favoriteController.getFavoriteListProducts);

/**
 * @openapi
 * /api/favorites/lists/{listName}:
 *   put:
 *     summary: Rename a favorite list
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listName
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newListName
 *             properties:
 *               newListName:
 *                 type: string
 *                 maxLength: 100
 *     responses:
 *       200:
 *         description: Favorite list renamed successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: List not found
 *       409:
 *         description: New list name already exists
 */
router.put('/lists/:listName', auth, favoriteController.renameFavoriteList);

/**
 * @openapi
 * /api/favorites/lists/{listName}:
 *   delete:
 *     summary: Delete a favorite list
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Favorite list deleted successfully
 *       400:
 *         description: Cannot delete default list
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: List not found
 */
router.delete('/lists/:listName', auth, favoriteController.deleteFavoriteList);

/**
 * @openapi
 * /api/favorites/check/{productId}:
 *   get:
 *     summary: Check if product is in user's favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *     responses:
 *       200:
 *         description: Favorite status retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/check/:productId', auth, favoriteController.checkIfFavorite);

module.exports = router; 