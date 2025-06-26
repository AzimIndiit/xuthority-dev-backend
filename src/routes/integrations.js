const express = require('express');
const router = express.Router();

// Middleware
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate } = require('../middleware/validation');

// Controllers
const integrationController = require('../controllers/integrationController');

// Validators
const integrationValidator = require('../validators/integrationValidator');

// Public routes (no authentication required)
router.get('/', 
  integrationValidator.query,
  validate(integrationValidator.query, 'query'),
  integrationController.getAllIntegrations
);

router.get('/active', 
  integrationValidator.query,
  validate(integrationValidator.query, 'query'),
  integrationController.getActiveIntegrations
);

router.get('/slug/:slug', 
  integrationValidator.getBySlug,
  validate(integrationValidator.getBySlug, 'params'),
  integrationController.getIntegrationBySlug
);

router.get('/:integrationId', 
  integrationValidator.getById,
  validate(integrationValidator.getById, 'params'),
  integrationController.getIntegrationById
);

// Protected routes (require authentication)
router.use(auth);

router.post('/', 
  authorize(['admin', 'vendor']),
  integrationValidator.create,
  validate(integrationValidator.create, 'body'),
  integrationController.createIntegration
);

router.put('/:integrationId', 
  authorize(['admin', 'vendor']),
  integrationValidator.update,
  validate(integrationValidator.update, 'body'),
  integrationController.updateIntegration
);

router.patch('/:integrationId/toggle-status', 
  authorize(['admin', 'vendor']),
  integrationValidator.toggleStatus,
  validate(integrationValidator.toggleStatus, 'params'),
  integrationController.toggleIntegrationStatus
);

router.delete('/:integrationId', 
  authorize(['admin']),
  integrationValidator.delete,
  validate(integrationValidator.delete, 'params'),
  integrationController.deleteIntegration
);

module.exports = router; 