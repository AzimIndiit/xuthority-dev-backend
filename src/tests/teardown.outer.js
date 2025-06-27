/**
 * Global teardown for Jest tests
 * This file runs after all test suites have completed
 */
module.exports = async () => {
  // Force exit after tests complete
  // This helps with any lingering handles
  setTimeout(() => {
    process.exit(0);
  }, 1000);
};
