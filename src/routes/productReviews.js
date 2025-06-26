const express = require('express');
const router = express.Router();
const productReviewController = require('../controllers/productReviewController');
const { auth, authorize, validate } = require('../middleware');
const { productReviewValidator } = require('../validators');

// Create a new review (authenticated users only)
router.post('/', 
  auth, 
  validate(productReviewValidator.create), 
  productReviewController.createProductReview
);

// Get all reviews with filtering and pagination (public)
router.get('/', 
  validate(productReviewValidator.list), 
  productReviewController.getAllProductReviews
);

// Get reviews for a specific product (public)
router.get('/product/:productId', 
  validate(productReviewValidator.listByProduct), 
  productReviewController.getProductReviews
);

// Get review statistics for a product (public)
router.get('/product/:productId/stats', 
  validate(productReviewValidator.getByProduct), 
  productReviewController.getProductReviewStats
);

// Get single review by ID (public)
router.get('/:id', 
  validate(productReviewValidator.getById), 
  productReviewController.getProductReviewById
);

// Update review (owner only)
router.put('/:id', 
  auth, 
  validate(productReviewValidator.update), 
  productReviewController.updateProductReview
);

// Delete review (owner or admin only)
router.delete('/:id', 
  auth, 
  validate(productReviewValidator.delete), 
  productReviewController.deleteProductReview
);

// Vote helpful (authenticated users only)
router.post('/:id/helpful', 
  auth, 
  validate(productReviewValidator.helpfulVote), 
  productReviewController.voteHelpful
);

// Remove helpful vote (authenticated users only)
router.delete('/:id/helpful', 
  auth, 
  validate(productReviewValidator.helpfulVote), 
  productReviewController.removeHelpfulVote
);

// Moderate review (admin only)
router.patch('/:id/moderate', 
  auth, 
  authorize(['admin']), 
  validate(productReviewValidator.moderateReview), 
  productReviewController.moderateReview
);

module.exports = router; 