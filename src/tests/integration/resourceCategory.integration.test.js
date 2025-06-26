const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../app');
const { User, ResourceCategory } = require('../../models');

describe('Resource Category Integration Tests', () => {
  let adminToken;
  let userToken;
  let adminUser;
  let regularUser;

  beforeEach(async () => {
    // Clean up existing data
    await ResourceCategory.deleteMany({});
    await User.deleteMany({});
    
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    // Create admin user
    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@resourcecategory.test.com',
      password: hashedPassword,
      role: 'admin',
      acceptedTerms: true,
      isVerified: true
    });

    // Create regular user
    regularUser = await User.create({
      firstName: 'Regular',
      lastName: 'User',
      email: 'user@resourcecategory.test.com',
      password: hashedPassword,
      role: 'user',
      acceptedTerms: true,
      isVerified: true
    });

    // Get admin auth token
    const adminLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@resourcecategory.test.com',
        password: 'Password123!'
      });
    adminToken = adminLoginResponse.body.data.token;

    // Get user auth token
    const userLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user@resourcecategory.test.com',
        password: 'Password123!'
      });
    userToken = userLoginResponse.body.data.token;
  });

  afterEach(async () => {
    await ResourceCategory.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/v1/resource-categories', () => {
    const validCategoryData = {
      name: 'Technology Resources',
      status: 'active'
    };

    it('should create a new resource category successfully with admin role', async () => {
      const response = await request(app)
        .post('/api/v1/resource-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCategoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(validCategoryData.name);
      expect(response.body.data.slug).toBe('technology-resources');
      expect(response.body.data.status).toBe('active');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/resource-categories')
        .send(validCategoryData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .post('/api/v1/resource-categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validCategoryData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const invalidCategoryData = {};

      const response = await request(app)
        .post('/api/v1/resource-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidCategoryData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate name length', async () => {
      const invalidCategoryData = {
        name: 'A' // Too short
      };

      const response = await request(app)
        .post('/api/v1/resource-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidCategoryData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate status values', async () => {
      const invalidCategoryData = {
        name: 'Valid Name',
        status: 'invalid-status'
      };

      const response = await request(app)
        .post('/api/v1/resource-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidCategoryData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle duplicate names', async () => {
      // Create first category
      await ResourceCategory.create({
        name: 'Unique Name'
      });

      const duplicateData = {
        name: 'Unique Name'
      };

      const response = await request(app)
        .post('/api/v1/resource-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/resource-categories', () => {
    beforeEach(async () => {
      // Create test resource categories
      await ResourceCategory.create([
        {
          name: 'Technology',
          status: 'active'
        },
        {
          name: 'Business',
          status: 'inactive'
        },
        {
          name: 'Marketing',
          status: 'active'
        }
      ]);
    });

    it('should get all resource categories with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/resource-categories')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(3);
      expect(response.body.meta).toHaveProperty('pagination');
      expect(response.body.meta.total).toBe(3);
    });

    it('should filter resource categories by status', async () => {
      const response = await request(app)
        .get('/api/v1/resource-categories')
        .query({ status: 'active' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
      response.body.data.forEach(category => {
        expect(category.status).toBe('active');
      });
    });

    it('should search resource categories by name', async () => {
      const response = await request(app)
        .get('/api/v1/resource-categories')
        .query({ search: 'Tech' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Technology');
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/resource-categories')
        .query({ page: 0, limit: 101 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should sort by different fields', async () => {
      const response = await request(app)
        .get('/api/v1/resource-categories')
        .query({ sortBy: 'name', sortOrder: 'asc' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].name).toBe('Business');
      expect(response.body.data[1].name).toBe('Marketing');
      expect(response.body.data[2].name).toBe('Technology');
    });
  });

  describe('GET /api/v1/resource-categories/active', () => {
    beforeEach(async () => {
      await ResourceCategory.create([
        {
          name: 'Active Category 1',
          status: 'active'
        },
        {
          name: 'Inactive Category',
          status: 'inactive'
        },
        {
          name: 'Active Category 2',
          status: 'active'
        }
      ]);
    });

    it('should get only active resource categories', async () => {
      const response = await request(app)
        .get('/api/v1/resource-categories/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
      response.body.data.forEach(category => {
        expect(category.status).toBe('active');
      });
    });
  });

  describe('GET /api/v1/resource-categories/:id', () => {
    let testCategory;

    beforeEach(async () => {
      testCategory = await ResourceCategory.create({
        name: 'Test Category',
        status: 'active'
      });
    });

    it('should get resource category by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/resource-categories/${testCategory._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testCategory._id.toString());
      expect(response.body.data.name).toBe('Test Category');
    });

    it('should return 404 for non-existent resource category', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/resource-categories/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid ObjectId', async () => {
      const response = await request(app)
        .get('/api/v1/resource-categories/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/resource-categories/slug/:slug', () => {
    let testCategory;

    beforeEach(async () => {
      testCategory = await ResourceCategory.create({
        name: 'Test Category for Slugs',
        status: 'active'
      });
    });

    it('should get resource category by slug', async () => {
      const response = await request(app)
        .get(`/api/v1/resource-categories/slug/${testCategory.slug}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe(testCategory.slug);
      expect(response.body.data.name).toBe('Test Category for Slugs');
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/api/v1/resource-categories/slug/non-existent-slug')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should validate slug format', async () => {
      const response = await request(app)
        .get('/api/v1/resource-categories/slug/Invalid@Slug!')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/resource-categories/:id', () => {
    let testCategory;

    beforeEach(async () => {
      testCategory = await ResourceCategory.create({
        name: 'Original Category Name',
        status: 'active'
      });
    });

    it('should update resource category successfully with admin role', async () => {
      const updateData = {
        name: 'Updated Category Name',
        status: 'inactive'
      };

      const response = await request(app)
        .put(`/api/v1/resource-categories/${testCategory._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Category Name');
      expect(response.body.data.slug).toBe('updated-category-name');
      expect(response.body.data.status).toBe('inactive');
    });

    it('should require authentication for update', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put(`/api/v1/resource-categories/${testCategory._id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should require admin role for update', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put(`/api/v1/resource-categories/${testCategory._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should validate update data', async () => {
      const invalidUpdateData = {
        name: 'A' // Too short
      };

      const response = await request(app)
        .put(`/api/v1/resource-categories/${testCategory._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidUpdateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/resource-categories/:id/toggle-status', () => {
    let testCategory;

    beforeEach(async () => {
      testCategory = await ResourceCategory.create({
        name: 'Test Category',
        status: 'active'
      });
    });

    it('should toggle resource category status successfully with admin role', async () => {
      const response = await request(app)
        .patch(`/api/v1/resource-categories/${testCategory._id}/toggle-status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('inactive');
    });

    it('should toggle status from inactive to active', async () => {
      // First toggle to inactive
      await request(app)
        .patch(`/api/v1/resource-categories/${testCategory._id}/toggle-status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Then toggle back to active
      const response = await request(app)
        .patch(`/api/v1/resource-categories/${testCategory._id}/toggle-status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
    });

    it('should require authentication for toggle status', async () => {
      const response = await request(app)
        .patch(`/api/v1/resource-categories/${testCategory._id}/toggle-status`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should require admin role for toggle status', async () => {
      const response = await request(app)
        .patch(`/api/v1/resource-categories/${testCategory._id}/toggle-status`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/resource-categories/:id', () => {
    let testCategory;

    beforeEach(async () => {
      testCategory = await ResourceCategory.create({
        name: 'Test Category to Delete',
        status: 'active'
      });
    });

    it('should delete resource category successfully with admin role', async () => {
      const response = await request(app)
        .delete(`/api/v1/resource-categories/${testCategory._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify category is deleted
      const deletedCategory = await ResourceCategory.findById(testCategory._id);
      expect(deletedCategory).toBeNull();
    });

    it('should require authentication for delete', async () => {
      const response = await request(app)
        .delete(`/api/v1/resource-categories/${testCategory._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should require admin role for delete', async () => {
      const response = await request(app)
        .delete(`/api/v1/resource-categories/${testCategory._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent resource category', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/v1/resource-categories/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should validate ObjectId format', async () => {
      const response = await request(app)
        .delete('/api/v1/resource-categories/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/v1/resource-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing authorization header gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/resource-categories')
        .send({ name: 'Test Category' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle malformed authorization token', async () => {
      const response = await request(app)
        .post('/api/v1/resource-categories')
        .set('Authorization', 'Bearer invalid.token.here')
        .send({ name: 'Test Category' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
}); 