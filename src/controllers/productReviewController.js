const asyncHandler = require('express-async-handler');
const productReviewService = require('../services/productReviewService');

const createProductReview = asyncHandler(async (req, res) => {
  const result = await productReviewService.createProductReview(req.body, req.user.id);
  res.status(201).json(result);
});

const getAllProductReviews = asyncHandler(async (req, res) => {
  const result = await productReviewService.getAllProductReviews(req.query);
  res.json(result);
});

const getProductReviews = asyncHandler(async (req, res) => {
  const result = await productReviewService.getProductReviews(req.params.productId, req.query);
  res.json(result);
});

const getProductReviewStats = asyncHandler(async (req, res) => {
  const result = await productReviewService.getProductReviewStats(req.params.productId);
  res.json(result);
});

const getProductReviewById = asyncHandler(async (req, res) => {
  const result = await productReviewService.getProductReviewById(req.params.id);
  res.json(result);
});

const updateProductReview = asyncHandler(async (req, res) => {
  const result = await productReviewService.updateProductReview(req.params.id, req.body, req.user.id);
  res.json(result);
});

const deleteProductReview = asyncHandler(async (req, res) => {
  const result = await productReviewService.deleteProductReview(req.params.id, req.user.id, req.user.role);
  res.json(result);
});

const voteHelpful = asyncHandler(async (req, res) => {
  const result = await productReviewService.voteHelpful(req.params.id, req.user.id);
  res.json(result);
});

const removeHelpfulVote = asyncHandler(async (req, res) => {
  const result = await productReviewService.removeHelpfulVote(req.params.id, req.user.id);
  res.json(result);
});

const moderateReview = asyncHandler(async (req, res) => {
  const result = await productReviewService.moderateReview(req.params.id, req.body);
  res.json(result);
});

const getUserReviewForProduct = asyncHandler(async (req, res) => {
  const result = await productReviewService.getUserReviewForProduct(req.params.productId, req.user.id);
  res.json(result);
});

module.exports = {
  createProductReview,
  getAllProductReviews,
  getProductReviews,
  getProductReviewStats,
  getProductReviewById,
  updateProductReview,
  deleteProductReview,
  voteHelpful,
  removeHelpfulVote,
  moderateReview,
  getUserReviewForProduct
}; 