const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../app');
const { User, Integration } = require('../../models');

describe('Integration Integration Tests', () => {
  let authToken;
  let testUser;
  let testIntegration;

  beforeEach(async () => {
    // Clean integration collection before each test
    await Integration.deleteMany({});
    
    // Create test user with hashed password for each test
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'integration.test@example.com',
      password: hashedPassword,
      role: 'admin',
      isVerified: true
    });

    // Login and get token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'integration.test@example.com',
        password: 'Password123!'
      });

    authToken = loginResponse.body.data.token;
  });

  afterEach(async () => {
    await Integration.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/v1/integrations', () => {
    it('should create a new integration successfully', async () => {
      const integrationData = {
        name: 'Slack',
        image: 'https://example.com/slack.png',
        status: 'active'
      };

      const response = await request(app)
        .post('/api/v1/integrations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(integrationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(integrationData.name);
      expect(response.body.data.image).toBe(integrationData.image);
      expect(response.body.data.status).toBe(integrationData.status);
      expect(response.body.data.slug).toMatch(/slack-\d+/);
      expect(response.body.data.createdBy).toBeDefined();
    });

    it('should create integration without image', async () => {
      const integrationData = {
        name: 'GitHub',
        status: 'active'
      };

      const response = await request(app)
        .post('/api/v1/integrations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(integrationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(integrationData.name);
      expect(response.body.data.image).toBeUndefined();
      expect(response.body.data.status).toBe(integrationData.status);
    });

    it('should return error when name is missing', async () => {
      const response = await request(app)
        .post('/api/v1/integrations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'active' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Integration name is required');
    });

    it('should return error when name already exists', async () => {
      // Create first integration
      const integration = new Integration({
        name: 'Discord',
        status: 'active',
        createdBy: testUser._id
      });
      await integration.save();

      // Try to create duplicate
      const response = await request(app)
        .post('/api/v1/integrations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Discord', status: 'active' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Integration name already exists');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/integrations')
        .send({ name: 'Zapier', status: 'active' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/integrations', () => {
    beforeEach(async () => {
      // Create test integration data
      const integrationList = [
        { name: 'Slack', image: 'https://example.com/slack.png', status: 'active', createdBy: testUser._id },
        { name: 'GitHub', image: 'https://example.com/github.png', status: 'active', createdBy: testUser._id },
        { name: 'Discord', status: 'inactive', createdBy: testUser._id },
        { name: 'Zapier', image: 'https://example.com/zapier.png', status: 'active', createdBy: testUser._id }
      ];

      for (const integrationData of integrationList) {
        const integration = new Integration(integrationData);
        await integration.save();
      }
    });

    it('should get all integrations with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/integrations')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(4);
      expect(response.body.meta.pagination).toBeDefined();
      expect(response.body.meta.pagination.totalItems).toBe(4);
    });

    it('should filter integrations by status', async () => {
      const response = await request(app)
        .get('/api/v1/integrations?status=active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.every(integration => integration.status === 'active')).toBe(true);
    });

    it('should search integrations by name', async () => {
      const response = await request(app)
        .get('/api/v1/integrations?search=git')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1); // GitHub
    });

    it('should paginate results correctly', async () => {
      const response = await request(app)
        .get('/api/v1/integrations?page=1&limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.pagination.currentPage).toBe(1);
      expect(response.body.meta.pagination.totalPages).toBe(2);
    });
  });

  describe('GET /api/v1/integrations/active', () => {
    beforeEach(async () => {
      const integrationList = [
        { name: 'Active Integration 1', status: 'active', createdBy: testUser._id },
        { name: 'Active Integration 2', status: 'active', createdBy: testUser._id },
        { name: 'Inactive Integration', status: 'inactive', createdBy: testUser._id }
      ];

      for (const integrationData of integrationList) {
        const integration = new Integration(integrationData);
        await integration.save();
      }
    });

    it('should get only active integrations', async () => {
      const response = await request(app)
        .get('/api/v1/integrations/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(integration => integration.status === 'active')).toBe(true);
    });
  });

  describe('GET /api/v1/integrations/:integrationId', () => {
    beforeEach(async () => {
      testIntegration = new Integration({
        name: 'Test Integration Detail',
        image: 'https://example.com/test.png',
        status: 'active',
        createdBy: testUser._id
      });
      await testIntegration.save();
    });

    it('should get integration by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/integrations/${testIntegration._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(testIntegration.name);
      expect(response.body.data._id.toString()).toBe(testIntegration._id.toString());
    });

    it('should return 404 for non-existent integration', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/integrations/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Integration not found');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/v1/integrations/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/integrations/slug/:slug', () => {
    beforeEach(async () => {
      testIntegration = new Integration({
        name: 'Test Slug Integration',
        status: 'active',
        createdBy: testUser._id
      });
      await testIntegration.save();
    });

    it('should get integration by slug', async () => {
      const response = await request(app)
        .get(`/api/v1/integrations/slug/${testIntegration.slug}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(testIntegration.name);
      expect(response.body.data.slug).toBe(testIntegration.slug);
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/api/v1/integrations/slug/non-existent-slug')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Integration not found');
    });
  });

  describe('PUT /api/v1/integrations/:integrationId', () => {
    beforeEach(async () => {
      testIntegration = new Integration({
        name: 'Test Update Integration',
        status: 'active',
        createdBy: testUser._id
      });
      await testIntegration.save();
    });

    it('should update integration successfully', async () => {
      const updateData = {
        name: 'Updated Integration Name',
        image: 'https://example.com/updated.png',
        status: 'inactive'
      };

      const response = await request(app)
        .put(`/api/v1/integrations/${testIntegration._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.image).toBe(updateData.image);
      expect(response.body.data.status).toBe(updateData.status);
    });

    it('should require authentication for update', async () => {
      const response = await request(app)
        .put(`/api/v1/integrations/${testIntegration._id}`)
        .send({ name: 'Updated Name' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent integration', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/v1/integrations/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/integrations/:integrationId/toggle-status', () => {
    beforeEach(async () => {
      testIntegration = new Integration({
        name: 'Test Toggle Integration',
        status: 'active',
        createdBy: testUser._id
      });
      await testIntegration.save();
    });

    it('should toggle integration status', async () => {
      const response = await request(app)
        .patch(`/api/v1/integrations/${testIntegration._id}/toggle-status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('inactive');
    });

    it('should require authentication for status toggle', async () => {
      const response = await request(app)
        .patch(`/api/v1/integrations/${testIntegration._id}/toggle-status`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/integrations/:integrationId', () => {
    beforeEach(async () => {
      testIntegration = new Integration({
        name: 'Test Delete Integration',
        status: 'active',
        createdBy: testUser._id
      });
      await testIntegration.save();
    });

    it('should delete integration successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/integrations/${testIntegration._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should require authentication for delete', async () => {
      const response = await request(app)
        .delete(`/api/v1/integrations/${testIntegration._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent integration', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/v1/integrations/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
}); 