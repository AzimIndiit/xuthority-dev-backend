const request = require('supertest');
const app = require('../../../app');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../../models/User');
const Badge = require('../../models/Badge');
const UserBadge = require('../../models/UserBadge');

describe('Badge & UserBadge API Integration Tests', () => {
  let vendorToken, adminToken, vendorUser, adminUser, badge1, badge2;

  beforeEach(async () => {
    // Clear all data before each test
    await User.deleteMany({});
    await Badge.deleteMany({});
    await UserBadge.deleteMany({});

    // Hash password for test users
    const hashedPassword = await bcrypt.hash('TestPass123!', 10);

    // Create users
    vendorUser = await User.create({
      firstName: 'Vendor', 
      lastName: 'User', 
      email: 'vendor@test.com', 
      password: hashedPassword, 
      role: 'vendor', 
      acceptedTerms: true, 
      isVerified: true
    });
    adminUser = await User.create({
      firstName: 'Admin', 
      lastName: 'User', 
      email: 'admin@test.com', 
      password: hashedPassword, 
      role: 'admin', 
      acceptedTerms: true, 
      isVerified: true
    });

    // Login to get tokens
    const vendorLogin = await request(app).post('/api/v1/auth/login').send({ email: 'vendor@test.com', password: 'TestPass123!' });
    vendorToken = vendorLogin.body.data.token;
    const adminLogin = await request(app).post('/api/v1/auth/login').send({ email: 'admin@test.com', password: 'TestPass123!' });
    adminToken = adminLogin.body.data.token;

    // Create badges
    badge1 = await Badge.create({ title: 'High Performer', icon: 'icon1.png', colorCode: '#00FF00', description: 'Top badge', status: 'active' });
    badge2 = await Badge.create({ title: 'Spotlight', icon: 'icon2.png', colorCode: '#0000FF', description: 'Spotlight badge', status: 'active' });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Badge.deleteMany({});
    await UserBadge.deleteMany({});
  });

  it('should list all badges (public)', async () => {
    const res = await request(app).get('/api/v1/badges').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data[0]).toHaveProperty('title');
    expect(res.body.data[0]).toHaveProperty('icon');
    expect(res.body.data[0]).toHaveProperty('colorCode');
    expect(res.body.data[0]).toHaveProperty('requested');
    expect(res.body.data[0]).toHaveProperty('approved');
  });

  it('should show requested/approved flags for authenticated vendor', async () => {
    // Vendor requests badge1
    await request(app)
      .post('/api/v1/user-badges/request')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ badgeId: badge1._id, reason: 'I want this badge' })
      .expect(201);
    
    // List badges as vendor
    const res = await request(app)
      .get('/api/v1/badges')
      .set('Authorization', `Bearer ${vendorToken}`)
      .expect(200);
    
    const badge = res.body.data.find(b => b._id === badge1._id.toString());
    expect(badge.requested).toBe(true);
    expect(badge.approved).toBe(false);
  });

  it('should allow admin to approve a badge request', async () => {
    // Vendor requests badge1
    await request(app)
      .post('/api/v1/user-badges/request')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ badgeId: badge1._id, reason: 'I want this badge' })
      .expect(201);
    
    // Find the user badge request
    const userBadge = await UserBadge.findOne({ userId: vendorUser._id, badgeId: badge1._id });
    expect(userBadge).toBeTruthy();
    
    // Admin approves
    await request(app)
      .patch(`/api/v1/user-badges/${userBadge._id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    
    // List badges as vendor again
    const res = await request(app)
      .get('/api/v1/badges')
      .set('Authorization', `Bearer ${vendorToken}`)
      .expect(200);
    
    const badge = res.body.data.find(b => b._id === badge1._id.toString());
    expect(badge.requested).toBe(false);
    expect(badge.approved).toBe(true);
  });

  it('should not allow non-vendor to request a badge', async () => {
    const res = await request(app)
      .post('/api/v1/user-badges/request')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ badgeId: badge2._id, reason: 'I want this badge' });
    expect(res.status).toBe(403);
  });

  it('should not allow duplicate badge requests', async () => {
    // First request should succeed
    await request(app)
      .post('/api/v1/user-badges/request')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ badgeId: badge1._id, reason: 'First request' })
      .expect(201);
    
    // Second request for the same badge should fail
    const res = await request(app)
      .post('/api/v1/user-badges/request')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ badgeId: badge1._id, reason: 'Duplicate' });
    expect(res.status).toBe(400);
  });

  it('should allow vendor to cancel a badge request', async () => {
    // Vendor requests badge2
    await request(app)
      .post('/api/v1/user-badges/request')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ badgeId: badge2._id, reason: 'Cancel test' })
      .expect(201);
    
    // Find the user badge request
    const userBadge = await UserBadge.findOne({ userId: vendorUser._id, badgeId: badge2._id });
    expect(userBadge).toBeTruthy();
    
    // Vendor cancels
    await request(app)
      .patch(`/api/v1/user-badges/${userBadge._id}/cancel`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .expect(200);
    
    // List badges as vendor again
    const res = await request(app)
      .get('/api/v1/badges')
      .set('Authorization', `Bearer ${vendorToken}`)
      .expect(200);
    
    const badge = res.body.data.find(b => b._id === badge2._id.toString());
    expect(badge.requested).toBe(false);
    expect(badge.approved).toBe(false);
  });
}); 