const mongoose = require('mongoose');

/**
 * Global test setup
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
process.env.MONGODB_URI = 'mongodb://localhost:27017/xuthority_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.AWS_S3_BUCKET = 'test-bucket';
process.env.AWS_REGION = 'us-east-1';

beforeAll(async () => {
  // Connect to test database
  const testDbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/xuthority_test';
  
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testDbUri);
  }
});

afterAll(async () => {
  // Clean up and close connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

// Clean up collections before each test
beforeEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
}); 