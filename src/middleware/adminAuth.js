const jwt = require('jsonwebtoken');
const { Admin } = require('../models');

/**
 * Admin JWT Authentication middleware
 */
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Access denied. No token provided.',
          code: 'NO_TOKEN',
          statusCode: 401,
          details: {}
        }
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Ensure it's an admin token
      if (decoded.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied. Admin access required.',
            code: 'ADMIN_ACCESS_REQUIRED',
            statusCode: 403,
            details: {}
          }
        });
      }

      const admin = await Admin.findById(decoded.id).select('-password');
      
      if (!admin) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Invalid token. Admin not found.',
            code: 'ADMIN_NOT_FOUND',
            statusCode: 401,
            details: {}
          }
        });
      }

      if (!admin.isActive) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Admin account is deactivated.',
            code: 'ADMIN_DEACTIVATED',
            statusCode: 401,
            details: {}
          }
        });
      }

      req.admin = admin;
      req.user = admin; // For backward compatibility
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token.',
          code: 'INVALID_TOKEN',
          statusCode: 401,
          details: {}
        }
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during authentication.',
        code: 'AUTH_ERROR',
        statusCode: 500,
        details: {}
      }
    });
  }
};

module.exports = adminAuth; 