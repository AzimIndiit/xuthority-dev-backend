const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../app');
const { User, Software } = require('../../models');

describe('Software Integration Tests', () => {
  let authToken;
  let testUser;
  let testSoftware;

  beforeAll(async () => {
    // This will run once before all tests
  });

  beforeEach(async () => {
    // Clean software collection before each test
    await Software.deleteMany({});
    
    // Create test user with hashed password for each test
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'software.test@example.com',
      password: hashedPassword,
      isEmailVerified: true,
      role: 'user',
      acceptedTerms: true,
      authProvider: 'email'
    });

    // Login to get auth token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ 
        email: 'software.test@example.com', 
        password: 'Password123!' 
      });
    
    authToken = loginRes.body.data.token;
  });



  afterAll(async () => {
    // Clean up test data
    if (testUser && testUser._id) {
      await User.findByIdAndDelete(testUser._id);
    }
    await Software.deleteMany({});
  });

  describe('POST /api/v1/software', () => {
    it('should create new software successfully', async () => {
      const softwareData = {
        name: 'Test Software',
        status: 'active'
      };

      const response = await request(app)
        .post('/api/v1/software')
        .set('Authorization', `Bearer ${authToken}`)
        .send(softwareData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(softwareData.name);
      expect(response.body.data.status).toBe('active');
      expect(response.body.data.slug).toBe('test-software');
      expect(response.body.data.createdBy._id).toBe(testUser._id.toString());
      expect(response.body.message).toBe('Software created successfully');
    });

    it('should create software with default status when not provided', async () => {
      const softwareData = {
        name: 'Default Status Software'
      };

      const response = await request(app)
        .post('/api/v1/software')
        .set('Authorization', `Bearer ${authToken}`)
        .send(softwareData)
        .expect(201);

      expect(response.body.data.status).toBe('active');
    });

    it('should return 400 for duplicate software name', async () => {
      const softwareData = {
        name: 'Duplicate Software'
      };

      // Create first software
      await request(app)
        .post('/api/v1/software')
        .set('Authorization', `Bearer ${authToken}`)
        .send(softwareData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/v1/software')
        .set('Authorization', `Bearer ${authToken}`)
        .send(softwareData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Software name already exists');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/software')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Software name is required');
    });

    it('should return 400 for invalid software name', async () => {
      const softwareData = {
        name: 'A' // Too short
      };

      const response = await request(app)
        .post('/api/v1/software')
        .set('Authorization', `Bearer ${authToken}`)
        .send(softwareData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const softwareData = {
        name: 'Unauthorized Software'
      };

      const response = await request(app)
        .post('/api/v1/software')
        .send(softwareData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/software', () => {
    beforeEach(async () => {
      // Create test software data - let the model generate slugs
      const softwareList = [
        { name: 'Active Software 1', status: 'active', createdBy: testUser._id },
        { name: 'Active Software 2', status: 'active', createdBy: testUser._id },
        { name: 'Inactive Software', status: 'inactive', createdBy: testUser._id },
        { name: 'Search Test Software', status: 'active', createdBy: testUser._id }
      ];

      for (const softwareData of softwareList) {
        const software = new Software(softwareData);
        await software.save();
      }
    });

    it('should get all software with default pagination', async () => {
      const response = await request(app)
        .get('/api/v1/software')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(4);
      expect(response.body.meta.pagination.currentPage).toBe(1);
      expect(response.body.meta.pagination.totalItems).toBe(4);
      expect(response.body.message).toBe('Software retrieved successfully');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/software?page=1&limit=2')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.pagination.currentPage).toBe(1);
      expect(response.body.meta.pagination.itemsPerPage).toBe(2);
      expect(response.body.meta.pagination.totalPages).toBe(2);
      expect(response.body.meta.pagination.hasNextPage).toBe(true);
    });

    it('should support search functionality', async () => {
      const response = await request(app)
        .get('/api/v1/software?search=search test')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Search Test Software');
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/v1/software?status=inactive')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('inactive');
    });

    it('should support sorting', async () => {
      const response = await request(app)
        .get('/api/v1/software?sortBy=name&sortOrder=asc')
        .expect(200);

      const names = response.body.data.map(s => s.name);
      expect(names).toEqual(names.sort());
    });

    it('should return 400 for invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/software?page=0')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/software/active', () => {
    beforeEach(async () => {
      const softwareList = [
        { name: 'Active Software 1', status: 'active', createdBy: testUser._id },
        { name: 'Active Software 2', status: 'active', createdBy: testUser._id },
        { name: 'Inactive Software', status: 'inactive', createdBy: testUser._id }
      ];

      for (const softwareData of softwareList) {
        const software = new Software(softwareData);
        await software.save();
      }
    });

    it('should get only active software', async () => {
      const response = await request(app)
        .get('/api/v1/software/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(s => s.status === 'active')).toBe(true);
      expect(response.body.message).toBe('Active software retrieved successfully');
    });
  });

  describe('GET /api/v1/software/:id', () => {
    beforeEach(async () => {
      const software = new Software({
        name: 'Test Software Detail',
        status: 'active',
        createdBy: testUser._id
      });
      testSoftware = await software.save();
    });

    it('should get software by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/software/${testSoftware._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testSoftware._id.toString());
      expect(response.body.data.name).toBe('Test Software Detail');
      expect(response.body.data.createdBy._id).toBe(testUser._id.toString());
    });

    it('should return 404 for non-existent software', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/software/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Software not found');
    });

    it('should return 400 for invalid software ID', async () => {
      const response = await request(app)
        .get('/api/v1/software/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/software/slug/:slug', () => {
    beforeEach(async () => {
      const software = new Software({
        name: 'Test Software Slug',
        status: 'active',
        createdBy: testUser._id
      });
      testSoftware = await software.save();
    });

    it('should get software by slug', async () => {
      const response = await request(app)
        .get(`/api/v1/software/slug/${testSoftware.slug}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe(testSoftware.slug);
      expect(response.body.data.name).toBe('Test Software Slug');
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/api/v1/software/slug/non-existent-slug')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Software not found');
    });
  });

  describe('PUT /api/v1/software/:id', () => {
    beforeEach(async () => {
      const software = new Software({
        name: 'Original Software',
        status: 'active',
        createdBy: testUser._id
      });
      testSoftware = await software.save();
    });

    it('should update software successfully', async () => {
      const updateData = {
        name: 'Updated Software',
        status: 'inactive'
      };

      const response = await request(app)
        .put(`/api/v1/software/${testSoftware._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Software');
      expect(response.body.data.status).toBe('inactive');
      expect(response.body.message).toBe('Software updated successfully');
    });

    it('should return 404 for non-existent software', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/v1/software/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Software not found');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/software/${testSoftware._id}`)
        .send({ name: 'Updated' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/software/:id/toggle-status', () => {
    beforeEach(async () => {
      const software = new Software({
        name: 'Status Toggle Software',
        status: 'active',
        createdBy: testUser._id
      });
      testSoftware = await software.save();
    });

    it('should toggle software status from active to inactive', async () => {
      const response = await request(app)
        .patch(`/api/v1/software/${testSoftware._id}/toggle-status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('inactive');
      expect(response.body.message).toBe('Software status changed to inactive');
    });

    it('should toggle software status from inactive to active', async () => {
      await Software.findByIdAndUpdate(testSoftware._id, { status: 'inactive' });

      const response = await request(app)
        .patch(`/api/v1/software/${testSoftware._id}/toggle-status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
      expect(response.body.message).toBe('Software status changed to active');
    });

    it('should return 404 for non-existent software', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`/api/v1/software/${nonExistentId}/toggle-status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Software not found');
    });
  });

  describe('DELETE /api/v1/software/:id', () => {
    beforeEach(async () => {
      const software = new Software({
        name: 'Software to Delete',
        status: 'active',
        createdBy: testUser._id
      });
      testSoftware = await software.save();
    });

    it('should delete software successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/software/${testSoftware._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Software deleted successfully');

      // Verify software is deleted
      const deletedSoftware = await Software.findById(testSoftware._id);
      expect(deletedSoftware).toBeNull();
    });

    it('should return 404 for non-existent software', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/v1/software/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Software not found');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/software/${testSoftware._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
}); 