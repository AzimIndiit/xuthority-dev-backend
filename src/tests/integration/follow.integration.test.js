const request = require('supertest');
const app = require('../../../app');
const { User, Follow } = require('../../models');
const bcrypt = require('bcrypt');

let userToken;
let targetUser;
let currentUser;

describe('Follow Toggle Integration Tests', () => {
  beforeEach(async () => {
    // Clean up existing data
    await User.deleteMany({});
    await Follow.deleteMany({});

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 4);
    
    currentUser = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: hashedPassword,
      role: 'user',
      authProvider: 'email',
      acceptedTerms: true
    });

    targetUser = await User.create({
      firstName: 'Jane',
      lastName: 'Smith',  
      email: 'jane@example.com',
      password: hashedPassword,
      role: 'user',
      authProvider: 'email',
      acceptedTerms: true
    });

    // Login current user
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'john@example.com',
        password: 'password123'
      });

    userToken = loginResponse.body.data.token;
  });

  describe('POST /api/v1/follow/toggle/:userId', () => {
    it('should follow a user when not already following', async () => {
      const response = await request(app)
        .post(`/api/v1/follow/toggle/${targetUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.action).toBe('followed');
      expect(response.body.data.isFollowing).toBe(true);
      expect(response.body.data.targetUser.followersCount).toBe(1);
      expect(response.body.message).toContain('Successfully followed Jane Smith');

      // Verify follow relationship was created
      const followExists = await Follow.exists({
        follower: currentUser._id,
        following: targetUser._id
      });
      expect(followExists).toBeTruthy();

      // Verify user counts were updated
      const updatedCurrentUser = await User.findById(currentUser._id);
      const updatedTargetUser = await User.findById(targetUser._id);
      
      expect(updatedCurrentUser.followingCount).toBe(1);
      expect(updatedTargetUser.followersCount).toBe(1);
    });

    it('should unfollow a user when already following', async () => {
      // First follow the user
      await Follow.create({
        follower: currentUser._id,
        following: targetUser._id
      });

      // Update user counts
      await User.findByIdAndUpdate(currentUser._id, { followingCount: 1 });
      await User.findByIdAndUpdate(targetUser._id, { followersCount: 1 });

      const response = await request(app)
        .post(`/api/v1/follow/toggle/${targetUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.action).toBe('unfollowed');
      expect(response.body.data.isFollowing).toBe(false);
      expect(response.body.data.targetUser.followersCount).toBe(0);
      expect(response.body.message).toContain('Successfully unfollowed Jane Smith');

      // Verify follow relationship was removed
      const followExists = await Follow.exists({
        follower: currentUser._id,
        following: targetUser._id
      });
      expect(followExists).toBeFalsy();

      // Verify user counts were updated
      const updatedCurrentUser = await User.findById(currentUser._id);
      const updatedTargetUser = await User.findById(targetUser._id);
      
      expect(updatedCurrentUser.followingCount).toBe(0);
      expect(updatedTargetUser.followersCount).toBe(0);
    });

    it('should return error when trying to follow self', async () => {
      const response = await request(app)
        .post(`/api/v1/follow/toggle/${currentUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Cannot follow yourself');
      expect(response.body.error.code).toBe('CANNOT_FOLLOW_SELF');
    });

    it('should return error when target user not found', async () => {
      const nonExistentUserId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .post(`/api/v1/follow/toggle/${nonExistentUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Target user not found');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/v1/follow/toggle/${targetUser._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should maintain correct counts with multiple toggle operations', async () => {
      // Follow
      await request(app)
        .post(`/api/v1/follow/toggle/${targetUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Unfollow
      await request(app)
        .post(`/api/v1/follow/toggle/${targetUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Follow again
      const response = await request(app)
        .post(`/api/v1/follow/toggle/${targetUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.action).toBe('followed');
      expect(response.body.data.isFollowing).toBe(true);
      expect(response.body.data.targetUser.followersCount).toBe(1);

      // Verify final state
      const updatedCurrentUser = await User.findById(currentUser._id);
      const updatedTargetUser = await User.findById(targetUser._id);
      
      expect(updatedCurrentUser.followingCount).toBe(1);
      expect(updatedTargetUser.followersCount).toBe(1);
    });
  });
});