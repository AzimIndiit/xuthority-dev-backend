const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../app');
const { User, Solution } = require('../../models');

describe('Solution Integration Tests', () => {
  let authToken;
  let testUser;
  let testSolution;

  beforeAll(async () => {
    // This will run once before all tests
  });

  beforeEach(async () => {
    // Clean solution collection before each test
    await Solution.deleteMany({});
    
    // Create test user with hashed password for each test
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'solution.test@example.com',
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
        email: 'solution.test@example.com', 
        password: 'Password123!' 
      });
    
    authToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser && testUser._id) {
      await User.findByIdAndDelete(testUser._id);
    }
    await Solution.deleteMany({});
  });

  describe('POST /api/v1/solutions', () => {
    it('should create new solution successfully', async () => {
      const solutionData = {
        name: 'Test Solution',
        status: 'active'
      };

      const response = await request(app)
        .post('/api/v1/solutions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(solutionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(solutionData.name);
      expect(response.body.data.status).toBe('active');
      expect(response.body.data.slug).toMatch(/^test-solution-\d+$/);
      expect(response.body.data.createdBy._id).toBe(testUser._id.toString());
      expect(response.body.message).toBe('Solution created successfully');
    });

    it('should create solution with default status when not provided', async () => {
      const solutionData = {
        name: 'Default Status Solution'
      };

      const response = await request(app)
        .post('/api/v1/solutions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(solutionData)
        .expect(201);

      expect(response.body.data.status).toBe('active');
    });

    it('should return 400 for duplicate solution name', async () => {
      const solutionData = {
        name: 'Duplicate Solution'
      };

      // Create first solution
      await request(app)
        .post('/api/v1/solutions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(solutionData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/v1/solutions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(solutionData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Solution name already exists');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/solutions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Solution name is required');
    });

    it('should return 400 for invalid solution name', async () => {
      const solutionData = {
        name: 'A' // Too short
      };

      const response = await request(app)
        .post('/api/v1/solutions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(solutionData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const solutionData = {
        name: 'Unauthorized Solution'
      };

      const response = await request(app)
        .post('/api/v1/solutions')
        .send(solutionData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/solutions', () => {
    beforeEach(async () => {
      // Create test solution data - let the model generate slugs
      const solutionList = [
        { name: 'Active Solution 1', status: 'active', createdBy: testUser._id },
        { name: 'Active Solution 2', status: 'active', createdBy: testUser._id },
        { name: 'Inactive Solution', status: 'inactive', createdBy: testUser._id },
        { name: 'Search Test Solution', status: 'active', createdBy: testUser._id }
      ];

      for (const solutionData of solutionList) {
        const solution = new Solution(solutionData);
        await solution.save();
      }
    });

    it('should get all solutions with default pagination', async () => {
      const response = await request(app)
        .get('/api/v1/solutions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(4);
      expect(response.body.meta.pagination.currentPage).toBe(1);
      expect(response.body.meta.pagination.totalItems).toBe(4);
      expect(response.body.message).toBe('Solutions retrieved successfully');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/solutions?page=1&limit=2')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.pagination.currentPage).toBe(1);
      expect(response.body.meta.pagination.itemsPerPage).toBe(2);
      expect(response.body.meta.pagination.totalPages).toBe(2);
      expect(response.body.meta.pagination.hasNextPage).toBe(true);
    });

    it('should support search functionality', async () => {
      const response = await request(app)
        .get('/api/v1/solutions?search=search test')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Search Test Solution');
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/v1/solutions?status=inactive')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('inactive');
    });

    it('should support sorting', async () => {
      const response = await request(app)
        .get('/api/v1/solutions?sortBy=name&sortOrder=asc')
        .expect(200);

      const names = response.body.data.map(s => s.name);
      expect(names).toEqual(names.sort());
    });

    it('should return 400 for invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/solutions?page=0')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/solutions/active', () => {
    beforeEach(async () => {
      const solutionList = [
        { name: 'Active Solution 1', status: 'active', createdBy: testUser._id },
        { name: 'Active Solution 2', status: 'active', createdBy: testUser._id },
        { name: 'Inactive Solution', status: 'inactive', createdBy: testUser._id }
      ];

      for (const solutionData of solutionList) {
        const solution = new Solution(solutionData);
        await solution.save();
      }
    });

    it('should get only active solutions', async () => {
      const response = await request(app)
        .get('/api/v1/solutions/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(s => s.status === 'active')).toBe(true);
      expect(response.body.message).toBe('Active solutions retrieved successfully');
    });
  });

  describe('GET /api/v1/solutions/:id', () => {
    beforeEach(async () => {
      testSolution = new Solution({
        name: 'Test Solution Detail',
        status: 'active',
        createdBy: testUser._id
      });
      await testSolution.save();
    });

    it('should get solution by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/solutions/${testSolution._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testSolution._id.toString());
      expect(response.body.data.name).toBe('Test Solution Detail');
      expect(response.body.data.createdBy._id).toBe(testUser._id.toString());
    });

    it('should return 404 for non-existent solution', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/solutions/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Solution not found');
    });

    it('should return 400 for invalid solution ID', async () => {
      const response = await request(app)
        .get('/api/v1/solutions/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/solutions/slug/:slug', () => {
    beforeEach(async () => {
      testSolution = new Solution({
        name: 'Test Solution Slug',
        status: 'active',
        createdBy: testUser._id
      });
      await testSolution.save();
    });

    it('should get solution by slug', async () => {
      const response = await request(app)
        .get(`/api/v1/solutions/slug/${testSolution.slug}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe(testSolution.slug);
      expect(response.body.data.name).toBe('Test Solution Slug');
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/api/v1/solutions/slug/non-existent-slug')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Solution not found');
    });
  });

  describe('PUT /api/v1/solutions/:id', () => {
    beforeEach(async () => {
      testSolution = new Solution({
        name: 'Original Solution',
        status: 'active',
        createdBy: testUser._id
      });
      await testSolution.save();
    });

    it('should update solution successfully', async () => {
      const updateData = {
        name: 'Updated Solution',
        status: 'inactive'
      };

      const response = await request(app)
        .put(`/api/v1/solutions/${testSolution._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Solution');
      expect(response.body.data.status).toBe('inactive');
      expect(response.body.message).toBe('Solution updated successfully');
    });

    it('should return 404 for non-existent solution', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/v1/solutions/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Solution not found');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/solutions/${testSolution._id}`)
        .send({ name: 'Updated' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/solutions/:id/toggle-status', () => {
    beforeEach(async () => {
      testSolution = new Solution({
        name: 'Status Toggle Solution',
        status: 'active',
        createdBy: testUser._id
      });
      await testSolution.save();
    });

    it('should toggle solution status from active to inactive', async () => {
      const response = await request(app)
        .patch(`/api/v1/solutions/${testSolution._id}/toggle-status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('inactive');
      expect(response.body.message).toBe('Solution status changed to inactive');
    });

    it('should toggle solution status from inactive to active', async () => {
      await Solution.findByIdAndUpdate(testSolution._id, { status: 'inactive' });

      const response = await request(app)
        .patch(`/api/v1/solutions/${testSolution._id}/toggle-status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
      expect(response.body.message).toBe('Solution status changed to active');
    });

    it('should return 404 for non-existent solution', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`/api/v1/solutions/${nonExistentId}/toggle-status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Solution not found');
    });
  });

  describe('DELETE /api/v1/solutions/:id', () => {
    beforeEach(async () => {
      testSolution = new Solution({
        name: 'Solution to Delete',
        status: 'active',
        createdBy: testUser._id
      });
      await testSolution.save();
    });

    it('should delete solution successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/solutions/${testSolution._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Solution deleted successfully');

      // Verify solution is deleted
      const deletedSolution = await Solution.findById(testSolution._id);
      expect(deletedSolution).toBeNull();
    });

    it('should return 404 for non-existent solution', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/v1/solutions/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Solution not found');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/solutions/${testSolution._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
}); 