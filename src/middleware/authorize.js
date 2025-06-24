module.exports = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Forbidden: insufficient permissions',
        code: 'FORBIDDEN',
        statusCode: 403,
        details: {},
      },
    });
  }
  next();
};
