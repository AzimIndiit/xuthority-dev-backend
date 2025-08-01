const express = require('express');
const router = express.Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API server and its dependencies.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server and dependencies are healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                 uptime:
 *                   type: number
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 dependencies:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                     redis:
 *                       type: string
 */

const mongoose = require('mongoose');
const redis = require('../config/redis'); // Assumes a redis client is exported from this path

router.get('/', async (req, res) => {
  // Check MongoDB connection
  let dbStatus = 'unknown';
  try {
    if (mongoose.connection.readyState === 1) {
      dbStatus = 'up';
    } else {
      dbStatus = 'down';
    }
  } catch (err) {
    dbStatus = 'down';
  }

  // Check Redis connection
  let redisStatus = 'unknown';
  if (redis && typeof redis.ping === 'function') {
    try {
      await redis.ping();
      redisStatus = 'up';
    } catch (err) {
      redisStatus = 'down';
    }
  } else {
    redisStatus = 'not_configured';
  }

  const allHealthy = dbStatus === 'up' && (redisStatus === 'up' || redisStatus === 'not_configured');

  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    status: allHealthy ? 'healthy' : 'unhealthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    dependencies: {
      database: dbStatus,
      redis: redisStatus,
    },
    message :"hi"
  });
});

module.exports = router;
