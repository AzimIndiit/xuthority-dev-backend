const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../../../app');
const { CommunityQuestion, CommunityAnswer, User, Product } = require('../../models');

describe('Community API Integration Tests', () => {
  let userToken, user2Token;
  let testUser, testUser2;
  let testProduct;
  let testQuestion, testAnswer;

  // Helper function to create test users and data
  const createTestData = async () => {
    // Create test users
    const hashedPassword = await bcrypt.hash('TestPass123!', 4);
    
    testUser = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      password: hashedPassword,
      role: 'user',
      acceptedTerms: true,
      isVerified: true
    });

    testUser2 = await User.create({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@test.com',
      password: hashedPassword,
      role: 'user',
      acceptedTerms: true,
      isVerified: true
    });

    // Generate tokens
    userToken = jwt.sign(
      { id: testUser._id, email: testUser.email, role: testUser.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );
    user2Token = jwt.sign(
      { id: testUser2._id, email: testUser2.email, role: testUser2.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    // Create test product
    testProduct = await Product.create({
      name: 'Test Software',
      description: 'A test software product',
      slug: 'test-software',
      userId: testUser._id,
      status: 'approved'
    });

    // Create test question
    testQuestion = await CommunityQuestion.create({
      title: 'How to integrate this software with our existing system?',
      author: testUser._id,
      product: testProduct._id,
      status: 'approved'
    });

    // Create test answer
    testAnswer = await CommunityAnswer.create({
      content: 'You can integrate it using the REST API. Here are the detailed steps...',
      question: testQuestion._id,
      author: testUser2._id,
      status: 'approved'
    });

    // Update question's answer count
    await CommunityQuestion.findByIdAndUpdate(testQuestion._id, {
      totalAnswers: 1
    });
  };

  describe('Community Questions', () => {
    describe('GET /api/v1/community/questions', () => {
      beforeEach(async () => {
        await createTestData();
        
        // Create additional test questions
        await CommunityQuestion.create([
          {
            title: 'Question about pricing',
            author: testUser._id,
            status: 'approved'
          },
          {
            title: 'Question about features',
            author: testUser2._id,
            product: testProduct._id,
            status: 'approved'
          },
          {
            title: 'Pending question',
            author: testUser._id,
            status: 'pending'
          }
        ]);
      });

      it('should get all approved questions with pagination', async () => {
        const res = await request(app)
          .get('/api/v1/community/questions')
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.questions).toBeDefined();
        expect(res.body.data.pagination).toBeDefined();
        expect(res.body.data.questions.length).toBeGreaterThan(0);
        expect(res.body.data.pagination.total).toBeGreaterThan(0);

        // Check question structure
        const question = res.body.data.questions[0];
        expect(question).toHaveProperty('title');
        expect(question).toHaveProperty('author');
        expect(question).toHaveProperty('totalAnswers');
        expect(question).toHaveProperty('createdAt');
      });

      it('should filter questions by product', async () => {
        const res = await request(app)
          .get(`/api/v1/community/questions?product=${testProduct._id}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.questions.length).toBeGreaterThan(0);
        
        res.body.data.questions.forEach(question => {
          if (question.product) {
            expect(question.product._id || question.product).toBe(testProduct._id.toString());
          }
        });
      });

      it('should paginate questions correctly', async () => {
        const res = await request(app)
          .get('/api/v1/community/questions?page=1&limit=2')
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.questions.length).toBeLessThanOrEqual(2);
        expect(res.body.data.pagination.current).toBe(1);
        expect(res.body.data.pagination.limit).toBe(2);
      });

      it('should search questions by title', async () => {
        const res = await request(app)
          .get('/api/v1/community/questions?search=pricing')
          .expect(200);

        expect(res.body.success).toBe(true);
        if (res.body.data.questions.length > 0) {
          const foundQuestion = res.body.data.questions.find(q => 
            q.title.toLowerCase().includes('pricing')
          );
          expect(foundQuestion).toBeTruthy();
        }
      });
    });

    describe('GET /api/v1/community/questions/:id', () => {
      beforeEach(async () => {
        await createTestData();
      });

      it('should get a single question by ID', async () => {
        const res = await request(app)
          .get(`/api/v1/community/questions/${testQuestion._id}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe(testQuestion.title);
        expect(res.body.data.author).toBeDefined();
        expect(res.body.data.totalAnswers).toBe(1);
      });

      it('should return 404 for non-existent question', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
          .get(`/api/v1/community/questions/${fakeId}`)
          .expect(404);

        expect(res.body.success).toBe(false);
      });

      it('should return 400 for invalid question ID', async () => {
        const res = await request(app)
          .get('/api/v1/community/questions/invalid-id')
          .expect(400);

        expect(res.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/community/questions', () => {
      beforeEach(async () => {
        await createTestData();
      });

      it('should create a new question successfully', async () => {
        const questionData = {
          title: 'How do I reset my password?',
          product: testProduct._id
        };

        const res = await request(app)
          .post('/api/v1/community/questions')
          .set('Authorization', `Bearer ${userToken}`)
          .send(questionData)
          .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe(questionData.title);
        expect(res.body.data.author._id).toBe(testUser._id.toString());
        expect(res.body.data.status).toBe('approved');
        expect(res.body.data.totalAnswers).toBe(0);
      });

      it('should create question without product', async () => {
        const questionData = {
          title: 'General question about software development'
        };

        const res = await request(app)
          .post('/api/v1/community/questions')
          .set('Authorization', `Bearer ${userToken}`)
          .send(questionData)
          .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe(questionData.title);
        expect(res.body.data.product).toBeNull();
      });

      it('should require authentication', async () => {
        const questionData = {
          title: 'This should fail without auth'
        };

        const res = await request(app)
          .post('/api/v1/community/questions')
          .send(questionData)
          .expect(401);

        expect(res.body.success).toBe(false);
      });

      it('should validate required fields', async () => {
        const res = await request(app)
          .post('/api/v1/community/questions')
          .set('Authorization', `Bearer ${userToken}`)
          .send({})
          .expect(400);

        expect(res.body.success).toBe(false);
      });

      it('should validate title length', async () => {
        const longTitle = 'a'.repeat(1001); // Exceeds maxLength of 1000

        const res = await request(app)
          .post('/api/v1/community/questions')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ title: longTitle })
          .expect(400);

        expect(res.body.success).toBe(false);
      });
    });

    describe('PUT /api/v1/community/questions/:id', () => {
      beforeEach(async () => {
        await createTestData();
      });

      it('should update question by author', async () => {
        const updateData = {
          title: 'Updated question title'
        };

        const res = await request(app)
          .put(`/api/v1/community/questions/${testQuestion._id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(updateData)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe(updateData.title);
      });

      it('should not allow non-author to update question', async () => {
        const res = await request(app)
          .put(`/api/v1/community/questions/${testQuestion._id}`)
          .set('Authorization', `Bearer ${user2Token}`)
          .send({ title: 'Should not work' })
          .expect(403);

        expect(res.body.success).toBe(false);
      });

      it('should return 404 for non-existent question', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const res = await request(app)
          .put(`/api/v1/community/questions/${fakeId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ title: 'Updated title' })
          .expect(404);

        expect(res.body.success).toBe(false);
      });
    });

    describe('DELETE /api/v1/community/questions/:id', () => {
      beforeEach(async () => {
        await createTestData();
      });

      it('should delete question by author', async () => {
        const res = await request(app)
          .delete(`/api/v1/community/questions/${testQuestion._id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);

        // Verify deletion
        const deletedQuestion = await CommunityQuestion.findById(testQuestion._id);
        expect(deletedQuestion).toBeNull();
      });

      it('should not allow non-author to delete question', async () => {
        const res = await request(app)
          .delete(`/api/v1/community/questions/${testQuestion._id}`)
          .set('Authorization', `Bearer ${user2Token}`)
          .expect(403);

        expect(res.body.success).toBe(false);
      });
    });
  });

  describe('Community Answers', () => {
    describe('GET /api/v1/community/questions/:questionId/answers', () => {
      beforeEach(async () => {
        await createTestData();
        
        // Create additional answers
        await CommunityAnswer.create([
          {
            content: 'Second answer with more details',
            question: testQuestion._id,
            author: testUser._id,
            status: 'approved'
          },
          {
            content: 'Third answer',
            question: testQuestion._id,
            author: testUser2._id,
            status: 'approved'
          },
          {
            content: 'Pending answer',
            question: testQuestion._id,
            author: testUser._id,
            status: 'pending'
          }
        ]);

        // Update question's answer count
        await CommunityQuestion.findByIdAndUpdate(testQuestion._id, {
          totalAnswers: 3
        });
      });

      it('should get all approved answers for a question', async () => {
        const res = await request(app)
          .get(`/api/v1/community/questions/${testQuestion._id}/answers`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.answers).toBeDefined();
        expect(res.body.data.pagination).toBeDefined();
        expect(res.body.data.answers.length).toBeGreaterThan(0);

        // Check answer structure
        const answer = res.body.data.answers[0];
        expect(answer).toHaveProperty('content');
        expect(answer).toHaveProperty('author');
        expect(answer).toHaveProperty('createdAt');
      });

      it('should paginate answers correctly', async () => {
        const res = await request(app)
          .get(`/api/v1/community/questions/${testQuestion._id}/answers?page=1&limit=2`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.answers.length).toBeLessThanOrEqual(2);
        expect(res.body.data.pagination.current).toBe(1);
        expect(res.body.data.pagination.limit).toBe(2);
      });

      it('should return 404 for non-existent question', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const res = await request(app)
          .get(`/api/v1/community/questions/${fakeId}/answers`)
          .expect(404);

        expect(res.body.success).toBe(false);
      });
    });

    describe('GET /api/v1/community/answers/:id', () => {
      beforeEach(async () => {
        await createTestData();
      });

      it('should get a single answer by ID', async () => {
        const res = await request(app)
          .get(`/api/v1/community/answers/${testAnswer._id}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.content).toBe(testAnswer.content);
        expect(res.body.data.author).toBeDefined();
        expect(res.body.data.question).toBeDefined();
      });

      it('should return 404 for non-existent answer', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const res = await request(app)
          .get(`/api/v1/community/answers/${fakeId}`)
          .expect(404);

        expect(res.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/community/questions/:questionId/answers', () => {
      beforeEach(async () => {
        await createTestData();
      });

      it('should create a new answer successfully', async () => {
        const answerData = {
          content: 'This is a detailed answer to your question. Here are the steps you need to follow...'
        };

        const res = await request(app)
          .post(`/api/v1/community/questions/${testQuestion._id}/answers`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(answerData)
          .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data.content).toBe(answerData.content);
        expect(res.body.data.author._id).toBe(testUser._id.toString());
        expect(res.body.data.question).toBe(testQuestion._id.toString());
        expect(res.body.data.status).toBe('approved');
      });

      it('should require authentication', async () => {
        const answerData = {
          content: 'This should fail without auth'
        };

        const res = await request(app)
          .post(`/api/v1/community/questions/${testQuestion._id}/answers`)
          .send(answerData)
          .expect(401);

        expect(res.body.success).toBe(false);
      });

      it('should validate required fields', async () => {
        const res = await request(app)
          .post(`/api/v1/community/questions/${testQuestion._id}/answers`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({})
          .expect(400);

        expect(res.body.success).toBe(false);
      });

      it('should validate content length', async () => {
        const shortContent = 'short'; // Less than 10 characters

        const res = await request(app)
          .post(`/api/v1/community/questions/${testQuestion._id}/answers`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ content: shortContent })
          .expect(400);

        expect(res.body.success).toBe(false);
      });

      it('should return 404 for non-existent question', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const res = await request(app)
          .post(`/api/v1/community/questions/${fakeId}/answers`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ content: 'Valid answer content' })
          .expect(404);

        expect(res.body.success).toBe(false);
      });
    });

    describe('PUT /api/v1/community/answers/:id', () => {
      beforeEach(async () => {
        await createTestData();
      });

      it('should update answer by author', async () => {
        const updateData = {
          content: 'Updated answer content with more details'
        };

        const res = await request(app)
          .put(`/api/v1/community/answers/${testAnswer._id}`)
          .set('Authorization', `Bearer ${user2Token}`)
          .send(updateData)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.content).toBe(updateData.content);
      });

      it('should not allow non-author to update answer', async () => {
        const res = await request(app)
          .put(`/api/v1/community/answers/${testAnswer._id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ content: 'Should not work' })
          .expect(403);

        expect(res.body.success).toBe(false);
      });
    });

    describe('DELETE /api/v1/community/answers/:id', () => {
      beforeEach(async () => {
        await createTestData();
      });

      it('should delete answer by author', async () => {
        const res = await request(app)
          .delete(`/api/v1/community/answers/${testAnswer._id}`)
          .set('Authorization', `Bearer ${user2Token}`)
          .expect(200);

        expect(res.body.success).toBe(true);

        // Verify deletion
        const deletedAnswer = await CommunityAnswer.findById(testAnswer._id);
        expect(deletedAnswer).toBeNull();
      });

      it('should not allow non-author to delete answer', async () => {
        const res = await request(app)
          .delete(`/api/v1/community/answers/${testAnswer._id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);

        expect(res.body.success).toBe(false);
      });
    });
  });

  describe('Search', () => {
    beforeEach(async () => {
      await createTestData();
      
      // Create additional content for search testing
      await CommunityQuestion.create([
        {
          title: 'API integration tutorial',
          author: testUser._id,
          status: 'approved'
        },
        {
          title: 'Database configuration help',
          author: testUser2._id,
          status: 'approved'
        }
      ]);

      await CommunityAnswer.create([
        {
          content: 'You can use the REST API for integration',
          question: testQuestion._id,
          author: testUser._id,
          status: 'approved'
        }
      ]);
    });

    describe('GET /api/v1/community/search', () => {
      it('should search questions and answers', async () => {
        const res = await request(app)
          .get('/api/v1/community/search?q=API')
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('questions');
        expect(res.body.data).toHaveProperty('answers');
      });

      it('should search only questions when type is specified', async () => {
        const res = await request(app)
          .get('/api/v1/community/search?q=integration&type=questions')
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.questions).toBeDefined();
        expect(res.body.data.answers).toHaveLength(0);
      });

      it('should require search query', async () => {
        const res = await request(app)
          .get('/api/v1/community/search')
          .expect(400);

        expect(res.body.success).toBe(false);
      });

      it('should validate search query length', async () => {
        const res = await request(app)
          .get('/api/v1/community/search?q=a') // Too short
          .expect(400);

        expect(res.body.success).toBe(false);
      });
    });
  });
}); 