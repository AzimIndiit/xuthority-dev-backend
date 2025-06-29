module.exports = (req, res, next) => {
  if (req.method === 'GET' && !req.originalUrl.startsWith('/api/v1/auth')) {
    res.setHeader('Cache-Control', 'no-store'); // cache for 5 minutes
  } else {
    res.setHeader('Cache-Control', 'no-store'); // do not cache auth or sensitive routes
  }
  next();
};
