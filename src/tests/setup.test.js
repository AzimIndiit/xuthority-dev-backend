const mongoose = require('mongoose');

describe('Test Setup Verification', () => {
  it('should connect to test database', async () => {
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
  });

  it('should have test environment variables set', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBe('test-jwt-secret-key-for-testing-purposes-only');
  });

  it('should be able to run basic test', () => {
    expect(1 + 1).toBe(2);
  });
}); 