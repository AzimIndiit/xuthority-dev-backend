const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = require('../../../app');
const { User, Product, ProductReview, ReviewReply } = require('../../models');

describe('Review Reply Integration Tests', () => {
  let adminUser, regularUser1, regularUser2;
  let adminToken, userToken1, userToken2;
  let testProduct, testReview;

  beforeAll(async () => {
    // Clean up existing data
    await ReviewReply.deleteMany({});
    await ProductReview.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});

    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // Create test users
    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      emailVerified: true,
      acceptedTerms: true,
      isVerified: true
    });

    regularUser1 = await User.create({
      firstName: 'Regular',
      lastName: 'User1',
      email: 'user1@example.com',
      password: hashedPassword,
      role: 'user',
      emailVerified: true,
      acceptedTerms: true,
      isVerified: true
    });

    regularUser2 = await User.create({
      firstName: 'Regular',
      lastName: 'User2',
      email: 'user2@example.com',
      password: hashedPassword,
      role: 'user',
      emailVerified: true,
      acceptedTerms: true,
      isVerified: true
    });

    // Get authentication tokens through login
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Password123!'
      });
    adminToken = adminLogin.body.data.token;

    const userLogin1 = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user1@example.com',
        password: 'Password123!'
      });
    userToken1 = userLogin1.body.data.token;

    const userLogin2 = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user2@example.com',
        password: 'Password123!'
      });
    userToken2 = userLogin2.body.data.token;

    // Create test product
    testProduct = await Product.create({
      userId: adminUser._id,
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test product description',
      pricing: {
        model: 'freemium',
        plans: [{
          name: 'Free',
          price: 0,
          features: ['Basic features']
        }]
      },
      features: ['Feature 1', 'Feature 2'],
      status: 'published',
      isActive: 'active'
    });

    // Create test review
    testReview = await ProductReview.create({
      product: testProduct._id,
      reviewer: regularUser1._id,
      title: 'Great product!',
      content: 'This product is amazing and works perfectly.',
      overallRating: 5,
      status: 'approved'
    });
  });

  afterAll(async () => {
    await ReviewReply.deleteMany({});
    await ProductReview.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
  });

  beforeEach(async () => {
    // Only clean up replies, keep the review and other data
    await ReviewReply.deleteMany({});
    
    // Ensure all test data still exists and re-create if needed
    if (!await User.findById(adminUser._id)) {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      
      adminUser = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        emailVerified: true,
        acceptedTerms: true,
        isVerified: true
      });

      regularUser1 = await User.create({
        firstName: 'Regular',
        lastName: 'User1',
        email: 'user1@example.com',
        password: hashedPassword,
        role: 'user',
        emailVerified: true,
        acceptedTerms: true,
        isVerified: true
      });

      regularUser2 = await User.create({
        firstName: 'Regular',
        lastName: 'User2',
        email: 'user2@example.com',
        password: hashedPassword,
        role: 'user',
        emailVerified: true,
        acceptedTerms: true,
        isVerified: true
      });
    }
    
    // Ensure product exists
    if (!await Product.findById(testProduct._id)) {
      testProduct = await Product.create({
        userId: adminUser._id,
        name: 'Test Product',
        slug: 'test-product',
        description: 'Test product description',
        pricing: {
          model: 'freemium',
          plans: [{
            name: 'Free',
            price: 0,
            features: ['Basic features']
          }]
        },
        features: ['Feature 1', 'Feature 2'],
        status: 'published',
        isActive: 'active'
      });
    }
    
    // Ensure the test review still exists
    if (!await ProductReview.findById(testReview._id)) {
      testReview = await ProductReview.create({
        product: testProduct._id,
        reviewer: regularUser1._id,
        title: 'Great product!',
        content: 'This product is amazing and works perfectly.',
        overallRating: 5,
        status: 'approved'
      });
    }
    
    // Re-generate tokens to ensure they match existing users
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Password123!'
      });
    adminToken = adminLogin.body.data.token;

    const userLogin1 = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user1@example.com',
        password: 'Password123!'
      });
    userToken1 = userLogin1.body.data.token;

    const userLogin2 = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user2@example.com',
        password: 'Password123!'
      });
    userToken2 = userLogin2.body.data.token;
  });

  describe('POST /api/v1/reviews/:reviewId/replies', () => {
    it('should create a new reply to a review (authenticated user)', async () => {
      const replyData = {
        content: 'Thank you for the great review! We appreciate your feedback.'
      };

      const response = await request(app)
        .post(`/api/v1/reviews/${testReview._id}/replies`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send(replyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(replyData.content);
      expect(response.body.data.author._id).toBe(regularUser1._id.toString());
    });

    it('should fail to create reply without authentication', async () => {
      const replyData = {
        content: 'This should fail'
      };

      await request(app)
        .post(`/api/v1/reviews/${testReview._id}/replies`)
        .send(replyData)
        .expect(401);
    });

    it('should fail to create reply with invalid review ID', async () => {
      const replyData = {
        content: 'This should fail'
      };

      await request(app)
        .post(`/api/v1/reviews/${new mongoose.Types.ObjectId()}/replies`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send(replyData)
        .expect(404);
    });

    it('should fail to create reply with invalid content', async () => {
      const replyData = {
        content: 'Hi' // Too short
      };

      await request(app)
        .post(`/api/v1/reviews/${testReview._id}/replies`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send(replyData)
        .expect(400);
    });
  });

  describe('GET /api/v1/reviews/:reviewId/replies', () => {
    beforeEach(async () => {
      // Create test replies
      await ReviewReply.create([
        {
          review: testReview._id,
          author: regularUser1._id,
          content: 'First reply',
          status: 'approved'
        },
        {
          review: testReview._id,
          author: regularUser2._id,
          content: 'Second reply',
          status: 'approved'
        }
      ]);
    });

    it('should get all replies for a review with pagination', async () => {
      const response = await request(app)
        .get(`/api/v1/reviews/${testReview._id}/replies`)
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.pagination.totalItems).toBe(2);
    });

    it('should filter replies by status', async () => {
      const response = await request(app)
        .get(`/api/v1/reviews/${testReview._id}/replies`)
        .query({ status: 'approved' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].status).toBe('approved');
    });
  });

  describe('GET /api/v1/replies/:id', () => {
    it('should get a single reply by ID', async () => {
      const reply = await ReviewReply.create({
        review: testReview._id,
        author: regularUser1._id,
        content: 'Test reply content',
        status: 'approved'
      });

      const response = await request(app)
        .get(`/api/v1/replies/${reply._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(reply._id.toString());
      expect(response.body.data.content).toBe('Test reply content');
    });

    it('should return 404 for non-existent reply', async () => {
      await request(app)
        .get(`/api/v1/replies/${new mongoose.Types.ObjectId()}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/replies/:id', () => {
    it('should update reply by author', async () => {
      const reply = await ReviewReply.create({
        review: testReview._id,
        author: regularUser1._id,
        content: 'Original content',
        status: 'approved'
      });

      const updateData = {
        content: 'Updated content with more details'
      };

      const response = await request(app)
        .put(`/api/v1/replies/${reply._id}`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(updateData.content);
      expect(response.body.data.isEdited).toBe(true);
    });

    it('should fail to update reply by non-author', async () => {
      const reply = await ReviewReply.create({
        review: testReview._id,
        author: regularUser1._id,
        content: 'Original content',
        status: 'approved'
      });

      const updateData = {
        content: 'Unauthorized update attempt'
      };

      await request(app)
        .put(`/api/v1/replies/${reply._id}`)
        .set('Authorization', `Bearer ${userToken2}`)
        .send(updateData)
        .expect(403);
    });
  });

  describe('DELETE /api/v1/replies/:id', () => {
    it('should delete reply by author', async () => {
      const reply = await ReviewReply.create({
        review: testReview._id,
        author: regularUser1._id,
        content: 'Reply to be deleted',
        status: 'approved'
      });

      await request(app)
        .delete(`/api/v1/replies/${reply._id}`)
        .set('Authorization', `Bearer ${userToken1}`)
        .expect(200);

      // Verify reply is deleted
      const deletedReply = await ReviewReply.findById(reply._id);
      expect(deletedReply).toBeNull();
    });

    it('should delete reply by admin', async () => {
      const reply = await ReviewReply.create({
        review: testReview._id,
        author: regularUser1._id,
        content: 'Reply to be deleted by admin',
        status: 'approved'
      });

      await request(app)
        .delete(`/api/v1/replies/${reply._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should fail to delete reply by non-author/non-admin', async () => {
      const reply = await ReviewReply.create({
        review: testReview._id,
        author: regularUser1._id,
        content: 'Reply protected from deletion',
        status: 'approved'
      });

      await request(app)
        .delete(`/api/v1/replies/${reply._id}`)
        .set('Authorization', `Bearer ${userToken2}`)
        .expect(403);
    });
  });

  describe('POST /api/v1/replies/:id/helpful', () => {
    it('should vote reply as helpful', async () => {
      const reply = await ReviewReply.create({
        review: testReview._id,
        author: regularUser1._id,
        content: 'Helpful reply content',
        status: 'approved'
      });

      const response = await request(app)
        .post(`/api/v1/replies/${reply._id}/helpful`)
        .set('Authorization', `Bearer ${userToken2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.helpfulCount).toBe(1);
      expect(response.body.data.hasVoted).toBe(true);
    });

    it('should fail to vote twice on same reply', async () => {
      const reply = await ReviewReply.create({
        review: testReview._id,
        author: regularUser1._id,
        content: 'Helpful reply content',
        status: 'approved'
      });

      // First vote
      await request(app)
        .post(`/api/v1/replies/${reply._id}/helpful`)
        .set('Authorization', `Bearer ${userToken2}`)
        .expect(200);

      // Second vote should fail
      await request(app)
        .post(`/api/v1/replies/${reply._id}/helpful`)
        .set('Authorization', `Bearer ${userToken2}`)
        .expect(409);
    });
  });

  describe('DELETE /api/v1/replies/:id/helpful', () => {
    it('should remove helpful vote from reply', async () => {
      const reply = await ReviewReply.create({
        review: testReview._id,
        author: regularUser1._id,
        content: 'Helpful reply content',
        status: 'approved'
      });

      // First vote
      await request(app)
        .post(`/api/v1/replies/${reply._id}/helpful`)
        .set('Authorization', `Bearer ${userToken2}`)
        .expect(200);

      // Remove vote
      const response = await request(app)
        .delete(`/api/v1/replies/${reply._id}/helpful`)
        .set('Authorization', `Bearer ${userToken2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.helpfulCount).toBe(0);
      expect(response.body.data.hasVoted).toBe(false);
    });

    it('should fail to remove vote if not voted', async () => {
      const reply = await ReviewReply.create({
        review: testReview._id,
        author: regularUser1._id,
        content: 'Helpful reply content',
        status: 'approved'
      });

      await request(app)
        .delete(`/api/v1/replies/${reply._id}/helpful`)
        .set('Authorization', `Bearer ${userToken2}`)
        .expect(404);
    });
  });

  describe('GET /api/v1/replies (Admin only)', () => {
    beforeEach(async () => {
      // Create test replies with different statuses
      await ReviewReply.create([
        {
          review: testReview._id,
          author: regularUser1._id,
          content: 'Approved reply',
          status: 'approved'
        },
        {
          review: testReview._id,
          author: regularUser2._id,
          content: 'Pending reply',
          status: 'pending'
        }
      ]);
    });

    it('should get all replies for admin', async () => {
      const response = await request(app)
        .get('/api/v1/replies')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter replies by status for admin', async () => {
      const response = await request(app)
        .get('/api/v1/replies')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'pending' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('pending');
    });

    it('should fail to get all replies for non-admin', async () => {
      await request(app)
        .get('/api/v1/replies')
        .set('Authorization', `Bearer ${userToken1}`)
        .expect(403);
    });
  });

  describe('Reply Count Updates', () => {
    it('should update review totalReplies count when reply is created', async () => {
      const replyData = {
        content: 'This reply should update the count'
      };

      await request(app)
        .post(`/api/v1/reviews/${testReview._id}/replies`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send(replyData);

      // Check if review totalReplies count is updated
      const updatedReview = await ProductReview.findById(testReview._id);
      expect(updatedReview.totalReplies).toBe(1);
    });

    it('should update review totalReplies count when reply is deleted', async () => {
      // Create a reply first
      const reply = await ReviewReply.create({
        review: testReview._id,
        author: regularUser1._id,
        content: 'Reply to be deleted',
        status: 'approved'
      });

      // Check initial count
      let updatedReview = await ProductReview.findById(testReview._id);
      expect(updatedReview.totalReplies).toBe(1);

      // Delete the reply
      await request(app)
        .delete(`/api/v1/replies/${reply._id}`)
        .set('Authorization', `Bearer ${userToken1}`)
        .expect(200);

      // Check if count is decremented
      updatedReview = await ProductReview.findById(testReview._id);
      expect(updatedReview.totalReplies).toBe(0);
    });
  });
}); 