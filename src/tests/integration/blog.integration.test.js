const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../app');
const { User, Blog, ResourceCategory } = require('../../models');

describe('Blog Integration Tests', () => {
  let adminToken;
  let userToken;
  let adminUser;
  let regularUser;
  let testCategory;

  beforeEach(async () => {
    // Clean up existing data
    await Blog.deleteMany({});
    await ResourceCategory.deleteMany({});
    await User.deleteMany({});
    
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    // Create admin user
    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@blog.test.com',
      password: hashedPassword,
      role: 'admin',
      acceptedTerms: true,
      isVerified: true
    });

    // Create regular user
    regularUser = await User.create({
      firstName: 'Regular',
      lastName: 'User',
      email: 'user@blog.test.com',
      password: hashedPassword,
      role: 'user',
      acceptedTerms: true,
      isVerified: true
    });

    // Create test resource category
    testCategory = await ResourceCategory.create({
      name: 'Technology Blogs',
      status: 'active'
    });

    // Get admin auth token
    const adminLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@blog.test.com',
        password: 'Password123!'
      });
    adminToken = adminLoginResponse.body.data.token;

    // Get user auth token
    const userLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user@blog.test.com',
        password: 'Password123!'
      });
    userToken = userLoginResponse.body.data.token;
  });

  afterEach(async () => {
    await Blog.deleteMany({});
    await ResourceCategory.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/v1/blogs', () => {
    const validBlogData = {
      authorName: 'John Doe',
      designation: 'Senior Developer',
      title: 'Introduction to Node.js Development',
      description: 'A comprehensive guide to getting started with Node.js development and best practices',
      tag: 'On Demand',
      mediaUrl: 'https://example.com/image.jpg',
      watchUrl: 'https://example.com/video.mp4'
    };

    it('should create a new blog successfully with admin role', async () => {
      const blogData = {
        ...validBlogData,
        resourceCategoryId: testCategory._id.toString()
      };

      const response = await request(app)
        .post('/api/v1/blogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(blogData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(blogData.title);
      expect(response.body.data.authorName).toBe(blogData.authorName);
      expect(response.body.data.slug).toBe('introduction-to-nodejs-development');
      expect(response.body.data.status).toBe('active');
      expect(response.body.data.createdBy).toBe(adminUser._id.toString());
    });

    it('should require authentication', async () => {
      const blogData = {
        ...validBlogData,
        resourceCategoryId: testCategory._id.toString()
      };

      const response = await request(app)
        .post('/api/v1/blogs')
        .send(blogData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should require admin role', async () => {
      const blogData = {
        ...validBlogData,
        resourceCategoryId: testCategory._id.toString()
      };

      const response = await request(app)
        .post('/api/v1/blogs')
        .set('Authorization', `Bearer ${userToken}`)
        .send(blogData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const invalidBlogData = {
        authorName: 'John Doe'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/v1/blogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidBlogData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate title length', async () => {
      const invalidBlogData = {
        ...validBlogData,
        title: 'A', // Too short
        resourceCategoryId: testCategory._id.toString()
      };

      const response = await request(app)
        .post('/api/v1/blogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidBlogData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate resource category ID', async () => {
      const invalidBlogData = {
        ...validBlogData,
        resourceCategoryId: 'invalid-id'
      };

      const response = await request(app)
        .post('/api/v1/blogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidBlogData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate tag values', async () => {
      const invalidBlogData = {
        ...validBlogData,
        tag: 'InvalidTag',
        resourceCategoryId: testCategory._id.toString()
      };

      const response = await request(app)
        .post('/api/v1/blogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidBlogData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/blogs', () => {
    beforeEach(async () => {
      // Create test blogs
      await Blog.create([
        {
          createdBy: adminUser._id,
          resourceCategoryId: testCategory._id,
          authorName: 'Author One',
          title: 'First Blog Post',
          description: 'Description for first blog post with enough content',
          tag: 'On Demand',
          status: 'active'
        },
        {
          createdBy: adminUser._id,
          resourceCategoryId: testCategory._id,
          authorName: 'Author Two',
          title: 'Second Blog Post',
          description: 'Description for second blog post with enough content',
          tag: 'Upcoming',
          status: 'inactive'
        }
      ]);
    });

    it('should get all blogs with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/blogs')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
      expect(response.body.meta).toHaveProperty('pagination');
      expect(response.body.meta.total).toBe(2);
    });

    it('should filter blogs by status', async () => {
      const response = await request(app)
        .get('/api/v1/blogs')
        .query({ status: 'active' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].status).toBe('active');
    });

    it('should search blogs by title and description', async () => {
      const response = await request(app)
        .get('/api/v1/blogs')
        .query({ search: 'First' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(1);
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/blogs')
        .query({ page: 0, limit: 101 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/blogs/active', () => {
    beforeEach(async () => {
      await Blog.create([
        {
          createdBy: adminUser._id,
          resourceCategoryId: testCategory._id,
          authorName: 'Author One',
          title: 'Active Blog',
          description: 'Description for active blog with enough content',
          tag: 'On Demand',
          status: 'active'
        },
        {
          createdBy: adminUser._id,
          resourceCategoryId: testCategory._id,
          authorName: 'Author Two',
          title: 'Inactive Blog',
          description: 'Description for inactive blog with enough content',
          tag: 'Upcoming',
          status: 'inactive'
        }
      ]);
    });

    it('should get only active blogs', async () => {
      const response = await request(app)
        .get('/api/v1/blogs/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].status).toBe('active');
      expect(response.body.data[0].title).toBe('Active Blog');
    });
  });

  describe('GET /api/v1/blogs/:id', () => {
    let testBlog;

    beforeEach(async () => {
      testBlog = await Blog.create({
        createdBy: adminUser._id,
        resourceCategoryId: testCategory._id,
        authorName: 'Test Author',
        title: 'Test Blog',
        description: 'Test description with enough content for validation',
        tag: 'On Demand'
      });
    });

    it('should get blog by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/blogs/${testBlog._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testBlog._id.toString());
      expect(response.body.data.title).toBe('Test Blog');
    });

    it('should return 404 for non-existent blog', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/blogs/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid ObjectId', async () => {
      const response = await request(app)
        .get('/api/v1/blogs/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/blogs/slug/:slug', () => {
    let testBlog;

    beforeEach(async () => {
      testBlog = await Blog.create({
        createdBy: adminUser._id,
        resourceCategoryId: testCategory._id,
        authorName: 'Test Author',
        title: 'Test Blog Post for Slugs',
        description: 'Test description with enough content for validation',
        tag: 'On Demand'
      });
    });

    it('should get blog by slug', async () => {
      const response = await request(app)
        .get(`/api/v1/blogs/slug/${testBlog.slug}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe(testBlog.slug);
      expect(response.body.data.title).toBe('Test Blog Post for Slugs');
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/api/v1/blogs/slug/non-existent-slug')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should validate slug format', async () => {
      const response = await request(app)
        .get('/api/v1/blogs/slug/Invalid@Slug!')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/blogs/category/:categoryId', () => {
    beforeEach(async () => {
      await Blog.create({
        createdBy: adminUser._id,
        resourceCategoryId: testCategory._id,
        authorName: 'Test Author',
        title: 'Category Blog',
        description: 'Blog in specific category with enough content',
        tag: 'On Demand'
      });
    });

    it('should get blogs by category', async () => {
      const response = await request(app)
        .get(`/api/v1/blogs/category/${testCategory._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(1);
    });

    it('should validate category ID', async () => {
      const response = await request(app)
        .get('/api/v1/blogs/category/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/blogs/tag/:tag', () => {
    beforeEach(async () => {
      await Blog.create([
        {
          createdBy: adminUser._id,
          resourceCategoryId: testCategory._id,
          authorName: 'Test Author',
          title: 'On Demand Blog',
          description: 'Blog with On Demand tag and enough content',
          tag: 'On Demand'
        },
        {
          createdBy: adminUser._id,
          resourceCategoryId: testCategory._id,
          authorName: 'Test Author',
          title: 'EBook Blog',
          description: 'Blog with EBook tag and enough content',
          tag: 'EBook'
        }
      ]);
    });

    it('should get blogs by valid tag', async () => {
      const response = await request(app)
        .get('/api/v1/blogs/tag/On Demand')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].tag).toBe('On Demand');
    });

    it('should validate tag values', async () => {
      const response = await request(app)
        .get('/api/v1/blogs/tag/InvalidTag')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/blogs/:id', () => {
    let testBlog;

    beforeEach(async () => {
      testBlog = await Blog.create({
        createdBy: adminUser._id,
        resourceCategoryId: testCategory._id,
        authorName: 'Original Author',
        title: 'Original Title',
        description: 'Original description with enough content for validation',
        tag: 'On Demand'
      });
    });

    it('should update blog successfully with admin role', async () => {
      const updateData = {
        authorName: 'Updated Author',
        title: 'Updated Title',
        description: 'Updated description with enough content for validation',
        tag: 'EBook',
        resourceCategoryId: testCategory._id.toString()
      };

      const response = await request(app)
        .put(`/api/v1/blogs/${testBlog._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.authorName).toBe('Updated Author');
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.slug).toBe('updated-title');
    });

    it('should require authentication for update', async () => {
      const updateData = {
        title: 'Updated Title'
      };

      const response = await request(app)
        .put(`/api/v1/blogs/${testBlog._id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should require admin role for update', async () => {
      const updateData = {
        title: 'Updated Title'
      };

      const response = await request(app)
        .put(`/api/v1/blogs/${testBlog._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/blogs/:id/toggle-status', () => {
    let testBlog;

    beforeEach(async () => {
      testBlog = await Blog.create({
        createdBy: adminUser._id,
        resourceCategoryId: testCategory._id,
        authorName: 'Test Author',
        title: 'Test Blog',
        description: 'Test description with enough content for validation',
        tag: 'On Demand',
        status: 'active'
      });
    });

    it('should toggle blog status successfully with admin role', async () => {
      const response = await request(app)
        .patch(`/api/v1/blogs/${testBlog._id}/toggle-status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('inactive');
    });

    it('should require authentication for toggle status', async () => {
      const response = await request(app)
        .patch(`/api/v1/blogs/${testBlog._id}/toggle-status`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should require admin role for toggle status', async () => {
      const response = await request(app)
        .patch(`/api/v1/blogs/${testBlog._id}/toggle-status`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/blogs/:id', () => {
    let testBlog;

    beforeEach(async () => {
      testBlog = await Blog.create({
        createdBy: adminUser._id,
        resourceCategoryId: testCategory._id,
        authorName: 'Test Author',
        title: 'Test Blog',
        description: 'Test description with enough content for validation',
        tag: 'On Demand'
      });
    });

    it('should delete blog successfully with admin role', async () => {
      const response = await request(app)
        .delete(`/api/v1/blogs/${testBlog._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify blog is deleted
      const deletedBlog = await Blog.findById(testBlog._id);
      expect(deletedBlog).toBeNull();
    });

    it('should require authentication for delete', async () => {
      const response = await request(app)
        .delete(`/api/v1/blogs/${testBlog._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should require admin role for delete', async () => {
      const response = await request(app)
        .delete(`/api/v1/blogs/${testBlog._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent blog', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/v1/blogs/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
}); 