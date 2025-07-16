const app = require('./app');
const logger = require('./src/config/logger');
const connectDB = require('./src/config/database');
const { startSubscriptionCleanupJobs } = require('./src/jobs/subscriptionCleanupJob');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();
    logger.info('MongoDB connected');

    // Start subscription cleanup cron jobs
    if (process.env.NODE_ENV !== 'test') {
      startSubscriptionCleanupJobs();
      logger.info('Subscription cleanup jobs initialized');
    }

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

startServer();
