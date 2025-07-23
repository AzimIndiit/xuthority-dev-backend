const mongoose = require('mongoose');

/**
 * Update product aggregate ratings and statistics
 * @param {string|ObjectId} productId - Product ID
 * @returns {Promise<void>}
 */
const updateProductAggregateRatings = async (productId) => {
  const Product = mongoose.model('Product');
  const ProductReview = mongoose.model('ProductReview');
  
  try {
    const aggregateData = await ProductReview.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
          status: 'approved',
          publishedAt: { $ne: null },
          isDeleted: false // Exclude soft-deleted reviews
        }
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$overallRating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$overallRating'
          }
        }
      }
    ]);

    const result = aggregateData[0] || { avgRating: 0, totalReviews: 0, ratingDistribution: [] };
    
    // Calculate rating distribution
    const distribution = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    };
    
    result.ratingDistribution.forEach(rating => {
      distribution[rating] = (distribution[rating] || 0) + 1;
    });

    await Product.findByIdAndUpdate(productId, {
      avgRating: Math.round((result.avgRating || 0) * 10) / 10, // Round to 1 decimal, handle null
      totalReviews: result.totalReviews,
      ratingDistribution: distribution
    });

    console.log(`Updated product ${productId} ratings: avgRating=${result.avgRating}, totalReviews=${result.totalReviews}`);
  } catch (error) {
    console.error('Error updating product aggregate ratings:', error);
    throw error;
  }
};

/**
 * Recalculate product statistics for a specific product
 * This is useful when bulk operations need to refresh product stats
 * @param {string|ObjectId} productId - Product ID
 * @returns {Promise<Object>} Updated product statistics
 */
const recalculateProductStats = async (productId) => {
  await updateProductAggregateRatings(productId);
  
  const Product = mongoose.model('Product');
  const updatedProduct = await Product.findById(productId).select('avgRating totalReviews ratingDistribution');
  
  return updatedProduct;
};

/**
 * Batch update product statistics for multiple products
 * @param {Array<string|ObjectId>} productIds - Array of product IDs
 * @returns {Promise<void>}
 */
const batchUpdateProductStats = async (productIds) => {
  const promises = productIds.map(productId => updateProductAggregateRatings(productId));
  await Promise.all(promises);
};

module.exports = {
  updateProductAggregateRatings,
  recalculateProductStats,
  batchUpdateProductStats
}; 