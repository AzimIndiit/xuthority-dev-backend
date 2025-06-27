const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('dotenv').config();

let mongoServer;

/**
 * Setup test environment before running tests
 */
beforeAll(async () => {
  // Environment variables are now set in jest.setup.js
  
  // Start in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  console.log('Test database connected');
});

/**
 * Cleanup after all tests
 */
afterAll(async () => {
  try {
    // Close mongoose connection
    await mongoose.connection.close();
    
    // Stop the in-memory MongoDB instance
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    console.log('Test database disconnected');
  } catch (error) {
    console.error('Error during test cleanup:', error);
  }
});

/**
 * Clean database before each test to ensure test isolation
 * This ensures each test starts with a clean slate but doesn't interfere
 * with database operations during the test execution
 */
beforeEach(async () => {
  try {
    // Clear all collections before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('Error clearing test database:', error);
  }
});
