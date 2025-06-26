const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../../../app');
const { Dispute, ProductReview, Product, User } = require('../../models');

describe('Dispute API Integration Tests', () => {
  jest.setTimeout(60000); // 60 second timeout for all tests
  let userToken, vendorToken, vendor2Token, adminToken;
  let testUser, vendorUser, vendor2User, adminUser;
  let testProduct, testProduct2;
  let testReview, testReview2;
  let testDispute;

  // Helper function to create test users and data
  const createTestData = async () => {
    // Create test users
    const hashedPassword = await bcrypt.hash('TestPass123!', 12);
    
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'user@test.com',
      password: hashedPassword,
      role: 'user',
      acceptedTerms: true
    });

    vendorUser = await User.create({
      firstName: 'Test',
      lastName: 'Vendor',
      email: 'vendor@test.com',
      password: hashedPassword,
      role: 'vendor',
      acceptedTerms: true,
      companyName: 'Test Vendor Company'
    });

    vendor2User = await User.create({
      firstName: 'Test',
      lastName: 'Vendor2',
      email: 'vendor2@test.com',
      password: hashedPassword,
      role: 'vendor',
      acceptedTerms: true,
      companyName: 'Test Vendor2 Company'
    });

    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin',
      acceptedTerms: true
    });

    // Generate tokens
    userToken = jwt.sign({ id: testUser._id, email: testUser.email, role: testUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    vendorToken = jwt.sign({ id: vendorUser._id, email: vendorUser.email, role: vendorUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    vendor2Token = jwt.sign({ id: vendor2User._id, email: vendor2User.email, role: vendor2User.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    adminToken = jwt.sign({ id: adminUser._id, email: adminUser.email, role: adminUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create test products
    testProduct = await Product.create({
      name: 'Test Product',
      description: 'This is a test product for dispute testing',
      userId: vendorUser._id,
      slug: 'test-product',
      status: 'approved',
      isActive: 'active'
    });

    testProduct2 = await Product.create({
      name: 'Test Product 2',
      description: 'This is another test product for dispute testing',
      userId: vendor2User._id,
      slug: 'test-product-2',
      status: 'approved',
      isActive: 'active'
    });

    // Create test reviews
    testReview = await ProductReview.create({
      title: 'Great product',
      content: 'This product is really amazing and works perfectly for our needs.',
      overallRating: 4.5,
      product: testProduct._id,
      reviewer: testUser._id
    });

    testReview2 = await ProductReview.create({
      title: 'Disappointing product',
      content: 'This product did not meet our expectations and has several issues.',
      overallRating: 2.0,
      product: testProduct._id,
      reviewer: testUser._id
    });
  };

  describe('POST /api/v1/disputes', () => {
    beforeEach(async () => {
      await createTestData();
    });

    it('should create a dispute successfully', async () => {
      const disputeData = {
        reviewId: testReview._id,
        reason: 'false-or-misleading-information',
        description: 'This review contains false information about our product features and capabilities.'
      };

      const response = await request(app)
        .post('/api/v1/disputes')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(disputeData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.review._id).toBe(testReview._id.toString());
      expect(response.body.data.vendor._id).toBe(vendorUser._id.toString());
      expect(response.body.data.product._id).toBe(testProduct._id.toString());
      expect(response.body.data.reason).toBe(disputeData.reason);
      expect(response.body.data.description).toBe(disputeData.description);
      expect(response.body.data.status).toBe('active');
      expect(response.body.message).toBe('Dispute created successfully');

      // Verify the dispute was saved in database
      const savedDispute = await Dispute.findById(response.body.data._id);
      expect(savedDispute).toBeTruthy();
      expect(savedDispute.review.toString()).toBe(testReview._id.toString());
      expect(savedDispute.vendor.toString()).toBe(vendorUser._id.toString());

      testDispute = response.body.data;
    });

    it('should not create dispute for non-existent review', async () => {
      const disputeData = {
        reviewId: new mongoose.Types.ObjectId(),
        reason: 'false-or-misleading-information',
        description: 'This review contains false information about our product.'
      };

      const response = await request(app)
        .post('/api/v1/disputes')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(disputeData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Product review not found');
    });

    it('should not create dispute for review on product not owned by vendor', async () => {
      const disputeData = {
        reviewId: testReview._id,
        reason: 'false-or-misleading-information',
        description: 'This review contains false information about the product.'
      };

      const response = await request(app)
        .post('/api/v1/disputes')
        .set('Authorization', `Bearer ${vendor2Token}`)
        .send(disputeData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('You can only dispute reviews for your own products');
    });

    it('should not create duplicate dispute', async () => {
      // Create first dispute
      await Dispute.create({
        review: testReview._id,
        vendor: vendorUser._id,
        product: testProduct._id,
        reason: 'false-or-misleading-information',
        description: 'First dispute description'
      });

      const disputeData = {
        reviewId: testReview._id,
        reason: 'spam-or-fake-review',
        description: 'Second dispute description for the same review.'
      };

      const response = await request(app)
        .post('/api/v1/disputes')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(disputeData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('You have already disputed this review');
    });

    it('should require authentication', async () => {
      const disputeData = {
        reviewId: testReview._id,
        reason: 'false-or-misleading-information',
        description: 'This review contains false information.'
      };

      const response = await request(app)
        .post('/api/v1/disputes')
        .send(disputeData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Authentication required');
    });

    it('should validate required fields', async () => {
      const disputeData = {
        // Missing reviewId, reason, and description
      };

      const response = await request(app)
        .post('/api/v1/disputes')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(disputeData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Review ID is required');
    });

    it('should validate reason enum values', async () => {
      const disputeData = {
        reviewId: testReview._id,
        reason: 'invalid-reason',
        description: 'This review contains false information.'
      };

      const response = await request(app)
        .post('/api/v1/disputes')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(disputeData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid reason');
    });

    it('should validate description length', async () => {
      const disputeData = {
        reviewId: testReview._id,
        reason: 'false-or-misleading-information',
        description: 'Short' // Too short
      };

      const response = await request(app)
        .post('/api/v1/disputes')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(disputeData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Description must be between 10 and 2000 characters');
    });
  });

  describe('GET /api/v1/disputes', () => {
    beforeEach(async () => {
      await createTestData();
      
      // Create test disputes
      await Dispute.create({
        review: testReview._id,
        vendor: vendorUser._id,
        product: testProduct._id,
        reason: 'false-or-misleading-information',
        description: 'First dispute description',
        status: 'active'
      });

      await Dispute.create({
        review: testReview2._id,
        vendor: vendorUser._id,
        product: testProduct._id,
        reason: 'spam-or-fake-review',
        description: 'Second dispute description',
        status: 'resolved'
      });
    });

    it('should get vendor disputes with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/disputes')
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.pagination.totalItems).toBe(2);
      expect(response.body.meta.pagination.currentPage).toBe(1);
      expect(response.body.message).toBe('Disputes retrieved successfully');
    });

    it('should filter disputes by status', async () => {
      const response = await request(app)
        .get('/api/v1/disputes?status=active')
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('active');
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/disputes?page=1&limit=1')
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta.pagination.itemsPerPage).toBe(1);
      expect(response.body.meta.pagination.hasNextPage).toBe(true);
    });

    it('should support sorting', async () => {
      const response = await request(app)
        .get('/api/v1/disputes?sortBy=createdAt&sortOrder=asc')
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should only return disputes for authenticated vendor', async () => {
      const response = await request(app)
        .get('/api/v1/disputes')
        .set('Authorization', `Bearer ${vendor2Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0); // vendor2 has no disputes
      expect(response.body.meta.pagination.totalItems).toBe(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/disputes')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Authentication required');
    });
  });

  describe('GET /api/v1/disputes/all', () => {
    beforeEach(async () => {
      await createTestData();
      
      // Create test disputes for different vendors
      await Dispute.create({
        review: testReview._id,
        vendor: vendorUser._id,
        product: testProduct._id,
        reason: 'false-or-misleading-information',
        description: 'First dispute description'
      });

      // Create a review for product 2 and dispute it
      const review3 = await ProductReview.create({
        title: 'Another review',
        content: 'This is another review for testing purposes.',
        overallRating: 3.0,
        product: testProduct2._id,
        reviewer: testUser._id
      });

      await Dispute.create({
        review: review3._id,
        vendor: vendor2User._id,
        product: testProduct2._id,
        reason: 'inappropriate-content',
        description: 'Second dispute description'
      });
    });

    it('should get all disputes for admin', async () => {
      const response = await request(app)
        .get('/api/v1/disputes/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.pagination.totalItems).toBe(2);
      expect(response.body.message).toBe('All disputes retrieved successfully');
    });

    it('should filter all disputes by status', async () => {
      const response = await request(app)
        .get('/api/v1/disputes/all?status=active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(dispute => dispute.status === 'active')).toBe(true);
    });

    it('should not allow non-admin users to access all disputes', async () => {
      const response = await request(app)
        .get('/api/v1/disputes/all')
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Forbidden: insufficient permissions');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/disputes/all')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Authentication required');
    });
  });

  describe('GET /api/v1/disputes/:id', () => {
    beforeEach(async () => {
      await createTestData();
      
      testDispute = await Dispute.create({
        review: testReview._id,
        vendor: vendorUser._id,
        product: testProduct._id,
        reason: 'false-or-misleading-information',
        description: 'Test dispute description'
      });
    });

    it('should get dispute by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/disputes/${testDispute._id}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testDispute._id.toString());
      expect(response.body.data.reason).toBe('false-or-misleading-information');
      expect(response.body.data.description).toBe('Test dispute description');
      expect(response.body.data.review).toBeDefined();
      expect(response.body.data.product).toBeDefined();
      expect(response.body.data.vendor).toBeDefined();
      expect(response.body.message).toBe('Dispute retrieved successfully');
    });

    it('should not get dispute that does not belong to vendor', async () => {
      const response = await request(app)
        .get(`/api/v1/disputes/${testDispute._id}`)
        .set('Authorization', `Bearer ${vendor2Token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Dispute not found');
    });

    it('should not get non-existent dispute', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/disputes/${nonExistentId}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Dispute not found');
    });

    it('should validate dispute ID format', async () => {
      const response = await request(app)
        .get('/api/v1/disputes/invalid-id')
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid dispute ID');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/disputes/${testDispute._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Authentication required');
    });
  });

  describe('PUT /api/v1/disputes/:id', () => {
    beforeEach(async () => {
      await createTestData();
      
      testDispute = await Dispute.create({
        review: testReview._id,
        vendor: vendorUser._id,
        product: testProduct._id,
        reason: 'false-or-misleading-information',
        description: 'Original dispute description'
      });
    });

    it('should update dispute successfully', async () => {
      const updateData = {
        reason: 'spam-or-fake-review',
        description: 'Updated dispute description with more details',
        status: 'resolved'
      };

      const response = await request(app)
        .put(`/api/v1/disputes/${testDispute._id}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testDispute._id.toString());
      expect(response.body.data.reason).toBe(updateData.reason);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.status).toBe(updateData.status);
      expect(response.body.message).toBe('Dispute updated successfully');

      // Verify the dispute was updated in database
      const updatedDispute = await Dispute.findById(testDispute._id);
      expect(updatedDispute.reason).toBe(updateData.reason);
      expect(updatedDispute.description).toBe(updateData.description);
      expect(updatedDispute.status).toBe(updateData.status);
    });

    it('should update partial fields', async () => {
      const updateData = {
        description: 'Only updating description'
      };

      const response = await request(app)
        .put(`/api/v1/disputes/${testDispute._id}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.reason).toBe('false-or-misleading-information'); // Should remain unchanged
      expect(response.body.data.status).toBe('active'); // Should remain unchanged
    });

    it('should not update dispute that does not belong to vendor', async () => {
      const updateData = {
        description: 'Trying to update someone else dispute'
      };

      const response = await request(app)
        .put(`/api/v1/disputes/${testDispute._id}`)
        .set('Authorization', `Bearer ${vendor2Token}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Dispute not found');
    });

    it('should not update non-existent dispute', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = {
        description: 'Trying to update non-existent dispute'
      };

      const response = await request(app)
        .put(`/api/v1/disputes/${nonExistentId}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Dispute not found');
    });

    it('should validate update data', async () => {
      const updateData = {
        reason: 'invalid-reason',
        description: 'Short' // Too short
      };

      const response = await request(app)
        .put(`/api/v1/disputes/${testDispute._id}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid reason');
    });

    it('should require authentication', async () => {
      const updateData = {
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/v1/disputes/${testDispute._id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Authentication required');
    });
  });

  describe('DELETE /api/v1/disputes/:id', () => {
    beforeEach(async () => {
      await createTestData();
      
      testDispute = await Dispute.create({
        review: testReview._id,
        vendor: vendorUser._id,
        product: testProduct._id,
        reason: 'false-or-misleading-information',
        description: 'Test dispute description'
      });
    });

    it('should delete dispute successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/disputes/${testDispute._id}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Dispute deleted successfully');

      // Verify the dispute was deleted from database
      const deletedDispute = await Dispute.findById(testDispute._id);
      expect(deletedDispute).toBeNull();
    });

    it('should not delete dispute that does not belong to vendor', async () => {
      const response = await request(app)
        .delete(`/api/v1/disputes/${testDispute._id}`)
        .set('Authorization', `Bearer ${vendor2Token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Dispute not found');

      // Verify the dispute still exists
      const existingDispute = await Dispute.findById(testDispute._id);
      expect(existingDispute).toBeTruthy();
    });

    it('should not delete non-existent dispute', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/v1/disputes/${nonExistentId}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Dispute not found');
    });

    it('should validate dispute ID format', async () => {
      const response = await request(app)
        .delete('/api/v1/disputes/invalid-id')
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid dispute ID');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/disputes/${testDispute._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Authentication required');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    beforeEach(async () => {
      await createTestData();
    });

    it('should handle malformed request body', async () => {
      const response = await request(app)
        .post('/api/v1/disputes')
        .set('Authorization', `Bearer ${vendorToken}`)
        .set('Content-Type', 'application/json')
        .send('{"malformed": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle very long description', async () => {
      const longDescription = 'A'.repeat(2001); // Over the 2000 character limit
      const disputeData = {
        reviewId: testReview._id,
        reason: 'false-or-misleading-information',
        description: longDescription
      };

      const response = await request(app)
        .post('/api/v1/disputes')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(disputeData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Description must be between 10 and 2000 characters');
    });

    it('should handle concurrent dispute creation attempts', async () => {
      const disputeData = {
        reviewId: testReview._id,
        reason: 'false-or-misleading-information',
        description: 'Concurrent dispute creation test'
      };

      // Create first dispute
      const response1 = await request(app)
        .post('/api/v1/disputes')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(disputeData);

      // Try to create second dispute for same review
      const response2 = await request(app)
        .post('/api/v1/disputes')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(disputeData)
        .expect(400);

      expect(response1.body.success).toBe(true);
      expect(response2.body.success).toBe(false);
      expect(response2.body.error.message).toBe('You have already disputed this review');
    });
  });
});
