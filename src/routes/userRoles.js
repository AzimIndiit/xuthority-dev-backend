const express = require('express');
const router = express.Router();
const userRoleController = require('../controllers/userRoleController');
const userRoleValidator = require('../validators/userRoleValidator');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Public routes (no authentication required)

// Get all active user roles
router.get('/active', 
  userRoleValidator.query,
  validate(userRoleValidator.query, 'query'),
  userRoleController.getActiveUserRoles
);

// Get all user roles with filtering
router.get('/', 
  userRoleValidator.query,
  validate(userRoleValidator.query, 'query'),
  userRoleController.getAllUserRoles
);

// Get user role by ID
router.get('/:id', 
  userRoleValidator.getById,
  validate(userRoleValidator.getById, 'params'),
  userRoleController.getUserRoleById
);

// Get user role by slug
router.get('/slug/:slug', 
  userRoleValidator.getBySlug,
  validate(userRoleValidator.getBySlug, 'params'),
  userRoleController.getUserRoleBySlug
);

// Protected routes (authentication required)

// Create new user role (admin only)
router.post('/', 
  auth,
  userRoleValidator.create,
  validate(userRoleValidator.create, 'body'),
  userRoleController.createUserRole
);

// Update user role (admin only)
router.put('/:id', 
  auth,
  userRoleValidator.update,
  validate(userRoleValidator.update, 'body'),
  userRoleController.updateUserRole
);

// Toggle user role status (admin only)
router.patch('/:id/toggle-status', 
  auth,
  userRoleValidator.toggleStatus,
  validate(userRoleValidator.toggleStatus, 'params'),
  userRoleController.toggleUserRoleStatus
);

// Delete user role (admin only)
router.delete('/:id', 
  auth,
  userRoleValidator.delete,
  validate(userRoleValidator.delete, 'params'),
  userRoleController.deleteUserRole
);

module.exports = router; 