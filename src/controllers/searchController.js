const { Software, Solution, Product } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { searchService } = require('../services');

exports.globalSearch = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.status(400).json(ApiResponse.error('Query is required', {}, 400));
    }
    const results = await searchService.globalSearch(q);
    return res.json(ApiResponse.success(results, 'Search results'));
  } catch (err) {
    next(err);
  }
}; 