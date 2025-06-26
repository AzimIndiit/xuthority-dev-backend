const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../app');
const { User, Language } = require('../../models');

describe('Language Integration Tests', () => {
  let authToken;
  let testUser;
  let testLanguage;

  beforeEach(async () => {
    // Clean language collection before each test
    await Language.deleteMany({});
    
    // Create test user with hashed password for each test
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'language.test@example.com',
      password: hashedPassword,
      role: 'vendor',
      acceptedTerms: true,
      isVerified: true
    });

    // Login and get token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'language.test@example.com',
        password: 'Password123!'
      });

    authToken = loginResponse.body.data.token;
  });

  afterEach(async () => {
    await Language.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/v1/languages', () => {
    it('should create a new language successfully', async () => {
      const languageData = {
        name: 'JavaScript',
        status: 'active'
      };

      const response = await request(app)
        .post('/api/v1/languages')
        .set('Authorization', `Bearer ${authToken}`)
        .send(languageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(languageData.name);
      expect(response.body.data.status).toBe(languageData.status);
      expect(response.body.data.slug).toBe('javascript');
      expect(response.body.data.createdBy).toBeDefined();
    });

    it('should return error when name is missing', async () => {
      const response = await request(app)
        .post('/api/v1/languages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'active' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Language name is required');
    });

    it('should return error when name already exists', async () => {
      // Create first language
      const language = new Language({
        name: 'Python',
        status: 'active',
        createdBy: testUser._id
      });
      await language.save();

      // Try to create duplicate
      const response = await request(app)
        .post('/api/v1/languages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Python', status: 'active' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Language name already exists');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/languages')
        .send({ name: 'Java', status: 'active' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/languages', () => {
    beforeEach(async () => {
      // Create test language data - let the model generate slugs
      const languageList = [
        { name: 'JavaScript', status: 'active', createdBy: testUser._id },
        { name: 'Python', status: 'active', createdBy: testUser._id },
        { name: 'Java', status: 'inactive', createdBy: testUser._id },
        { name: 'Go Lang', status: 'active', createdBy: testUser._id }
      ];

      for (const languageData of languageList) {
        const language = new Language(languageData);
        await language.save();
      }
    });

    it('should get all languages with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/languages')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(4);
      expect(response.body.meta.pagination).toBeDefined();
      expect(response.body.meta.pagination.totalItems).toBe(4);
    });

    it('should filter languages by status', async () => {
      const response = await request(app)
        .get('/api/v1/languages?status=active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.every(lang => lang.status === 'active')).toBe(true);
    });

    it('should search languages by name', async () => {
      const response = await request(app)
        .get('/api/v1/languages?search=java')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2); // JavaScript and Java
    });

    it('should paginate results correctly', async () => {
      const response = await request(app)
        .get('/api/v1/languages?page=1&limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.pagination.currentPage).toBe(1);
      expect(response.body.meta.pagination.totalPages).toBe(2);
    });
  });

  describe('GET /api/v1/languages/active', () => {
    beforeEach(async () => {
      const languageList = [
        { name: 'Active Language 1', status: 'active', createdBy: testUser._id },
        { name: 'Active Language 2', status: 'active', createdBy: testUser._id },
        { name: 'Inactive Language', status: 'inactive', createdBy: testUser._id }
      ];

      for (const languageData of languageList) {
        const language = new Language(languageData);
        await language.save();
      }
    });

    it('should get only active languages', async () => {
      const response = await request(app)
        .get('/api/v1/languages/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(lang => lang.status === 'active')).toBe(true);
    });
  });

  describe('GET /api/v1/languages/:id', () => {
    beforeEach(async () => {
      testLanguage = new Language({
        name: 'Test Language Detail',
        status: 'active',
        createdBy: testUser._id
      });
      await testLanguage.save();
    });

    it('should get language by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/languages/${testLanguage._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testLanguage._id.toString());
      expect(response.body.data.name).toBe('Test Language Detail');
    });

    it('should return 404 for non-existent language', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/languages/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Language not found');
    });

    it('should return 400 for invalid language ID', async () => {
      const response = await request(app)
        .get('/api/v1/languages/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid language ID');
    });
  });

  describe('GET /api/v1/languages/slug/:slug', () => {
    beforeEach(async () => {
      testLanguage = new Language({
        name: 'Test Language Slug',
        status: 'active',
        createdBy: testUser._id
      });
      await testLanguage.save();
    });

    it('should get language by slug', async () => {
      const response = await request(app)
        .get(`/api/v1/languages/slug/${testLanguage.slug}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe(testLanguage.slug);
      expect(response.body.data.name).toBe('Test Language Slug');
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/api/v1/languages/slug/non-existent-slug')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Language not found');
    });
  });

  describe('PUT /api/v1/languages/:id', () => {
    beforeEach(async () => {
      testLanguage = new Language({
        name: 'Original Language',
        status: 'active',
        createdBy: testUser._id
      });
      await testLanguage.save();
    });

    it('should update language successfully', async () => {
      const updateData = {
        name: 'Updated Language',
        status: 'inactive'
      };

      const response = await request(app)
        .put(`/api/v1/languages/${testLanguage._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.status).toBe(updateData.status);
      expect(response.body.data.slug).toBe('updated-language');
    });

    it('should return 404 for non-existent language', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/v1/languages/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Language not found');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/languages/${testLanguage._id}`)
        .send({ name: 'Updated Name' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/languages/:id/toggle-status', () => {
    beforeEach(async () => {
      testLanguage = new Language({
        name: 'Status Toggle Language',
        status: 'active',
        createdBy: testUser._id
      });
      await testLanguage.save();
    });

    it('should toggle language status from active to inactive', async () => {
      const response = await request(app)
        .patch(`/api/v1/languages/${testLanguage._id}/toggle-status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('inactive');
    });

    it('should toggle language status from inactive to active', async () => {
      // First toggle to inactive
      await request(app)
        .patch(`/api/v1/languages/${testLanguage._id}/toggle-status`)
        .set('Authorization', `Bearer ${authToken}`);

      // Then toggle back to active
      const response = await request(app)
        .patch(`/api/v1/languages/${testLanguage._id}/toggle-status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .patch(`/api/v1/languages/${testLanguage._id}/toggle-status`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/languages/:id', () => {
    beforeEach(async () => {
      testLanguage = new Language({
        name: 'Language to Delete',
        status: 'active',
        createdBy: testUser._id
      });
      await testLanguage.save();
    });

    it('should delete language successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/languages/${testLanguage._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Language deleted successfully');

      // Verify language is deleted
      const deletedLanguage = await Language.findById(testLanguage._id);
      expect(deletedLanguage).toBeNull();
    });

    it('should return 404 for non-existent language', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/v1/languages/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Language not found');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/languages/${testLanguage._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
}); 