const express = require('express');
const router = express.Router();
const languageController = require('../controllers/languageController');
const languageValidator = require('../validators/languageValidator');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Public routes (no authentication required)

// Get all active languages
router.get('/active', 
  languageValidator.query,
  validate(languageValidator.query, 'query'),
  languageController.getActiveLanguages
);

// Get all languages with filtering
router.get('/', 
  languageValidator.query,
  validate(languageValidator.query, 'query'),
  languageController.getAllLanguages
);

// Get language by ID
router.get('/:id', 
  languageValidator.getById,
  validate(languageValidator.getById, 'params'),
  languageController.getLanguageById
);

// Get language by slug
router.get('/slug/:slug', 
  languageValidator.getBySlug,
  validate(languageValidator.getBySlug, 'params'),
  languageController.getLanguageBySlug
);

// Protected routes (authentication required)

// Create new language (admin only)
router.post('/', 
  auth,
  languageValidator.create,
  validate(languageValidator.create, 'body'),
  languageController.createLanguage
);

// Update language (admin only)
router.put('/:id', 
  auth,
  languageValidator.update,
  validate(languageValidator.update, 'body'),
  languageController.updateLanguage
);

// Toggle language status (admin only)
router.patch('/:id/toggle-status', 
  auth,
  languageValidator.toggleStatus,
  validate(languageValidator.toggleStatus, 'params'),
  languageController.toggleLanguageStatus
);

// Delete language (admin only)
router.delete('/:id', 
  auth,
  languageValidator.delete,
  validate(languageValidator.delete, 'params'),
  languageController.deleteLanguage
);

module.exports = router; 