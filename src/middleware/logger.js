const morgan = require('morgan');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

const requestLogger = (req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
};

morgan.token('id', (req) => req.id);

const morganMiddleware = morgan(
  ':id :method :url :status :response-time ms - :res[content-length]',
  {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }
);

module.exports = [requestLogger, morganMiddleware];
