const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../../../app');
const { Product, User, Language, Industry, Integration, MarketSegment, UserRole, Software, Solution } = require('../../models');

describe('Product API Integration Tests', () => {
  let userToken, vendorToken, customerToken;
  let testUser, vendorUser, customerUser;
  let testLanguage, testIndustry, testIntegration, testMarketSegment, testUserRole, testSoftware, testSolution;
  let testProduct;

  // Helper function to create test users and reference data
  const createTestData = async () => {
    // Create test users
    const hashedPassword = await bcrypt.hash('TestPass123!', 12);
    
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'user@test.com',
      password: hashedPassword,
      role: 'user',
      acceptedTerms: true,
      companyName: 'Test User Company'
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

    customerUser = await User.create({
      firstName: 'Test',
      lastName: 'Customer',
      email: 'customer@test.com',
      password: hashedPassword,
      role: 'user',
      acceptedTerms: true
    });

    // Generate tokens - using the same structure as auth controller
    userToken = jwt.sign({ id: testUser._id, email: testUser.email, role: testUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    vendorToken = jwt.sign({ id: vendorUser._id, email: vendorUser.email, role: vendorUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    customerToken = jwt.sign({ id: customerUser._id, email: customerUser.email, role: customerUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create test reference data
    testLanguage = await Language.create({
      name: 'JavaScript',
      status: 'active',
      createdBy: vendorUser._id
    });

    testIndustry = await Industry.create({
      name: 'Software Development',
      category: 'software',
      status: 'active',
      createdBy: vendorUser._id
    });

    testIntegration = await Integration.create({
      name: 'Slack',
      image: 'https://example.com/slack.png',
      status: 'active',
      createdBy: vendorUser._id
    });

    testMarketSegment = await MarketSegment.create({
      name: 'Small Business',
      status: 'active',
      createdBy: vendorUser._id
    });

    testUserRole = await UserRole.create({
      name: 'Developer',
      status: 'active',
      createdBy: vendorUser._id
    });

    testSoftware = await Software.create({
      name: 'Test Software',
      status: 'active',
      createdBy: vendorUser._id
    });

    testSolution = await Solution.create({
      name: 'Test Solution',
      status: 'active',
      createdBy: vendorUser._id
    });
  };

  describe('POST /api/v1/products', () => {
    beforeEach(async () => {
      await createTestData();
    });

    it('should create a product with all fields', async () => {
      const productData = {
        name: 'Test Product',
        description: 'This is a comprehensive test product with all fields',
        websiteUrl: 'https://testproduct.com',
        website: 'https://testproduct.com',
        softwareIds: [testSoftware._id],
        solutionIds: [testSolution._id],
        whoCanUse: [testUserRole._id],
        industries: [testIndustry._id],
        integrations: [testIntegration._id],
        languages: [testLanguage._id],
        marketSegment: [testMarketSegment._id],
        brandColors: '#FF0000',
        logoUrl: 'https://example.com/logo.png',
        mediaUrls: ['https://example.com/media1.png', 'https://example.com/media2.png'],
        features: {
          list: [
            { title: 'Feature 1', description: 'Description of feature 1' },
            { title: 'Feature 2', description: 'Description of feature 2' }
          ]
        },
        pricing: {
          plans: [
            {
              name: 'Basic',
              price: 29.99,
              currency: 'USD',
              billingPeriod: 'monthly',
              seats: 1,
              description: 'Basic plan for small teams'
            },
            {
              name: 'Pro',
              price: 99.99,
              currency: 'USD',
              billingPeriod: 'monthly',
              seats: 10,
              description: 'Pro plan for growing teams'
            }
          ]
        },
        keywords: ['test', 'product', 'software'],
        metaTitle: 'Test Product - The Best Solution',
        metaDescription: 'Test Product is the best solution for your needs',
        status: 'pending',
        isActive: 'active',
        isFeatured: false
      };

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(productData.name);
      expect(response.body.data.product.slug).toBe('test-product');
      expect(response.body.data.product.userId._id.toString()).toBe(vendorUser._id.toString());
      expect(response.body.data.product.status).toBe('pending');
      expect(response.body.data.product.isActive).toBe('active');
      expect(response.body.data.product.brandColors).toBe('#FF0000');
      expect(response.body.data.product.logoUrl).toBe('https://example.com/logo.png');
      expect(response.body.data.product.mediaUrls).toHaveLength(2);
      expect(response.body.data.product.features).toBeDefined();
      expect(response.body.data.product.pricing).toBeDefined();
      expect(response.body.data.product.keywords).toHaveLength(3);

      testProduct = response.body.data.product;
    });

    it('should create a product with minimal fields', async () => {
      const productData = {
        name: 'Minimal Product',
        description: 'This is a minimal test product with only required fields'
      };

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(productData.name);
      expect(response.body.data.product.slug).toBe('minimal-product');
      expect(response.body.data.product.userId._id.toString()).toBe(vendorUser._id.toString());
      expect(response.body.data.product.status).toBe('pending');
      expect(response.body.data.product.isActive).toBe('active');
    });

    it('should require authentication', async () => {
      const productData = {
        name: 'Test Product',
        description: 'This is a test product'
      };

      const response = await request(app)
        .post('/api/v1/products')
        .send(productData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should require name and description', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should not allow duplicate product names', async () => {
      const productData = {
        name: 'Duplicate Product',
        description: 'This is a test product'
      };

      // Create first product
      await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(productData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(productData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/products', () => {
    beforeEach(async () => {
      await createTestData();
    });

    it('should get all products with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta.pagination).toBeDefined();
    });

    it('should filter products by status', async () => {
      const response = await request(app)
        .get('/api/v1/products?status=published')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/v1/products/active', () => {
    beforeEach(async () => {
      await createTestData();
    });

    it('should get only active products', async () => {
      const response = await request(app)
        .get('/api/v1/products/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/v1/products/:id', () => {
    beforeEach(async () => {
      await createTestData();
    });

    it('should get product by ID', async () => {
      // Create a product for this test
      const productData = {
        name: 'Test Product for Get',
        description: 'This is a test product for getting by ID'
      };

      const createResponse = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(productData)
        .expect(201);

      const createdProduct = createResponse.body.data.product;

      console.log('Created Product ID:', createdProduct._id);
      console.log('Created Product:', createdProduct);

      // Verify database state
      const productInDb = await Product.findById(createdProduct._id);
      console.log('Product in DB:', productInDb);

      const response = await request(app)
        .get(`/api/v1/products/${createdProduct._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(createdProduct._id);
      expect(response.body.data.name).toBe(productData.name);
    });

    it('should get product by slug', async () => {
      // Create a product for this test
      const productData = {
        name: 'Test Product for Slug',
        description: 'This is a test product for getting by slug'
      };

      const createResponse = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(productData)
        .expect(201);

      const createdProduct = createResponse.body.data.product;

      const response = await request(app)
        .get(`/api/v1/products/slug/${createdProduct.slug}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe(createdProduct.slug);
      expect(response.body.data.name).toBe(productData.name);
    });

    it('should return 404 for non-existent product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/products/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/api/v1/products/slug/non-existent-slug')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/products/:id', () => {
    beforeEach(async () => {
      await createTestData();
    });

    it('should update product', async () => {
      // Create a product for this test
      const productData = {
        name: 'Test Product for Update',
        description: 'This is a test product for updating'
      };

      const createResponse = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(productData)
        .expect(201);

      const createdProduct = createResponse.body.data.product;

      const updateData = {
        name: 'Updated Product Name',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/v1/products/${createdProduct._id}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(updateData.name);
      expect(response.body.data.product.description).toBe(updateData.description);
    });

    it('should return 404 for non-existent product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = {
        name: 'Updated Name',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/v1/products/${nonExistentId}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication for update', async () => {
      // Create a product for this test
      const productData = {
        name: 'Test Product for Auth Test',
        description: 'This is a test product'
      };

      const createResponse = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(productData)
        .expect(201);

      const createdProduct = createResponse.body.data.product;

      const response = await request(app)
        .put(`/api/v1/products/${createdProduct._id}`)
        .send({ name: 'Updated Name' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    beforeEach(async () => {
      await createTestData();
    });

    it('should delete product', async () => {
      // Create a product for this test
      const productData = {
        name: 'Product to Delete',
        description: 'This product will be deleted'
      };

      const createResponse = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(productData)
        .expect(201);

      const productToDelete = createResponse.body.data.product;

      const response = await request(app)
        .delete(`/api/v1/products/${productToDelete._id}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`/api/v1/products/${nonExistentId}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication for delete', async () => {
      // Create a product for this test
      const productData = {
        name: 'Product for Auth Delete Test',
        description: 'This product tests auth for delete'
      };

      const createResponse = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(productData)
        .expect(201);

      const productToDelete = createResponse.body.data.product;

      const response = await request(app)
        .delete(`/api/v1/products/${productToDelete._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
}); 