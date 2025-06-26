const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../app');
const { User, UserRole } = require('../../models');

describe('User Role Integration Tests', () => {
  let authToken;
  let testUser;
  let testUserRole;

  beforeEach(async () => {
    // Clean user role collection before each test
    await UserRole.deleteMany({});
    
    // Create test user with hashed password for each test
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'userrole.test@example.com',
      password: hashedPassword,
      role: 'admin',
      isVerified: true
    });

    // Login and get token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'userrole.test@example.com',
        password: 'Password123!'
      });

    authToken = loginResponse.body.data.token;
  });

  afterEach(async () => {
    await UserRole.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/v1/user-roles', () => {
    it('should create a new user role successfully', async () => {
      const userRoleData = {
        name: 'Project Manager',
        status: 'active'
      };

      const response = await request(app)
        .post('/api/v1/user-roles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userRoleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(userRoleData.name);
      expect(response.body.data.status).toBe(userRoleData.status);
      expect(response.body.data.slug).toMatch(/project-manager-\d+/);
      expect(response.body.data.createdBy).toBeDefined();
    });

    it('should return error when name is missing', async () => {
      const response = await request(app)
        .post('/api/v1/user-roles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'active' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User role name is required');
    });

    it('should return error when name already exists', async () => {
      // Create first user role
      const userRole = new UserRole({
        name: 'Developer',
        status: 'active',
        createdBy: testUser._id
      });
      await userRole.save();

      // Try to create duplicate
      const response = await request(app)
        .post('/api/v1/user-roles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Developer', status: 'active' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User role name already exists');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/user-roles')
        .send({ name: 'CEO', status: 'active' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/user-roles', () => {
    beforeEach(async () => {
      // Create test user role data
      const roleList = [
        { name: 'Project Manager', status: 'active', createdBy: testUser._id },
        { name: 'Developer', status: 'active', createdBy: testUser._id },
        { name: 'Designer', status: 'inactive', createdBy: testUser._id },
        { name: 'CEO', status: 'active', createdBy: testUser._id }
      ];

      for (const roleData of roleList) {
        const role = new UserRole(roleData);
        await role.save();
      }
    });

    it('should get all user roles with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/user-roles')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(4);
      expect(response.body.meta.pagination).toBeDefined();
      expect(response.body.meta.pagination.totalItems).toBe(4);
    });

    it('should filter user roles by status', async () => {
      const response = await request(app)
        .get('/api/v1/user-roles?status=active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.every(role => role.status === 'active')).toBe(true);
    });

    it('should search user roles by name', async () => {
      const response = await request(app)
        .get('/api/v1/user-roles?search=manager')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1); // Project Manager
    });

    it('should paginate results correctly', async () => {
      const response = await request(app)
        .get('/api/v1/user-roles?page=1&limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.pagination.currentPage).toBe(1);
      expect(response.body.meta.pagination.totalPages).toBe(2);
    });
  });

  describe('GET /api/v1/user-roles/active', () => {
    beforeEach(async () => {
      const roleList = [
        { name: 'Active Role 1', status: 'active', createdBy: testUser._id },
        { name: 'Active Role 2', status: 'active', createdBy: testUser._id },
        { name: 'Inactive Role', status: 'inactive', createdBy: testUser._id }
      ];

      for (const roleData of roleList) {
        const role = new UserRole(roleData);
        await role.save();
      }
    });

    it('should get only active user roles', async () => {
      const response = await request(app)
        .get('/api/v1/user-roles/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(role => role.status === 'active')).toBe(true);
    });
  });

  describe('GET /api/v1/user-roles/:userRoleId', () => {
    beforeEach(async () => {
      testUserRole = new UserRole({
        name: 'Test Role Detail',
        status: 'active',
        createdBy: testUser._id
      });
      await testUserRole.save();
    });

    it('should get user role by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/user-roles/${testUserRole._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(testUserRole.name);
      expect(response.body.data._id.toString()).toBe(testUserRole._id.toString());
    });

    it('should return 404 for non-existent user role', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/user-roles/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User role not found');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/v1/user-roles/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/user-roles/slug/:slug', () => {
    beforeEach(async () => {
      testUserRole = new UserRole({
        name: 'Test Slug Role',
        status: 'active',
        createdBy: testUser._id
      });
      await testUserRole.save();
    });

    it('should get user role by slug', async () => {
      const response = await request(app)
        .get(`/api/v1/user-roles/slug/${testUserRole.slug}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(testUserRole.name);
      expect(response.body.data.slug).toBe(testUserRole.slug);
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/api/v1/user-roles/slug/non-existent-slug')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User role not found');
    });
  });

  describe('PUT /api/v1/user-roles/:userRoleId', () => {
    beforeEach(async () => {
      testUserRole = new UserRole({
        name: 'Test Update Role',
        status: 'active',
        createdBy: testUser._id
      });
      await testUserRole.save();
    });

    it('should update user role successfully', async () => {
      const updateData = {
        name: 'Updated Role Name',
        status: 'inactive'
      };

      const response = await request(app)
        .put(`/api/v1/user-roles/${testUserRole._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.status).toBe(updateData.status);
    });

    it('should require authentication for update', async () => {
      const response = await request(app)
        .put(`/api/v1/user-roles/${testUserRole._id}`)
        .send({ name: 'Updated Name' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent user role', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/v1/user-roles/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/user-roles/:userRoleId/toggle-status', () => {
    beforeEach(async () => {
      testUserRole = new UserRole({
        name: 'Test Toggle Role',
        status: 'active',
        createdBy: testUser._id
      });
      await testUserRole.save();
    });

    it('should toggle user role status', async () => {
      const response = await request(app)
        .patch(`/api/v1/user-roles/${testUserRole._id}/toggle-status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('inactive');
    });

    it('should require authentication for status toggle', async () => {
      const response = await request(app)
        .patch(`/api/v1/user-roles/${testUserRole._id}/toggle-status`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/user-roles/:userRoleId', () => {
    beforeEach(async () => {
      testUserRole = new UserRole({
        name: 'Test Delete Role',
        status: 'active',
        createdBy: testUser._id
      });
      await testUserRole.save();
    });

    it('should delete user role successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/user-roles/${testUserRole._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should require authentication for delete', async () => {
      const response = await request(app)
        .delete(`/api/v1/user-roles/${testUserRole._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent user role', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/v1/user-roles/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
}); 