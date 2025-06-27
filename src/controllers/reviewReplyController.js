const asyncHandler = require('express-async-handler');
const reviewReplyService = require('../services/reviewReplyService');

const createReply = asyncHandler(async (req, res) => {
  const result = await reviewReplyService.createReply(req.params.reviewId, req.body, req.user.id);
  res.status(201).json(result);
});

const getRepliesForReview = asyncHandler(async (req, res) => {
  const result = await reviewReplyService.getRepliesForReview(req.params.reviewId, req.query);
  res.json(result);
});

const getAllReplies = asyncHandler(async (req, res) => {
  const result = await reviewReplyService.getAllReplies(req.query);
  res.json(result);
});

const getReplyById = asyncHandler(async (req, res) => {
  const result = await reviewReplyService.getReplyById(req.params.id);
  res.json(result);
});

const updateReply = asyncHandler(async (req, res) => {
  const result = await reviewReplyService.updateReply(req.params.id, req.body, req.user.id);
  res.json(result);
});

const deleteReply = asyncHandler(async (req, res) => {
  const result = await reviewReplyService.deleteReply(req.params.id, req.user.id);
  res.json(result);
});

const voteHelpful = asyncHandler(async (req, res) => {
  const result = await reviewReplyService.voteHelpful(req.params.id, req.user.id);
  res.json(result);
});

const removeHelpfulVote = asyncHandler(async (req, res) => {
  const result = await reviewReplyService.removeHelpfulVote(req.params.id, req.user.id);
  res.json(result);
});

module.exports = {
  createReply,
  getRepliesForReview,
  getAllReplies,
  getReplyById,
  updateReply,
  deleteReply,
  voteHelpful,
  removeHelpfulVote
}; 