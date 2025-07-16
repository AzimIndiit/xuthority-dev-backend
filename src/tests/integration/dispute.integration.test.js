const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../../../app');
const { Dispute, ProductReview, Product, User } = require('../../models');
const Notification = require('../../models/Notification');
const emailService = require('../../services/emailService');

// Mock the email service
jest.mock('../../services/emailService');

describe('Dispute API Integration Tests', () => {
  let vendorToken, adminToken;
  let vendorUser, adminUser, testUser;
  let testProduct, testReview;

  beforeEach(async () => {
    // Clean up existing data
    await Dispute.deleteMany({});
    await ProductReview.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});

    // Create minimal test users
    const hashedPassword = await bcrypt.hash('TestPass123!', 10);
    
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'user@test.com',
      password: hashedPassword,
      role: 'user',
      acceptedTerms: true,
      isVerified: true
    });

    vendorUser = await User.create({
      firstName: 'Vendor',
      lastName: 'User',
      email: 'vendor@test.com',
      password: hashedPassword,
      role: 'vendor',
      acceptedTerms: true,
      isVerified: true,
      companyName: 'Test Company'
    });

    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin',
      acceptedTerms: true,
      isVerified: true
    });

    // Get auth tokens
    const vendorLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'vendor@test.com', password: 'TestPass123!' });
    vendorToken = vendorLogin.body.data.token;

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com', password: 'TestPass123!' });
    adminToken = adminLogin.body.data.token;

    // Create test product and review
    testProduct = await Product.create({
      name: 'Test Product',
      description: 'Test product description',
      userId: vendorUser._id,
      slug: 'test-product',
      status: 'approved',
      isActive: 'active'
    });

    testReview = await ProductReview.create({
      title: 'Test Review',
      content: 'This is a test review for the product.',
      overallRating: 4.0,
      product: testProduct._id,
      reviewer: testUser._id,
      status: 'approved'
    });
  });

  afterEach(async () => {
    await Dispute.deleteMany({});
    await ProductReview.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/v1/disputes', () => {
    it('should create a dispute successfully', async () => {
      const disputeData = {
        reviewId: testReview._id,
        reason: 'false-or-misleading-information',
        description: 'This review contains false information about our product.'
      };

      const response = await request(app)
        .post('/api/v1/disputes')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(disputeData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reason).toBe(disputeData.reason);
      expect(response.body.data.description).toBe(disputeData.description);
      expect(response.body.message).toBe('Dispute created successfully');

      // Verify notification for vendor
      const vendorNotif = await Notification.findOne({
        userId: vendorUser._id,
        type: 'REVIEW_DISPUTE',
        isRead: false
      });
      expect(vendorNotif).toBeTruthy();
      expect(vendorNotif.title).toBe('Review Dispute Status Update');
      expect(vendorNotif.message).toContain('dispute has been created');

      // Verify notification for review author (user)
      const userNotif = await Notification.findOne({
        userId: testUser._id,
        type: 'REVIEW_DISPUTE',
        isRead: false
      });
      expect(userNotif).toBeTruthy();
      expect(userNotif.title).toBe('Your Review is Under Dispute');
      expect(userNotif.message).toContain('disputed your review');
    });

    it('should not allow creating dispute for soft-deleted review', async () => {
      // Soft delete the review first
      await testReview.softDelete(testUser._id);

      const disputeData = {
        reviewId: testReview._id,
        reason: 'false-or-misleading-information',
        description: 'This review contains false information about our product.'
      };

      const response = await request(app)
        .post('/api/v1/disputes')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(disputeData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Product review not found or has been deleted');
    });

    it('should require authentication', async () => {
      const disputeData = {
        reviewId: testReview._id,
        reason: 'false-or-misleading-information',
        description: 'Test description'
      };

      await request(app)
        .post('/api/v1/disputes')
        .send(disputeData)
        .expect(401);
    });

    it('should validate required fields', async () => {
      // Test missing required fields
      const response = await request(app)
        .post('/api/v1/disputes')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ reviewId: testReview._id })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toBeDefined();
      
      // Check that both reason and description validation errors are present
      expect(response.body.error.details.reason).toBeDefined();
      expect(response.body.error.details.description).toBeDefined();
    });
  });

  describe('GET /api/v1/disputes', () => {
    beforeEach(async () => {
      await Dispute.create({
        review: testReview._id,
        vendor: vendorUser._id,
        product: testProduct._id,
        reason: 'false-or-misleading-information',
        description: 'Test dispute'
      });
    });

    it('should get vendor disputes', async () => {
      const response = await request(app)
        .get('/api/v1/disputes')
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.message).toBe('Disputes retrieved successfully');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v1/disputes')
        .expect(401);
    });
  });

  describe('GET /api/v1/disputes/all', () => {
    beforeEach(async () => {
      await Dispute.create({
        review: testReview._id,
        vendor: vendorUser._id,
        product: testProduct._id,
        reason: 'false-or-misleading-information',
        description: 'Test dispute'
      });
    });

    it('should get all disputes for admin', async () => {
      const response = await request(app)
        .get('/api/v1/disputes/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.message).toBe('All disputes retrieved successfully');
    });

    it('should not allow non-admin access', async () => {
      await request(app)
        .get('/api/v1/disputes/all')
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(403);
    });
  });

  describe('PUT /api/v1/disputes/:id', () => {
    let testDispute;

    beforeEach(async () => {
      testDispute = await Dispute.create({
        review: testReview._id,
        vendor: vendorUser._id,
        product: testProduct._id,
        reason: 'false-or-misleading-information',
        description: 'Original description'
      });
    });

    it('should update dispute successfully', async () => {
      const updateData = {
        description: 'Updated description',
        status: 'resolved'
      };

      const response = await request(app)
        .put(`/api/v1/disputes/${testDispute._id}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.status).toBe(updateData.status);
      expect(response.body.message).toBe('Dispute updated successfully');

      // Verify notification for vendor on status update
      const vendorNotif = await Notification.findOne({
        userId: vendorUser._id,
        type: 'DISPUTE_STATUS_UPDATE',
        isRead: false
      });
      expect(vendorNotif).toBeTruthy();
      expect(vendorNotif.title).toBe('Review Dispute Status Update');
      expect(vendorNotif.message).toContain('dispute status has been updated');

      // Verify notification for review author (user) on status update
      const userNotif = await Notification.findOne({
        userId: testUser._id,
        type: 'DISPUTE_STATUS_UPDATE',
        isRead: false
      });
      expect(userNotif).toBeTruthy();
      expect(userNotif.title).toBe('Dispute Status Update on Your Review');
      expect(userNotif.message).toContain('dispute involving your review has been updated');
    });

    it('should require authentication', async () => {
      await request(app)
        .put(`/api/v1/disputes/${testDispute._id}`)
        .send({ description: 'Updated' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/disputes/:id', () => {
    let testDispute;

    beforeEach(async () => {
      testDispute = await Dispute.create({
        review: testReview._id,
        vendor: vendorUser._id,
        product: testProduct._id,
        reason: 'false-or-misleading-information',
        description: 'Test description'
      });
    });

    it('should delete dispute successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/disputes/${testDispute._id}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Dispute deleted successfully');

      // Verify deletion
      const deletedDispute = await Dispute.findById(testDispute._id);
      expect(deletedDispute).toBeNull();
    });

    it('should require authentication', async () => {
      await request(app)
        .delete(`/api/v1/disputes/${testDispute._id}`)
        .expect(401);
    });
  });

  describe('POST /api/v1/disputes/:id/explanation', () => {
    let testDispute;

    beforeEach(async () => {
      // Clear email service mock calls
      jest.clearAllMocks();
      
      testDispute = await Dispute.create({
        review: testReview._id,
        vendor: vendorUser._id,
        product: testProduct._id,
        reason: 'false-or-misleading-information',
        description: 'Test description'
      });

      // Mock email service
      emailService.sendDisputeExplanationEmail.mockResolvedValue({
        success: true,
        messageId: 'test-message-id'
      });
    });

    it('should add explanation and send email notification', async () => {
      const explanationData = {
        explanation: 'This is a detailed explanation from the vendor about the dispute.'
      };

      const response = await request(app)
        .post(`/api/v1/disputes/${testDispute._id}/explanation`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(explanationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.explanations).toHaveLength(1);
      expect(response.body.data.explanations[0].content).toBe(explanationData.explanation);

      // Verify notification was created
      const notification = await Notification.findOne({
        userId: testUser._id,
        type: 'DISPUTE_EXPLANATION',
        isRead: false
      });
      expect(notification).toBeTruthy();
      expect(notification.title).toBe('New Explanation Added to Dispute');

      // Verify email was sent
      expect(emailService.sendDisputeExplanationEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendDisputeExplanationEmail).toHaveBeenCalledWith(
        testUser.email,
        expect.objectContaining({
          explanationContent: explanationData.explanation,
          disputeId: testDispute._id.toString(),
          authorName: expect.any(String),
          userName: expect.any(String),
          productName: expect.any(String),
          disputeUrl: expect.stringContaining('/disputes/')
        })
      );
    });

    it('should add explanation from review author and send email to vendor', async () => {
      const explanationData = {
        explanation: 'This is the review author response to the dispute.'
      };

      // Test user (review author) adds explanation
      const userToken = jwt.sign(
        { id: testUser._id, email: testUser.email, role: testUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .post(`/api/v1/disputes/${testDispute._id}/explanation`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(explanationData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify email was sent to vendor
      expect(emailService.sendDisputeExplanationEmail).toHaveBeenCalledWith(
        vendorUser.email,
        expect.objectContaining({
          explanationContent: explanationData.explanation,
          disputeId: testDispute._id.toString()
        })
      );
    });

    it('should handle email sending failure gracefully', async () => {
      // Mock email service to fail
      emailService.sendDisputeExplanationEmail.mockRejectedValue(new Error('Email service unavailable'));

      const explanationData = {
        explanation: 'Test explanation'
      };

      // Should still succeed even if email fails
      const response = await request(app)
        .post(`/api/v1/disputes/${testDispute._id}/explanation`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(explanationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.explanations).toHaveLength(1);

      // Verify email was attempted
      expect(emailService.sendDisputeExplanationEmail).toHaveBeenCalledTimes(1);
    });

    it('should require authentication', async () => {
      await request(app)
        .post(`/api/v1/disputes/${testDispute._id}/explanation`)
        .send({ explanation: 'Test' })
        .expect(401);
    });
  });
});
