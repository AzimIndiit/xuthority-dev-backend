const request = require('supertest');
const app = require('../../../app');
const User = require('../../models/User');

describe('Auth Integration', () => {
  // Generate unique emails for each test run to avoid conflicts
  const timestamp = Date.now();
  const user = {
    firstName: 'User',
    lastName: 'One',
    email: `user${timestamp}@example.com`,
    password: 'UserPass123!',
    acceptedTerms: true,
    acceptedMarketing: false
  };

  const vendor = {
    firstName: 'Vendor',
    lastName: 'One',
    email: `vendor${timestamp}@example.com`,
    password: 'VendorPass123!',
    companyName: 'Company One',
    companyEmail: `company${timestamp}@example.com`,
    industry: 'Technology',
    companySize: '51-100 Employees',
    acceptedTerms: 'true', // string as expected by the controller
    acceptedMarketing: 'false'
  };

  let userToken;
  let vendorToken;
  let testUserId;
  let testVendorId;

  describe('User Registration and Authentication', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(user)
        .expect(201);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(user.email);
      expect(res.body.data.user.role).toBe('user');
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.user.accessToken).toBeDefined();
      testUserId = res.body.data.user._id;
    });

         it('should login as user', async () => {
       // Create user first since database is cleared between tests
       const createdUser = await User.create({
         ...user,
         password: await require('bcrypt').hash(user.password, 4),
         role: 'user',
         authProvider: 'email'
       });
       testUserId = createdUser._id;

       const res = await request(app)
         .post('/api/v1/auth/login')
         .send({ email: user.email, password: user.password })
         .expect(200);
       
       expect(res.body.success).toBe(true);
       expect(res.body.data.token).toBeDefined();
       userToken = res.body.data.token;
     });

    it('should get current user profile', async () => {
      // Create user and get token first
      const hashedPassword = await require('bcrypt').hash(user.password, 4);
      const testUser = await User.create({
        ...user,
        password: hashedPassword,
        role: 'user',
        authProvider: 'email',
        region: 'US',
        description: 'Test user description'
      });
      testUserId = testUser._id;

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: user.password });
      
      const token = loginRes.body.data.token;

      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.user._id).toBe(testUser._id.toString());
      expect(res.body.data.user.email).toBe(user.email);
      expect(res.body.data.user.firstName).toBe(user.firstName);
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.user.accessToken).toBeUndefined();
      expect(res.body.message).toBe('Profile retrieved successfully');
    });

    it('should not get profile without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile')
        .expect(401);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Authentication required');
    });

    it('should not get profile with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Authentication required');
    });

         it('should update user profile', async () => {
       // Create user and get token first
       const hashedPassword = await require('bcrypt').hash(user.password, 4);
       const testUser = await User.create({
         ...user,
         password: hashedPassword,
         role: 'user',
         authProvider: 'email'
       });

       const loginRes = await request(app)
         .post('/api/v1/auth/login')
         .send({ email: user.email, password: user.password });
       
       const token = loginRes.body.data.token;

       const updatedName = 'Updated User';
       const res = await request(app)
         .patch('/api/v1/users/profile')
         .set('Authorization', `Bearer ${token}`)
         .send({ firstName: updatedName })
         .expect(200);
       
       expect(res.body.success).toBe(true);
       expect(res.body.data.user.firstName).toBe(updatedName);
     });

         it('should not register user with existing email', async () => {
       // Create user first
       await User.create({
         ...user,
         password: await require('bcrypt').hash(user.password, 4),
         role: 'user',
         authProvider: 'email'
       });

       const res = await request(app)
         .post('/api/v1/auth/register')
         .send(user)
         .expect(400);
       
       expect(res.body.success).toBe(false);
       expect(res.body.error.code).toBe('USER_ALREADY_EXISTS');
     });

         it('should not login with invalid credentials', async () => {
       // Create user first
       await User.create({
         ...user,
         password: await require('bcrypt').hash(user.password, 4),
         role: 'user',
         authProvider: 'email'
       });

       const res = await request(app)
         .post('/api/v1/auth/login')
         .send({ email: user.email, password: 'wrongpassword' })
         .expect(401);
       
       expect(res.body.success).toBe(false);
       expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
     });
  });

  describe('Public Profile Access', () => {
    it('should get any user public profile', async () => {
      // Create a user to get their public profile
      const hashedPassword = await require('bcrypt').hash(user.password, 4);
      const testUser = await User.create({
        ...user,
        password: hashedPassword,
        role: 'user',
        authProvider: 'email',
        region: 'US',
        description: 'Public test user',
        industry: 'Technology',
        title: 'Developer'
      });

      const res = await request(app)
        .get(`/api/v1/users/public-profile/${testUser._id}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.user._id).toBe(testUser._id.toString());
      expect(res.body.data.user.firstName).toBe(user.firstName);
      expect(res.body.data.user.lastName).toBe(user.lastName);
      expect(res.body.data.user.email).toBe(user.email);
      expect(res.body.data.user.userType).toBe('user');
      expect(res.body.data.user.region).toBe('US');
      expect(res.body.data.user.description).toBe('Public test user');
      
      // Sensitive data should not be included
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.user.accessToken).toBeUndefined();
      expect(res.body.data.user.acceptedMarketing).toBeUndefined();
      expect(res.body.data.user.acceptedTerms).toBeUndefined();
      expect(res.body.data.user.authProvider).toBeUndefined();
      expect(res.body.data.user.companyEmail).toBeUndefined();
      
      expect(res.body.message).toBe('Public profile retrieved successfully');
    });

    it('should get vendor public profile', async () => {
      // Create a vendor to get their public profile
      const hashedPassword = await require('bcrypt').hash(vendor.password, 4);
      const testVendor = await User.create({
        ...vendor,
        password: hashedPassword,
        role: 'vendor',
        authProvider: 'email',
        acceptedTerms: true,
        acceptedMarketing: false,
        region: 'US',
        description: 'Public test vendor'
      });

      const res = await request(app)
        .get(`/api/v1/users/public-profile/${testVendor._id}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.user._id).toBe(testVendor._id.toString());
      expect(res.body.data.user.firstName).toBe(vendor.firstName);
      expect(res.body.data.user.userType).toBe('vendor');
      expect(res.body.data.user.companyName).toBe(vendor.companyName);
      expect(res.body.data.user.industry).toBe(vendor.industry);
      
      // Sensitive vendor data should not be included
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.user.companyEmail).toBeUndefined();
      expect(res.body.data.user.acceptedMarketing).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/v1/users/public-profile/${nonExistentId}`)
        .expect(404);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
      expect(res.body.error.message).toBe('User not found');
    });

    it('should return 400 for invalid user ID format', async () => {
      const invalidId = 'invalid-id';
      const res = await request(app)
        .get(`/api/v1/users/public-profile/${invalidId}`)
        .expect(400);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'userId',
            msg: 'Invalid user ID format. Must be a valid MongoDB ObjectId'
          })
        ])
      );
    });

    it('should work without authentication (public endpoint)', async () => {
      // Create a user to get their public profile
      const hashedPassword = await require('bcrypt').hash(user.password, 4);
      const testUser = await User.create({
        ...user,
        email: `public${timestamp}@example.com`, // Use unique email
        password: hashedPassword,
        role: 'user',
        authProvider: 'email'
      });

      // Access public profile without authentication
      const res = await request(app)
        .get(`/api/v1/users/public-profile/${testUser._id}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.user._id).toBe(testUser._id.toString());
    });
  });

  describe('Vendor Registration and Authentication', () => {
    it('should register a new vendor', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register-vendor')
        .send(vendor)
        .expect(201);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(vendor.email);
      expect(res.body.data.user.role).toBe('vendor');
      expect(res.body.data.user.companyName).toBe(vendor.companyName);
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.token).toBeDefined();
      testVendorId = res.body.data.user._id;
    });

         it('should login as vendor', async () => {
       // Create vendor first
       const createdVendor = await User.create({
         ...vendor,
         password: await require('bcrypt').hash(vendor.password, 4),
         role: 'vendor',
         authProvider: 'email',
         acceptedTerms: true,
         acceptedMarketing: false
       });
       testVendorId = createdVendor._id;

       const res = await request(app)
         .post('/api/v1/auth/login')
         .send({ email: vendor.email, password: vendor.password })
         .expect(200);
       
       expect(res.body.success).toBe(true);
       expect(res.body.data.token).toBeDefined();
       vendorToken = res.body.data.token;
     });

    it('should get vendor profile', async () => {
      // Create vendor and get token first
      const hashedPassword = await require('bcrypt').hash(vendor.password, 4);
      const testVendor = await User.create({
        ...vendor,
        password: hashedPassword,
        role: 'vendor',
        authProvider: 'email',
        acceptedTerms: true,
        acceptedMarketing: false
      });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: vendor.email, password: vendor.password });
      
      const token = loginRes.body.data.token;

      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.user._id).toBe(testVendor._id.toString());
      expect(res.body.data.user.email).toBe(vendor.email);
      expect(res.body.data.user.role).toBe('vendor');
      expect(res.body.data.user.companyName).toBe(vendor.companyName);
      expect(res.body.data.user.companyEmail).toBe(vendor.companyEmail);
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.user.accessToken).toBeUndefined();
    });

         it('should update vendor profile', async () => {
       // Create vendor and get token first
       const hashedPassword = await require('bcrypt').hash(vendor.password, 4);
       const testVendor = await User.create({
         ...vendor,
         password: hashedPassword,
         role: 'vendor',
         authProvider: 'email',
         acceptedTerms: true,
         acceptedMarketing: false
       });

       const loginRes = await request(app)
         .post('/api/v1/auth/login')
         .send({ email: vendor.email, password: vendor.password });
       
       const token = loginRes.body.data.token;

       const updatedName = 'Updated Vendor';
       const res = await request(app)
         .patch('/api/v1/users/profile')
         .set('Authorization', `Bearer ${token}`)
         .send({ firstName: updatedName })
         .expect(200);
       
       expect(res.body.success).toBe(true);
       expect(res.body.data.user.firstName).toBe(updatedName);
     });
  });

  describe('Password Change', () => {
    it('should change password successfully with valid data', async () => {
      // Create user and get token first
      const hashedPassword = await require('bcrypt').hash(user.password, 4);
      const testUser = await User.create({
        ...user,
        email: `change-pwd-${timestamp}@example.com`,
        password: hashedPassword,
        role: 'user',
        authProvider: 'email'
      });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: user.password });
      
      const token = loginRes.body.data.token;
      const newPassword = 'NewPassword123!';

      const res = await request(app)
        .patch('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: user.password,
          newPassword: newPassword,
          confirmNewPassword: newPassword
        })
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Password changed successfully');

      // Verify old password no longer works
      const oldPasswordLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: user.password })
        .expect(401);
      
      expect(oldPasswordLoginRes.body.success).toBe(false);

      // Verify new password works
      const newPasswordLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: newPassword })
        .expect(200);
      
      expect(newPasswordLoginRes.body.success).toBe(true);
    });

    it('should not change password without authentication', async () => {
      const res = await request(app)
        .patch('/api/v1/users/change-password')
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
          confirmNewPassword: 'NewPassword123!'
        })
        .expect(401);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Authentication required');
    });

    it('should not change password with invalid current password', async () => {
      // Create user and get token first
      const hashedPassword = await require('bcrypt').hash(user.password, 4);
      const testUser = await User.create({
        ...user,
        email: `change-pwd-invalid-${timestamp}@example.com`,
        password: hashedPassword,
        role: 'user',
        authProvider: 'email'
      });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: user.password });
      
      const token = loginRes.body.data.token;

      const res = await request(app)
        .patch('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!',
          confirmNewPassword: 'NewPassword123!'
        })
        .expect(400);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CURRENT_PASSWORD');
      expect(res.body.error.message).toBe('Current password is incorrect');
    });

    it('should not allow same password as new password', async () => {
      // Create user and get token first
      const hashedPassword = await require('bcrypt').hash(user.password, 4);
      const testUser = await User.create({
        ...user,
        email: `change-pwd-same-${timestamp}@example.com`,
        password: hashedPassword,
        role: 'user',
        authProvider: 'email'
      });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: user.password });
      
      const token = loginRes.body.data.token;

      const res = await request(app)
        .patch('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: user.password,
          newPassword: user.password,
          confirmNewPassword: user.password
        })
        .expect(400);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SAME_PASSWORD_NOT_ALLOWED');
      expect(res.body.error.message).toBe('New password must be different from current password');
    });

    it('should validate password confirmation mismatch', async () => {
      // Create user and get token first
      const hashedPassword = await require('bcrypt').hash(user.password, 4);
      const testUser = await User.create({
        ...user,
        email: `change-pwd-mismatch-${timestamp}@example.com`,
        password: hashedPassword,
        role: 'user',
        authProvider: 'email'
      });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: user.password });
      
      const token = loginRes.body.data.token;

      const res = await request(app)
        .patch('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: user.password,
          newPassword: 'NewPassword123!',
          confirmNewPassword: 'DifferentPassword123!'
        })
        .expect(400);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'confirmNewPassword',
            msg: 'Password confirmation does not match new password'
          })
        ])
      );
    });


    it('should validate minimum password length', async () => {
      // Create user and get token first
      const hashedPassword = await require('bcrypt').hash(user.password, 4);
      const testUser = await User.create({
        ...user,
        email: `change-pwd-short-${timestamp}@example.com`,
        password: hashedPassword,
        role: 'user',
        authProvider: 'email'
      });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: user.password });
      
      const token = loginRes.body.data.token;

      const res = await request(app)
        .patch('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: user.password,
          newPassword: 'Abc1!',
          confirmNewPassword: 'Abc1!'
        })
        .expect(400);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'newPassword',
            msg: 'New password must be between 8 and 128 characters'
          })
        ])
      );
    });

    it('should validate required fields', async () => {
      // Create user and get token first
      const hashedPassword = await require('bcrypt').hash(user.password, 4);
      const testUser = await User.create({
        ...user,
        email: `change-pwd-required-${timestamp}@example.com`,
        password: hashedPassword,
        role: 'user',
        authProvider: 'email'
      });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: user.password });
      
      const token = loginRes.body.data.token;

      const res = await request(app)
        .patch('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      
      const errorMessages = res.body.error.details.errors.map(err => err.msg);
      expect(errorMessages).toContain('Current password is required');
      expect(errorMessages).toContain('New password must be between 8 and 128 characters');
      expect(errorMessages).toContain('Password confirmation is required');
    });

    it('should change vendor password successfully', async () => {
      // Create vendor and get token first
      const hashedPassword = await require('bcrypt').hash(vendor.password, 4);
      const testVendor = await User.create({
        ...vendor,
        email: `change-pwd-vendor-${timestamp}@example.com`,
        password: hashedPassword,
        role: 'vendor',
        authProvider: 'email',
        acceptedTerms: true,
        acceptedMarketing: false
      });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testVendor.email, password: vendor.password });
      
      const token = loginRes.body.data.token;
      const newPassword = 'NewVendorPassword123!';

      const res = await request(app)
        .patch('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: vendor.password,
          newPassword: newPassword,
          confirmNewPassword: newPassword
        })
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Password changed successfully');

      // Verify new password works for vendor
      const newPasswordLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testVendor.email, password: newPassword })
        .expect(200);
      
      expect(newPasswordLoginRes.body.success).toBe(true);
      expect(newPasswordLoginRes.body.data.user.role).toBe('vendor');
         });
   });

   describe('Forgot Password', () => {
     it('should accept forgot password request for existing user', async () => {
       // Create user first
       const hashedPassword = await require('bcrypt').hash(user.password, 4);
       const testUser = await User.create({
         ...user,
         email: `forgot-pwd-${timestamp}@example.com`,
         password: hashedPassword,
         role: 'user',
         authProvider: 'email'
       });

       const res = await request(app)
         .post('/api/v1/auth/forgot-password')
         .send({
           email: testUser.email
         })
         .expect(200);
       
       expect(res.body.success).toBe(true);
       expect(res.body.message).toContain('If this email exists in our system');

       // Verify reset token was set in database
       const updatedUser = await User.findById(testUser._id);
       expect(updatedUser.passwordResetToken).toBeDefined();
       expect(updatedUser.passwordResetExpires).toBeDefined();
       expect(updatedUser.passwordResetAttempts).toBe(1);
     });

     it('should accept forgot password request for non-existing user (security)', async () => {
       const res = await request(app)
         .post('/api/v1/auth/forgot-password')
         .send({
           email: 'nonexistent@example.com'
         })
         .expect(200);
       
       expect(res.body.success).toBe(true);
       expect(res.body.message).toContain('If this email exists in our system');
     });

     it('should validate email format for forgot password', async () => {
       const res = await request(app)
         .post('/api/v1/auth/forgot-password')
         .send({
           email: 'invalid-email'
         })
         .expect(400);
       
       expect(res.body.success).toBe(false);
       expect(res.body.error.code).toBe('VALIDATION_ERROR');
       expect(res.body.error.details.email.msg).toContain('Valid email address is required');
     });

     it('should reject forgot password for OAuth users', async () => {
       // Create OAuth user (no password)
       const oauthUser = await User.create({
         firstName: 'OAuth',
         lastName: 'User',
         email: `oauth-${timestamp}@example.com`,
         role: 'user',
         authProvider: 'google',
         acceptedTerms: true
       });

       const res = await request(app)
         .post('/api/v1/auth/forgot-password')
         .send({
           email: oauthUser.email
         })
         .expect(400);
       
       expect(res.body.success).toBe(false);
       expect(res.body.error.code).toBe('OAUTH_RESET_NOT_ALLOWED');
     });

     it('should require email field', async () => {
       const res = await request(app)
         .post('/api/v1/auth/forgot-password')
         .send({})
         .expect(400);
       
       expect(res.body.success).toBe(false);
       expect(res.body.error.code).toBe('VALIDATION_ERROR');
       expect(res.body.error.details.email.msg).toContain('Valid email address is required');
     });
   });

   describe('Verify Reset Token', () => {
     let resetToken;
     let testUser;

     beforeEach(async () => {
       // Create user and generate reset token
       const hashedPassword = await require('bcrypt').hash(user.password, 4);
       testUser = await User.create({
         ...user,
         email: `verify-token-${timestamp}-${Date.now()}@example.com`,
         password: hashedPassword,
         role: 'user',
         authProvider: 'email'
       });

       // Simulate forgot password to get token
       const crypto = require('crypto');
       resetToken = crypto.randomBytes(32).toString('hex');
       const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
       
       await User.findByIdAndUpdate(testUser._id, {
         passwordResetToken: resetTokenHash,
         passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
       });
     });

     it('should verify valid reset token', async () => {
       const res = await request(app)
         .post('/api/v1/auth/verify-reset-token')
         .send({
           token: resetToken
         })
         .expect(200);
       
       expect(res.body.success).toBe(true);
       expect(res.body.data.userId).toBe(testUser._id.toString());
       expect(res.body.data.firstName).toBe(testUser.firstName);
       expect(res.body.data.lastName).toBe(testUser.lastName);
       expect(res.body.data.email).toBe(testUser.email);
       expect(res.body.data.expiresAt).toBeDefined();
     });

           it('should reject invalid reset token', async () => {
        const res = await request(app)
          .post('/api/v1/auth/verify-reset-token')
          .send({
            token: 'invalidtokenthatisexactly64characterslongbutdefinitelynotvalid12'
          })
          .expect(400);
        
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('INVALID_RESET_TOKEN');
      });

     it('should reject expired reset token', async () => {
       // Update token to be expired
       await User.findByIdAndUpdate(testUser._id, {
         passwordResetExpires: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
       });

       const res = await request(app)
         .post('/api/v1/auth/verify-reset-token')
         .send({
           token: resetToken
         })
         .expect(400);
       
       expect(res.body.success).toBe(false);
       expect(res.body.error.code).toBe('INVALID_RESET_TOKEN');
     });

     it('should validate token format', async () => {
       const res = await request(app)
         .post('/api/v1/auth/verify-reset-token')
         .send({
           token: 'short-token'
         })
         .expect(400);
       
       expect(res.body.success).toBe(false);
       expect(res.body.error.code).toBe('VALIDATION_ERROR');
     });

     it('should require token field', async () => {
       const res = await request(app)
         .post('/api/v1/auth/verify-reset-token')
         .send({})
         .expect(400);
       
       expect(res.body.success).toBe(false);
       expect(res.body.error.code).toBe('VALIDATION_ERROR');
     });
   });

   describe('Reset Password', () => {
     let resetToken;
     let testUser;

     beforeEach(async () => {
       // Create user and generate reset token
       const hashedPassword = await require('bcrypt').hash(user.password, 4);
       testUser = await User.create({
         ...user,
         email: `reset-pwd-${timestamp}-${Date.now()}@example.com`,
         password: hashedPassword,
         role: 'user',
         authProvider: 'email'
       });

       // Simulate forgot password to get token
       const crypto = require('crypto');
       resetToken = crypto.randomBytes(32).toString('hex');
       const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
       
       await User.findByIdAndUpdate(testUser._id, {
         passwordResetToken: resetTokenHash,
         passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
       });
     });

     it('should reset password with valid token', async () => {
       const newPassword = 'NewValidPassword123!';
       
       const res = await request(app)
         .post('/api/v1/auth/reset-password')
         .send({
           token: resetToken,
           newPassword: newPassword,
           confirmNewPassword: newPassword
         })
         .expect(200);
       
       expect(res.body.success).toBe(true);
       expect(res.body.message).toContain('Password has been reset successfully');

       // Verify reset fields are cleared
       const updatedUser = await User.findById(testUser._id);
       expect(updatedUser.passwordResetToken).toBeUndefined();
       expect(updatedUser.passwordResetExpires).toBeUndefined();

       // Verify old password no longer works
       const oldPasswordLoginRes = await request(app)
         .post('/api/v1/auth/login')
         .send({ email: testUser.email, password: user.password })
         .expect(401);
       
       expect(oldPasswordLoginRes.body.success).toBe(false);

       // Verify new password works
       const newPasswordLoginRes = await request(app)
         .post('/api/v1/auth/login')
         .send({ email: testUser.email, password: newPassword })
         .expect(200);
       
       expect(newPasswordLoginRes.body.success).toBe(true);
     });

           it('should reject invalid reset token', async () => {
        const res = await request(app)
          .post('/api/v1/auth/reset-password')
          .send({
            token: 'invalidtokenthatisexactly64characterslongbutdefinitelynotvalid12',
            newPassword: 'NewValidPassword123!',
            confirmNewPassword: 'NewValidPassword123!'
          })
          .expect(400);
        
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('INVALID_RESET_TOKEN');
      });

     it('should reject expired reset token', async () => {
       // Update token to be expired
       await User.findByIdAndUpdate(testUser._id, {
         passwordResetExpires: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
       });

       const res = await request(app)
         .post('/api/v1/auth/reset-password')
         .send({
           token: resetToken,
           newPassword: 'NewValidPassword123!',
           confirmNewPassword: 'NewValidPassword123!'
         })
         .expect(400);
       
       expect(res.body.success).toBe(false);
       expect(res.body.error.code).toBe('INVALID_RESET_TOKEN');
     });

     it('should not allow same password as current', async () => {
       const res = await request(app)
         .post('/api/v1/auth/reset-password')
         .send({
           token: resetToken,
           newPassword: user.password,
           confirmNewPassword: user.password
         })
         .expect(400);
       
       expect(res.body.success).toBe(false);
       expect(res.body.error.code).toBe('SAME_PASSWORD_NOT_ALLOWED');
     });

     it('should validate password confirmation mismatch', async () => {
       const res = await request(app)
         .post('/api/v1/auth/reset-password')
         .send({
           token: resetToken,
           newPassword: 'NewValidPassword123!',
           confirmNewPassword: 'DifferentPassword123!'
         })
         .expect(400);
       
       expect(res.body.success).toBe(false);
       expect(res.body.error.code).toBe('VALIDATION_ERROR');
       expect(res.body.error.details.confirmNewPassword.msg).toContain('Password confirmation does not match');
     });

 
     it('should validate minimum password length', async () => {
       const res = await request(app)
         .post('/api/v1/auth/reset-password')
         .send({
           token: resetToken,
           newPassword: 'Abc1!',
           confirmNewPassword: 'Abc1!'
         })
         .expect(400);
       
       expect(res.body.success).toBe(false);
       expect(res.body.error.code).toBe('VALIDATION_ERROR');
       expect(res.body.error.details.newPassword.msg).toContain('must be between 8 and 128 characters');
     });

     it('should require all fields', async () => {
       const res = await request(app)
         .post('/api/v1/auth/reset-password')
         .send({})
         .expect(400);
       
       expect(res.body.success).toBe(false);
       expect(res.body.error.code).toBe('VALIDATION_ERROR');
       
       const errorDetails = res.body.error.details;
       expect(errorDetails.token.msg).toContain('Reset token is required');
       expect(errorDetails.newPassword.msg).toContain('New password is required');
       expect(errorDetails.confirmNewPassword.msg).toContain('Password confirmation is required');
     });
   });
 });