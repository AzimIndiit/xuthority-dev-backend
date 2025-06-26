const express = require('express');
const router = express.Router();
const reviewReplyController = require('../controllers/reviewReplyController');
const { auth, authorize, validate } = require('../middleware');
const { reviewReplyValidator } = require('../validators');

// Reply routes nested under reviews
// Create a new reply to a review (authenticated users only)
router.post('/reviews/:reviewId/replies', 
  auth, 
  validate(reviewReplyValidator.create), 
  reviewReplyController.createReply
);

// Get all replies for a specific review (public)
router.get('/reviews/:reviewId/replies', 
  validate(reviewReplyValidator.getByReview), 
  reviewReplyController.getRepliesForReview
);



// Direct reply routes
// Get all replies (admin only)
router.get('/replies', 
  auth, 
  authorize('admin'), 
  validate(reviewReplyValidator.listAll), 
  reviewReplyController.getAllReplies
);

// Get single reply by ID (public)
router.get('/replies/:id', 
  validate(reviewReplyValidator.getById), 
  reviewReplyController.getReplyById
);

// Update reply (author only)
router.put('/replies/:id', 
  auth, 
  validate(reviewReplyValidator.update), 
  reviewReplyController.updateReply
);

// Delete reply (author or admin only)
router.delete('/replies/:id', 
  auth, 
  validate(reviewReplyValidator.delete), 
  reviewReplyController.deleteReply
);

// Vote helpful on a reply (authenticated users only)
router.post('/replies/:id/helpful', 
  auth, 
  validate(reviewReplyValidator.helpfulVote), 
  reviewReplyController.voteHelpful
);

// Remove helpful vote from a reply (authenticated users only)
router.delete('/replies/:id/helpful', 
  auth, 
  validate(reviewReplyValidator.helpfulVote), 
  reviewReplyController.removeHelpfulVote
);



module.exports = router; 