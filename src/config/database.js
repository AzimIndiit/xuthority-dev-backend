const mongoose = require('mongoose');
const logger = require('./logger');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xuthority-dev';

/**
 * Connect to MongoDB using Mongoose
 */
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected');

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', err);
    });
  } catch (err) {
    logger.error('MongoDB connection failed', err);
    process.exit(1);
  }
};

module.exports = connectDB;
