const express = require('express');
const router = express.Router();
const languageController = require('../controllers/languageController');
const { languageValidator } = require('../validators');
const { auth, validate } = require('../middleware');

// Public routes (no authentication required)
router.get('/active', 
  languageValidator.getActiveLanguagesValidation,
  validate,
  languageController.getActiveLanguages
);

router.get('/', 
  languageValidator.getAllLanguagesValidation,
  validate,
  languageController.getAllLanguages
);

router.get('/:id', 
  languageValidator.getLanguageByIdValidation,
  validate,
  languageController.getLanguageById
);

router.get('/slug/:slug', 
  languageValidator.getLanguageBySlugValidation,
  validate,
  languageController.getLanguageBySlug
);

// Protected routes (authentication required)
router.use(auth);

router.post('/', 
  languageValidator.createLanguageValidation,
  validate,
  languageController.createLanguage
);

router.put('/:id', 
  languageValidator.updateLanguageValidation,
  validate,
  languageController.updateLanguage
);

router.patch('/:id/toggle-status', 
  languageValidator.toggleLanguageStatusValidation,
  validate,
  languageController.toggleLanguageStatus
);

router.delete('/:id', 
  languageValidator.deleteLanguageValidation,
  validate,
  languageController.deleteLanguage
);

module.exports = router; 