const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../app');
const { User, Industry } = require('../../models');

describe('Industry Integration Tests', () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    await Industry.deleteMany({});
    
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'industry.test@example.com',
      password: hashedPassword,
      role: 'admin',
      acceptedTerms: true,
      isVerified: true
    });

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'industry.test@example.com',
        password: 'Password123!'
      });

    authToken = loginResponse.body.data.token;
  });

  afterEach(async () => {
    await Industry.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/v1/industries', () => {
    it('should create a new industry successfully', async () => {
      const industryData = {
        name: 'Software Development',
        category: 'software',
        status: 'active'
      };

      const response = await request(app)
        .post('/api/v1/industries')
        .set('Authorization', `Bearer ${authToken}`)
        .send(industryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(industryData.name);
      expect(response.body.data.category).toBe(industryData.category);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/industries')
        .send({ name: 'Manufacturing', category: 'solution', status: 'active' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/industries', () => {
    it('should get all industries', async () => {
      const response = await request(app)
        .get('/api/v1/industries')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });
});
