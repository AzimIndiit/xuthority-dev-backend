// const request = require('supertest');
// const app = require('../../../app');
// const { User, Product } = require('../../models');
// const bcrypt = require('bcrypt');

// let vendorToken;
// let userToken;
// let vendor;
// let user;
// let createdProduct;

// describe('Product Integration Tests', () => {
//   beforeEach(async () => {
//     // Clean up existing data
//     await User.deleteMany({});
//     await Product.deleteMany({});

//     // Create test users with hashed passwords
//     const hashedPassword = await bcrypt.hash('password123', 4);
    
//     vendor = await User.create({
//       firstName: 'John',
//       lastName: 'Vendor',
//       email: 'vendor@example.com',
//       password: hashedPassword,
//       role: 'vendor',
//       authProvider: 'email',
//       acceptedTerms: true,
//       companyName: 'Test Company'
//     });

//     user = await User.create({
//       firstName: 'Jane',
//       lastName: 'User',
//       email: 'user@example.com',
//       password: hashedPassword,
//       role: 'user',
//       authProvider: 'email',
//       acceptedTerms: true
//     });

//     // Login users to get tokens
//     const vendorLogin = await request(app)
//       .post('/api/v1/auth/login')
//       .send({
//         email: 'vendor@example.com',
//         password: 'password123'
//       });

//     const userLogin = await request(app)
//       .post('/api/v1/auth/login')
//       .send({
//         email: 'user@example.com',
//         password: 'password123'
//       });

//     vendorToken = vendorLogin.body.data.accessToken;
//     userToken = userLogin.body.data.accessToken;
//   });

//   afterEach(async () => {
//     await User.deleteMany({});
//     await Product.deleteMany({});
//   });

//   describe('POST /api/v1/products', () => {
//     const validProductData = {
//       name: 'Test Product',
//       description: 'This is a test product for our application',
//       website: 'https://testproduct.com',
//       software: 'SaaS',
//       solutions: ['Analytics', 'CRM'],
//       industries: ['Technology', 'Finance'],
//       features: [
//         {
//           title: 'Advanced Analytics',
//           description: 'Get detailed insights into your data'
//         }
//       ],
//       pricing: [
//         {
//           name: 'Basic',
//           price: 29.99,
//           seats: 5,
//           description: 'Perfect for small teams'
//         }
//       ]
//     };

//     it('should create a product successfully when vendor is authenticated', async () => {
//       const response = await request(app)
//         .post('/api/v1/products')
//         .set('Authorization', `Bearer ${vendorToken}`)
//         .send(validProductData)
//         .expect(201);

//       expect(response.body.success).toBe(true);
//       expect(response.body.data.product).toHaveProperty('_id');
//       expect(response.body.data.product.name).toBe(validProductData.name);
//       expect(response.body.data.product.vendor._id).toBe(vendor._id.toString());
//       expect(response.body.data.product.status).toBe('draft');
//       expect(response.body.data.product.slug).toBe('test-product');

//       createdProduct = response.body.data.product;
//     });

//     it('should not allow regular users to create products', async () => {
//       const response = await request(app)
//         .post('/api/v1/products')
//         .set('Authorization', `Bearer ${userToken}`)
//         .send(validProductData)
//         .expect(403);

//       expect(response.body.success).toBe(false);
//       expect(response.body.error.message).toContain('Insufficient permissions');
//     });

//     it('should not allow unauthenticated users to create products', async () => {
//       const response = await request(app)
//         .post('/api/v1/products')
//         .send(validProductData)
//         .expect(401);

//       expect(response.body.success).toBe(false);
//     });

//     it('should validate required fields', async () => {
//       const invalidData = {
//         description: 'Missing name'
//       };

//       const response = await request(app)
//         .post('/api/v1/products')
//         .set('Authorization', `Bearer ${vendorToken}`)
//         .send(invalidData)
//         .expect(400);

//       expect(response.body.success).toBe(false);
//       expect(response.body.error.message).toContain('validation');
//     });

//     it('should validate enum values', async () => {
//       const invalidData = {
//         ...validProductData,
//         software: 'InvalidSoftware'
//       };

//       const response = await request(app)
//         .post('/api/v1/products')
//         .set('Authorization', `Bearer ${vendorToken}`)
//         .send(invalidData)
//         .expect(400);

//       expect(response.body.success).toBe(false);
//     });
//   });

//   describe('GET /api/v1/products', () => {
//     beforeEach(async () => {
//       // Create test products
//       await Product.create({
//         name: 'Published Product',
//         slug: 'published-product',
//         description: 'A published product',
//         software: 'SaaS',
//         vendor: vendor._id,
//         status: 'published'
//       });

//       await Product.create({
//         name: 'Draft Product',
//         slug: 'draft-product',
//         description: 'A draft product',
//         software: 'Mobile App',
//         vendor: vendor._id,
//         status: 'draft'
//       });
//     });

//     it('should get all published products', async () => {
//       const response = await request(app)
//         .get('/api/v1/products')
//         .expect(200);

//       expect(response.body.success).toBe(true);
//       expect(response.body.data).toHaveLength(1); // Only published products
//       expect(response.body.data[0].status).toBe('published');
//     });

//     it('should support pagination', async () => {
//       const response = await request(app)
//         .get('/api/v1/products?page=1&limit=1')
//         .expect(200);

//       expect(response.body.success).toBe(true);
//       expect(response.body.meta.pagination.page).toBe(1);
//       expect(response.body.meta.pagination.limit).toBe(1);
//     });

//     it('should support filtering by software type', async () => {
//       const response = await request(app)
//         .get('/api/v1/products?software=SaaS')
//         .expect(200);

//       expect(response.body.success).toBe(true);
//       expect(response.body.data).toHaveLength(1);
//       expect(response.body.data[0].software).toBe('SaaS');
//     });
//   });

//   describe('GET /api/v1/products/:productId', () => {
//     let product;

//     beforeEach(async () => {
//       product = await Product.create({
//         name: 'Test Product',
//         slug: 'test-product',
//         description: 'A test product',
//         software: 'SaaS',
//         vendor: vendor._id,
//         status: 'published',
//         views: 10
//       });
//     });

//     it('should get product by ID', async () => {
//       const response = await request(app)
//         .get(`/api/v1/products/${product._id}`)
//         .expect(200);

//       expect(response.body.success).toBe(true);
//       expect(response.body.data.product._id).toBe(product._id.toString());
//       expect(response.body.data.product.name).toBe('Test Product');
//     });

//     it('should increment views when requested', async () => {
//       const response = await request(app)
//         .get(`/api/v1/products/${product._id}?incrementViews=true`)
//         .expect(200);

//       expect(response.body.success).toBe(true);
      
//       // Check that views were incremented
//       const updatedProduct = await Product.findById(product._id);
//       expect(updatedProduct.views).toBe(11);
//     });

//     it('should return 404 for non-existent product', async () => {
//       const nonExistentId = '507f1f77bcf86cd799439011';
//       const response = await request(app)
//         .get(`/api/v1/products/${nonExistentId}`)
//         .expect(404);

//       expect(response.body.success).toBe(false);
//     });
//   });

//   describe('GET /api/v1/products/slug/:slug', () => {
//     let product;

//     beforeEach(async () => {
//       product = await Product.create({
//         name: 'Test Product',
//         slug: 'test-product',
//         description: 'A test product',
//         software: 'SaaS',
//         vendor: vendor._id,
//         status: 'published'
//       });
//     });

//     it('should get product by slug', async () => {
//       const response = await request(app)
//         .get('/api/v1/products/slug/test-product')
//         .expect(200);

//       expect(response.body.success).toBe(true);
//       expect(response.body.data.product.slug).toBe('test-product');
//       expect(response.body.data.product.name).toBe('Test Product');
//     });

//     it('should return 404 for non-existent slug', async () => {
//       const response = await request(app)
//         .get('/api/v1/products/slug/non-existent')
//         .expect(404);

//       expect(response.body.success).toBe(false);
//     });
//   });

//   describe('PUT /api/v1/products/:productId', () => {
//     let product;

//     beforeEach(async () => {
//       product = await Product.create({
//         name: 'Test Product',
//         slug: 'test-product',
//         description: 'A test product',
//         software: 'SaaS',
//         vendor: vendor._id,
//         status: 'draft'
//       });
//     });

//     it('should update product when vendor owns it', async () => {
//       const updateData = {
//         name: 'Updated Product',
//         description: 'Updated description',
//         status: 'published'
//       };

//       const response = await request(app)
//         .put(`/api/v1/products/${product._id}`)
//         .set('Authorization', `Bearer ${vendorToken}`)
//         .send(updateData)
//         .expect(200);

//       expect(response.body.success).toBe(true);
//       expect(response.body.data.product.name).toBe('Updated Product');
//       expect(response.body.data.product.status).toBe('published');
//     });

//     it('should not allow non-owners to update product', async () => {
//       // Create another vendor
//       const hashedPassword = await bcrypt.hash('password123', 4);
//       const otherVendor = await User.create({
//         firstName: 'Other',
//         lastName: 'Vendor',
//         email: 'other@example.com',
//         password: hashedPassword,
//         role: 'vendor',
//         authProvider: 'email',
//         acceptedTerms: true
//       });

//       const otherLogin = await request(app)
//         .post('/api/v1/auth/login')
//         .send({
//           email: 'other@example.com',
//           password: 'password123'
//         });

//       const otherToken = otherLogin.body.data.accessToken;

//       const response = await request(app)
//         .put(`/api/v1/products/${product._id}`)
//         .set('Authorization', `Bearer ${otherToken}`)
//         .send({ name: 'Hacked Product' })
//         .expect(403);

//       expect(response.body.success).toBe(false);
//     });

//     it('should not allow regular users to update products', async () => {
//       const response = await request(app)
//         .put(`/api/v1/products/${product._id}`)
//         .set('Authorization', `Bearer ${userToken}`)
//         .send({ name: 'Hacked Product' })
//         .expect(403);

//       expect(response.body.success).toBe(false);
//     });
//   });

//   describe('DELETE /api/v1/products/:productId', () => {
//     let product;

//     beforeEach(async () => {
//       product = await Product.create({
//         name: 'Test Product',
//         slug: 'test-product',
//         description: 'A test product',
//         software: 'SaaS',
//         vendor: vendor._id,
//         status: 'draft'
//       });
//     });

//     it('should delete product when vendor owns it', async () => {
//       const response = await request(app)
//         .delete(`/api/v1/products/${product._id}`)
//         .set('Authorization', `Bearer ${vendorToken}`)
//         .expect(200);

//       expect(response.body.success).toBe(true);

//       // Verify product is deleted
//       const deletedProduct = await Product.findById(product._id);
//       expect(deletedProduct).toBeNull();
//     });

//     it('should not allow non-owners to delete product', async () => {
//       const response = await request(app)
//         .delete(`/api/v1/products/${product._id}`)
//         .set('Authorization', `Bearer ${userToken}`)
//         .expect(403);

//       expect(response.body.success).toBe(false);

//       // Verify product still exists
//       const existingProduct = await Product.findById(product._id);
//       expect(existingProduct).toBeTruthy();
//     });
//   });

//   describe('GET /api/v1/products/my/products', () => {
//     beforeEach(async () => {
//       await Product.create({
//         name: 'My Product 1',
//         slug: 'my-product-1',
//         description: 'My first product',
//         software: 'SaaS',
//         vendor: vendor._id,
//         status: 'published'
//       });

//       await Product.create({
//         name: 'My Product 2',
//         slug: 'my-product-2',
//         description: 'My second product',
//         software: 'Mobile App',
//         vendor: vendor._id,
//         status: 'draft'
//       });
//     });

//     it('should get current vendor products', async () => {
//       const response = await request(app)
//         .get('/api/v1/products/my')
//         .set('Authorization', `Bearer ${vendorToken}`)
//         .expect(200);

//       expect(response.body.success).toBe(true);
//       expect(response.body.data).toHaveLength(2);
//       expect(response.body.meta.vendor._id).toBe(vendor._id.toString());
//     });

//     it('should not allow regular users to access my products', async () => {
//       const response = await request(app)
//         .get('/api/v1/products/my')
//         .set('Authorization', `Bearer ${userToken}`)
//         .expect(403);

//       expect(response.body.success).toBe(false);
//     });
//   });

//   describe('POST /api/v1/products/:productId/like', () => {
//     let product;

//     beforeEach(async () => {
//       product = await Product.create({
//         name: 'Test Product',
//         slug: 'test-product',
//         description: 'A test product',
//         software: 'SaaS',
//         vendor: vendor._id,
//         status: 'published',
//         likes: 5
//       });
//     });

//     it('should toggle product like', async () => {
//       const response = await request(app)
//         .post(`/api/v1/products/${product._id}/like`)
//         .set('Authorization', `Bearer ${userToken}`)
//         .expect(200);

//       expect(response.body.success).toBe(true);
//       expect(response.body.data.product.likes).toBe(6);
//     });

//     it('should require authentication', async () => {
//       const response = await request(app)
//         .post(`/api/v1/products/${product._id}/like`)
//         .expect(401);

//       expect(response.body.success).toBe(false);
//     });
//   });

//   describe('GET /api/v1/products/search', () => {
//     beforeEach(async () => {
//       await Product.create({
//         name: 'Analytics Platform',
//         slug: 'analytics-platform',
//         description: 'Advanced analytics for businesses',
//         software: 'SaaS',
//         vendor: vendor._id,
//         status: 'published',
//         keywords: ['analytics', 'business', 'data']
//       });

//       await Product.create({
//         name: 'CRM System',
//         slug: 'crm-system',
//         description: 'Customer relationship management',
//         software: 'Web Application',
//         vendor: vendor._id,
//         status: 'published',
//         keywords: ['crm', 'customers', 'sales']
//       });
//     });

//     it('should search products by query', async () => {
//       const response = await request(app)
//         .get('/api/v1/products/search?q=analytics')
//         .expect(200);

//       expect(response.body.success).toBe(true);
//       expect(response.body.data).toHaveLength(1);
//       expect(response.body.data[0].name).toBe('Analytics Platform');
//     });

//     it('should require search query', async () => {
//       const response = await request(app)
//         .get('/api/v1/products/search')
//         .expect(400);

//       expect(response.body.success).toBe(false);
//     });
//   });

//   describe('GET /api/v1/products/stats/overview', () => {
//     beforeEach(async () => {
//       await Product.create({
//         name: 'Product 1',
//         slug: 'product-1',
//         description: 'Test product',
//         software: 'SaaS',
//         vendor: vendor._id,
//         status: 'published',
//         views: 100,
//         likes: 10
//       });

//       await Product.create({
//         name: 'Product 2',
//         slug: 'product-2',
//         description: 'Test product',
//         software: 'SaaS',
//         vendor: vendor._id,
//         status: 'draft',
//         views: 50,
//         likes: 5
//       });
//     });

//     it('should get product statistics for vendor', async () => {
//       const response = await request(app)
//         .get('/api/v1/products/stats/overview')
//         .set('Authorization', `Bearer ${vendorToken}`)
//         .expect(200);

//       expect(response.body.success).toBe(true);
//       expect(response.body.data.totalProducts).toBe(2);
//       expect(response.body.data.publishedProducts).toBe(1);
//       expect(response.body.data.draftProducts).toBe(1);
//       expect(response.body.data.totalViews).toBe(150);
//       expect(response.body.data.totalLikes).toBe(15);
//     });

//     it('should require authentication', async () => {
//       const response = await request(app)
//         .get('/api/v1/products/stats/overview')
//         .expect(401);

//       expect(response.body.success).toBe(false);
//     });
//   });
// }); 