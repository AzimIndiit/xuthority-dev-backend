const request = require('supertest');
const app = require('../../../app');
const { User, Product, ProductReview } = require('../../models');

describe('Product Review API', () => {
  let adminToken, userToken, user2Token;
  let adminUser, regularUser, regularUser2;
  let testProduct, testProduct2;

  beforeEach(async () => {
    // Clean up existing data
    await ProductReview.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // Create test users
    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin',
      acceptedTerms: true,
      isVerified: true
    });

    regularUser = await User.create({
      firstName: 'Regular',
      lastName: 'User',
      email: 'user@test.com',
      password: hashedPassword,
      role: 'user',
      acceptedTerms: true,
      isVerified: true
    });

    regularUser2 = await User.create({
      firstName: 'Regular',
      lastName: 'User2',
      email: 'user2@test.com',
      password: hashedPassword,
      role: 'user',
      acceptedTerms: true,
      isVerified: true
    });

    // Create test products
    testProduct = await Product.create({
      name: 'Test Product 1',
      slug: 'test-product-1',
      description: 'Test product description',
      userId: adminUser._id,
      status: 'published',
      isActive: 'active'
    });

    testProduct2 = await Product.create({
      name: 'Test Product 2',
      slug: 'test-product-2',
      description: 'Test product 2 description',
      userId: adminUser._id,
      status: 'published',
      isActive: 'active'
    });

    // Get authentication tokens
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'Password123!'
      });
    adminToken = adminLogin.body.data.token;

    const userLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user@test.com',
        password: 'Password123!'
      });
    userToken = userLogin.body.data.token;

    const user2Login = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user2@test.com',
        password: 'Password123!'
      });
    user2Token = user2Login.body.data.token;
  });

  afterEach(async () => {
    await ProductReview.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/v1/product-reviews', () => {
    it('should create a new product review when authenticated', async () => {
      const reviewData = {
        product: testProduct._id,
        overallRating: 5,
        title: 'Great product!',
        content: 'This product exceeded my expectations. Highly recommended!',
        subRatings: {
          easeOfUse: 5,
          customerSupport: 4,
          features: 5,
          pricing: 4,
          technicalSupport: 3
        },
        reviewSource: 'verified_purchase'
      };

      const response = await request(app)
        .post('/api/v1/product-reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send(reviewData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(reviewData.title);
      expect(response.body.data.overallRating).toBe(reviewData.overallRating);
      expect(response.body.data.reviewer._id).toBe(regularUser._id.toString());
      expect(response.body.data.product._id).toBe(testProduct._id.toString());
    });

    it('should fail to create review without authentication', async () => {
      const reviewData = {
        product: testProduct._id,
        overallRating: 5,
        title: 'Great product!',
        content: 'This product exceeded my expectations.'
      };

      const response = await request(app)
        .post('/api/v1/product-reviews')
        .send(reviewData);

      expect(response.status).toBe(401);
    });

    it('should fail with validation error for missing required fields', async () => {
      const reviewData = {
        product: testProduct._id,
        title: 'Great product!'
        // Missing overallRating and content
      };

      const response = await request(app)
        .post('/api/v1/product-reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send(reviewData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with validation error for invalid rating', async () => {
      const reviewData = {
        product: testProduct._id,
        overallRating: 6, // Invalid rating (max is 5)
        title: 'Great product!',
        content: 'This product exceeded my expectations.'
      };

      const response = await request(app)
        .post('/api/v1/product-reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send(reviewData);

      expect(response.status).toBe(400);
    });

    it('should fail when user tries to review same product twice', async () => {
      const reviewData = {
        product: testProduct._id,
        overallRating: 5,
        title: 'Great product!',
        content: 'This product exceeded my expectations.'
      };

      // First review
      await request(app)
        .post('/api/v1/product-reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send(reviewData);

      // Second review for same product
      const response = await request(app)
        .post('/api/v1/product-reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send(reviewData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should fail when product does not exist', async () => {
      const reviewData = {
        product: '507f1f77bcf86cd799439011', // Non-existent product ID
        overallRating: 5,
        title: 'Great product!',
        content: 'This product exceeded my expectations.'
      };

      const response = await request(app)
        .post('/api/v1/product-reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send(reviewData);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/product-reviews', () => {
    beforeEach(async () => {
      // Create test reviews
      await ProductReview.create([
        {
          product: testProduct._id,
          reviewer: regularUser._id,
          overallRating: 5,
          title: 'Excellent product',
          content: 'Really love this product',
          status: 'approved',
          publishedAt: new Date()
        },
        {
          product: testProduct._id,
          reviewer: regularUser2._id,
          overallRating: 4,
          title: 'Good product',
          content: 'Nice features but could be better',
          status: 'approved',
          publishedAt: new Date()
        },
        {
          product: testProduct2._id,
          reviewer: regularUser._id,
          overallRating: 3,
          title: 'Average product',
          content: 'It is okay but nothing special',
          status: 'approved',
          publishedAt: new Date()
        }
      ]);
    });

    it('should retrieve all approved reviews with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/product-reviews')
        .query({ page: 1, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.meta.pagination.currentPage).toBe(1);
      expect(response.body.meta.pagination.totalItems).toBe(3);
    });

    it('should filter reviews by overall rating', async () => {
      const response = await request(app)
        .get('/api/v1/product-reviews')
        .query({ overallRating: [4, 5] });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      response.body.data.forEach(review => {
        expect([4, 5]).toContain(review.overallRating);
      });
    });

    it('should filter reviews by rating range', async () => {
      const response = await request(app)
        .get('/api/v1/product-reviews')
        .query({ minRating: 4, maxRating: 5 });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
    });

    it('should search reviews by title and content', async () => {
      const response = await request(app)
        .get('/api/v1/product-reviews')
        .query({ search: 'excellent' });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title.toLowerCase()).toContain('excellent');
    });

    it('should sort reviews by rating descending', async () => {
      const response = await request(app)
        .get('/api/v1/product-reviews')
        .query({ sortBy: 'overallRating', sortOrder: 'desc' });

      expect(response.status).toBe(200);
      expect(response.body.data[0].overallRating).toBeGreaterThanOrEqual(
        response.body.data[1].overallRating
      );
    });
  });

  describe('GET /api/v1/product-reviews/product/:productId', () => {
    beforeEach(async () => {
      await ProductReview.create([
        {
          product: testProduct._id,
          reviewer: regularUser._id,
          overallRating: 5,
          title: 'Excellent product',
          content: 'Really love this product',
          status: 'approved',
          publishedAt: new Date()
        },
        {
          product: testProduct._id,
          reviewer: regularUser2._id,
          overallRating: 4,
          title: 'Good product',
          content: 'Nice features',
          status: 'approved',
          publishedAt: new Date()
        }
      ]);
    });

    it('should retrieve reviews for a specific product', async () => {
      const response = await request(app)
        .get(`/api/v1/product-reviews/product/${testProduct._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.meta.productInfo.name).toBe(testProduct.name);
      expect(response.body.meta.productInfo.ratingDistribution).toBeDefined();
    });

    it('should filter product reviews by rating', async () => {
      const response = await request(app)
        .get(`/api/v1/product-reviews/product/${testProduct._id}`)
        .query({ overallRating: [5] });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].overallRating).toBe(5);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/v1/product-reviews/product/507f1f77bcf86cd799439011');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/product-reviews/:id', () => {
    let testReview;

    beforeEach(async () => {
      testReview = await ProductReview.create({
        product: testProduct._id,
        reviewer: regularUser._id,
        overallRating: 5,
        title: 'Excellent product',
        content: 'Really love this product',
        status: 'approved',
        publishedAt: new Date()
      });
    });

    it('should retrieve a single review by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/product-reviews/${testReview._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testReview._id.toString());
    });

    it('should return 404 for non-existent review', async () => {
      const response = await request(app)
        .get('/api/v1/product-reviews/507f1f77bcf86cd799439011');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/v1/product-reviews/:id', () => {
    let testReview;

    beforeEach(async () => {
      testReview = await ProductReview.create({
        product: testProduct._id,
        reviewer: regularUser._id,
        overallRating: 4,
        title: 'Good product',
        content: 'Nice product overall',
        status: 'approved',
        publishedAt: new Date()
      });
    });

    it('should update review when owner makes request', async () => {
      const updateData = {
        overallRating: 5,
        title: 'Excellent product',
        content: 'Actually, this product is amazing!'
      };

      const response = await request(app)
        .put(`/api/v1/product-reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.overallRating).toBe(5);
      expect(response.body.data.title).toBe(updateData.title);
    });

    it('should fail when non-owner tries to update', async () => {
      const updateData = {
        title: 'Updated title'
      };

      const response = await request(app)
        .put(`/api/v1/product-reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send(updateData);

      expect(response.status).toBe(403);
    });

    it('should fail without authentication', async () => {
      const updateData = {
        title: 'Updated title'
      };

      const response = await request(app)
        .put(`/api/v1/product-reviews/${testReview._id}`)
        .send(updateData);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/product-reviews/:id', () => {
    let testReview;

    beforeEach(async () => {
      testReview = await ProductReview.create({
        product: testProduct._id,
        reviewer: regularUser._id,
        overallRating: 4,
        title: 'Good product',
        content: 'Nice product overall',
        status: 'approved',
        publishedAt: new Date()
      });
    });

    it('should delete review when owner makes request', async () => {
      const response = await request(app)
        .delete(`/api/v1/product-reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify review is deleted
      const deletedReview = await ProductReview.findById(testReview._id);
      expect(deletedReview).toBeNull();
    });

    it('should delete review when admin makes request', async () => {
      const response = await request(app)
        .delete(`/api/v1/product-reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail when non-owner non-admin tries to delete', async () => {
      const response = await request(app)
        .delete(`/api/v1/product-reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/v1/product-reviews/:id/helpful', () => {
    let testReview;

    beforeEach(async () => {
      testReview = await ProductReview.create({
        product: testProduct._id,
        reviewer: regularUser._id,
        overallRating: 5,
        title: 'Excellent product',
        content: 'Really love this product',
        status: 'approved',
        publishedAt: new Date()
      });
    });

    it('should add helpful vote when authenticated user votes', async () => {
      const response = await request(app)
        .post(`/api/v1/product-reviews/${testReview._id}/helpful`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.helpfulCount).toBe(1);
      expect(response.body.data.hasVoted).toBe(true);
    });

    it('should fail when user tries to vote twice', async () => {
      // First vote
      await request(app)
        .post(`/api/v1/product-reviews/${testReview._id}/helpful`)
        .set('Authorization', `Bearer ${user2Token}`);

      // Second vote
      const response = await request(app)
        .post(`/api/v1/product-reviews/${testReview._id}/helpful`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(409);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post(`/api/v1/product-reviews/${testReview._id}/helpful`);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/product-reviews/:id/helpful', () => {
    let testReview;

    beforeEach(async () => {
      testReview = await ProductReview.create({
        product: testProduct._id,
        reviewer: regularUser._id,
        overallRating: 5,
        title: 'Excellent product',
        content: 'Really love this product',
        status: 'approved',
        publishedAt: new Date(),
        helpfulVotes: {
          count: 1,
          voters: [{
            user: regularUser2._id,
            votedAt: new Date()
          }]
        }
      });
    });

    it('should remove helpful vote when user removes their vote', async () => {
      const response = await request(app)
        .delete(`/api/v1/product-reviews/${testReview._id}/helpful`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.helpfulCount).toBe(0);
      expect(response.body.data.hasVoted).toBe(false);
    });

    it('should fail when user tries to remove non-existent vote', async () => {
      const response = await request(app)
        .delete(`/api/v1/product-reviews/${testReview._id}/helpful`)
        .set('Authorization', `Bearer ${userToken}`); // User who hasn't voted

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/product-reviews/:id/moderate', () => {
    let testReview;

    beforeEach(async () => {
      testReview = await ProductReview.create({
        product: testProduct._id,
        reviewer: regularUser._id,
        overallRating: 5,
        title: 'Excellent product',
        content: 'Really love this product',
        status: 'pending'
      });
    });

    it('should moderate review when admin makes request', async () => {
      const moderationData = {
        status: 'approved',
        moderationNote: 'Review approved after verification'
      };

      const response = await request(app)
        .patch(`/api/v1/product-reviews/${testReview._id}/moderate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(moderationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('approved');
      expect(response.body.data.publishedAt).toBeTruthy();
    });

    it('should fail when non-admin tries to moderate', async () => {
      const moderationData = {
        status: 'approved'
      };

      const response = await request(app)
        .patch(`/api/v1/product-reviews/${testReview._id}/moderate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(moderationData);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/v1/product-reviews/product/:productId/stats', () => {
    beforeEach(async () => {
      await ProductReview.create([
        {
          product: testProduct._id,
          reviewer: regularUser._id,
          overallRating: 5,
          title: 'Excellent',
          content: 'Great product',
          status: 'approved',
          publishedAt: new Date()
        },
        {
          product: testProduct._id,
          reviewer: regularUser2._id,
          overallRating: 4,
          title: 'Good',
          content: 'Nice product',
          status: 'approved',
          publishedAt: new Date()
        }
      ]);
    });

    it('should retrieve review statistics for a product', async () => {
      const response = await request(app)
        .get(`/api/v1/product-reviews/product/${testProduct._id}/stats`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalReviews).toBe(2);
      expect(response.body.data.avgRating).toBeGreaterThan(0);
    });
  });
}); 