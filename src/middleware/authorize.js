module.exports = (...allowedRoles) => (req, res, next) => {
  // Flatten the allowedRoles array to handle both calling patterns:
  // authorize('admin', 'vendor') and authorize(['admin', 'vendor'])
  const roles = allowedRoles.flat();
  
  if (!req.user || !roles.includes(req.user.role)) {
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
