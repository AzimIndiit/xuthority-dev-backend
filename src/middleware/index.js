const auth = require('./auth');
const authorize = require('./authorize');
const cache = require('./cache');
const compression = require('./compression');
const cors = require('./cors');
const errorHandler = require('./errorHandler');
const logger = require('./logger');
const rateLimiter = require('./rateLimiter');
const security = require('./security');
const upload = require('./upload');
const { validate } = require('./validation');

module.exports = {
  auth,
  authorize,
  cache,
  compression,
  cors,
  errorHandler,
  logger,
  rateLimiter,
  security,
  upload,
  validate,
};
