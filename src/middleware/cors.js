const cors = require('cors');

const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
};

module.exports = cors(corsOptions);
