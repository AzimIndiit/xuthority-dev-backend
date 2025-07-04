const request = require('supertest');
const app = require('../../../app');
const { Software, Product, User } = require('../../models');

describe('Software API Integration Tests', () => {
  let testUser;
  let testSoftware;
  let testProduct;
  let authToken;

  beforeAll(async () => {
    // Create a test user
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      role: 'admin',
      isVerified: true
    });

    // Create a test software
    testSoftware = await Software.create({
      name: 'Test Software',
      slug: 'test-software',
      status: 'active',
      createdBy: testUser._id
    });

    // Create a test product
    testProduct = await Product.create({
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test product description',
      softwareIds: [testSoftware._id],
      userId: testUser._id,
      status: 'published',
      isActive: 'active',
      avgRating: 4.5,
      totalReviews: 10
    });

    // Login to get auth token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteOne({ _id: testUser._id });
    await Software.deleteOne({ _id: testSoftware._id });
    await Product.deleteOne({ _id: testProduct._id });
  });

  describe('GET /api/v1/software', () => {
    it('should get all software', async () => {
      const res = await request(app)
        .get('/api/v1/software')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should search software by name', async () => {
      const res = await request(app)
        .get('/api/v1/software?search=Test')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/software/active', () => {
    it('should get active software only', async () => {
      const res = await request(app)
        .get('/api/v1/software/active')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/software/featured-with-products', () => {
    it('should get featured softwares with top products', async () => {
      const res = await request(app)
        .get('/api/v1/software/featured-with-products')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.productsPerSoftware).toBe(4);
      expect(res.body.meta.minRating).toBe(0);
      expect(res.body.pagination).toBeDefined();
    });

    it('should get featured softwares with custom parameters', async () => {
      const res = await request(app)
        .get('/api/v1/software/featured-with-products?productsPerSoftware=6&minRating=3.0&sortBy=avgRating&sortOrder=desc')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.meta.productsPerSoftware).toBe(6);
      expect(res.body.meta.minRating).toBe(3);
      expect(res.body.meta.sortBy).toBe('avgRating');
      expect(res.body.meta.sortOrder).toBe('desc');
    });

    it('should validate query parameters', async () => {
      const res = await request(app)
        .get('/api/v1/software/featured-with-products?productsPerSoftware=25&minRating=6')
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/software/:id', () => {
    it('should get software by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/software/${testSoftware._id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe('Test Software');
    });

    it('should return 404 for non-existent software', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/v1/software/${nonExistentId}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/software', () => {
    it('should create new software with auth', async () => {
      const softwareData = {
        name: 'New Test Software',
        status: 'active'
      };

      const res = await request(app)
        .post('/api/v1/software')
        .set('Authorization', `Bearer ${authToken}`)
        .send(softwareData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Test Software');

      // Clean up
      await Software.deleteOne({ _id: res.body.data._id });
    });

    it('should return 401 without auth', async () => {
      const softwareData = {
        name: 'Unauthorized Software',
        status: 'active'
      };

      const res = await request(app)
        .post('/api/v1/software')
        .send(softwareData)
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/software/:id', () => {
    it('should update software with auth', async () => {
      const updateData = {
        name: 'Updated Test Software',
        status: 'inactive'
      };

      const res = await request(app)
        .put(`/api/v1/software/${testSoftware._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Test Software');

      // Reset the software back to original state
      await Software.findByIdAndUpdate(testSoftware._id, {
        name: 'Test Software',
        status: 'active'
      });
    });
  });

  describe('DELETE /api/v1/software/:id', () => {
    it('should delete software with auth', async () => {
      // Create a software to delete
      const softwareToDelete = await Software.create({
        name: 'Software to Delete',
        slug: 'software-to-delete',
        status: 'active',
        createdBy: testUser._id
      });

      const res = await request(app)
        .delete(`/api/v1/software/${softwareToDelete._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify software was deleted
      const deletedSoftware = await Software.findById(softwareToDelete._id);
      expect(deletedSoftware).toBeNull();
    });
  });
}); 