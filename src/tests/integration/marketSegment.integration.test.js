const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../app');
const { User, MarketSegment } = require('../../models');

describe('Market Segment Integration Tests', () => {
  let authToken;
  let testUser;
  let testMarketSegment;

  beforeEach(async () => {
    // Clean market segment collection before each test
    await MarketSegment.deleteMany({});
    
    // Create test user with hashed password for each test
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'marketsegment.test@example.com',
      password: hashedPassword,
      role: 'admin',
      isVerified: true
    });

    // Login and get token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'marketsegment.test@example.com',
        password: 'Password123!'
      });

    authToken = loginResponse.body.data.token;
  });

  afterEach(async () => {
    await MarketSegment.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/v1/market-segments', () => {
    it('should create a new market segment successfully', async () => {
      const marketSegmentData = {
        name: 'Small Business',
        status: 'active'
      };

      const response = await request(app)
        .post('/api/v1/market-segments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(marketSegmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(marketSegmentData.name);
      expect(response.body.data.status).toBe(marketSegmentData.status);
      expect(response.body.data.slug).toMatch(/small-business-\d+/);
      expect(response.body.data.createdBy).toBeDefined();
    });

    it('should return error when name is missing', async () => {
      const response = await request(app)
        .post('/api/v1/market-segments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'active' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Market segment name is required');
    });

    it('should return error when name already exists', async () => {
      // Create first market segment
      const marketSegment = new MarketSegment({
        name: 'Enterprise',
        status: 'active',
        createdBy: testUser._id
      });
      await marketSegment.save();

      // Try to create duplicate
      const response = await request(app)
        .post('/api/v1/market-segments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Enterprise', status: 'active' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Market segment name already exists');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/market-segments')
        .send({ name: 'Startup', status: 'active' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/market-segments', () => {
    beforeEach(async () => {
      // Create test market segment data
      const segmentList = [
        { name: 'Small Business', status: 'active', createdBy: testUser._id },
        { name: 'Enterprise', status: 'active', createdBy: testUser._id },
        { name: 'Startup', status: 'inactive', createdBy: testUser._id },
        { name: 'Mid Market', status: 'active', createdBy: testUser._id }
      ];

      for (const segmentData of segmentList) {
        const segment = new MarketSegment(segmentData);
        await segment.save();
      }
    });

    it('should get all market segments with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/market-segments')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(4);
      expect(response.body.meta.pagination).toBeDefined();
      expect(response.body.meta.pagination.totalItems).toBe(4);
    });

    it('should filter market segments by status', async () => {
      const response = await request(app)
        .get('/api/v1/market-segments?status=active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.every(segment => segment.status === 'active')).toBe(true);
    });

    it('should search market segments by name', async () => {
      const response = await request(app)
        .get('/api/v1/market-segments?search=business')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1); // Small Business
    });

    it('should paginate results correctly', async () => {
      const response = await request(app)
        .get('/api/v1/market-segments?page=1&limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.pagination.currentPage).toBe(1);
      expect(response.body.meta.pagination.totalPages).toBe(2);
    });
  });

  describe('GET /api/v1/market-segments/active', () => {
    beforeEach(async () => {
      const segmentList = [
        { name: 'Active Segment 1', status: 'active', createdBy: testUser._id },
        { name: 'Active Segment 2', status: 'active', createdBy: testUser._id },
        { name: 'Inactive Segment', status: 'inactive', createdBy: testUser._id }
      ];

      for (const segmentData of segmentList) {
        const segment = new MarketSegment(segmentData);
        await segment.save();
      }
    });

    it('should get only active market segments', async () => {
      const response = await request(app)
        .get('/api/v1/market-segments/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(segment => segment.status === 'active')).toBe(true);
    });
  });

  describe('GET /api/v1/market-segments/:marketSegmentId', () => {
    beforeEach(async () => {
      testMarketSegment = new MarketSegment({
        name: 'Test Market Segment Detail',
        status: 'active',
        createdBy: testUser._id
      });
      await testMarketSegment.save();
    });

    it('should get market segment by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/market-segments/${testMarketSegment._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(testMarketSegment.name);
      expect(response.body.data._id.toString()).toBe(testMarketSegment._id.toString());
    });

    it('should return 404 for non-existent market segment', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/market-segments/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Market segment not found');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/v1/market-segments/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/market-segments/slug/:slug', () => {
    beforeEach(async () => {
      testMarketSegment = new MarketSegment({
        name: 'Test Slug Segment',
        status: 'active',
        createdBy: testUser._id
      });
      await testMarketSegment.save();
    });

    it('should get market segment by slug', async () => {
      const response = await request(app)
        .get(`/api/v1/market-segments/slug/${testMarketSegment.slug}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(testMarketSegment.name);
      expect(response.body.data.slug).toBe(testMarketSegment.slug);
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/api/v1/market-segments/slug/non-existent-slug')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Market segment not found');
    });
  });

  describe('PUT /api/v1/market-segments/:marketSegmentId', () => {
    beforeEach(async () => {
      testMarketSegment = new MarketSegment({
        name: 'Test Update Segment',
        status: 'active',
        createdBy: testUser._id
      });
      await testMarketSegment.save();
    });

    it('should update market segment successfully', async () => {
      const updateData = {
        name: 'Updated Segment Name',
        status: 'inactive'
      };

      const response = await request(app)
        .put(`/api/v1/market-segments/${testMarketSegment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.status).toBe(updateData.status);
    });

    it('should require authentication for update', async () => {
      const response = await request(app)
        .put(`/api/v1/market-segments/${testMarketSegment._id}`)
        .send({ name: 'Updated Name' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent market segment', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/v1/market-segments/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/market-segments/:marketSegmentId/toggle-status', () => {
    beforeEach(async () => {
      testMarketSegment = new MarketSegment({
        name: 'Test Toggle Segment',
        status: 'active',
        createdBy: testUser._id
      });
      await testMarketSegment.save();
    });

    it('should toggle market segment status', async () => {
      const response = await request(app)
        .patch(`/api/v1/market-segments/${testMarketSegment._id}/toggle-status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('inactive');
    });

    it('should require authentication for status toggle', async () => {
      const response = await request(app)
        .patch(`/api/v1/market-segments/${testMarketSegment._id}/toggle-status`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/market-segments/:marketSegmentId', () => {
    beforeEach(async () => {
      testMarketSegment = new MarketSegment({
        name: 'Test Delete Segment',
        status: 'active',
        createdBy: testUser._id
      });
      await testMarketSegment.save();
    });

    it('should delete market segment successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/market-segments/${testMarketSegment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should require authentication for delete', async () => {
      const response = await request(app)
        .delete(`/api/v1/market-segments/${testMarketSegment._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent market segment', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/v1/market-segments/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
}); 