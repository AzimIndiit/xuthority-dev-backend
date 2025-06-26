const express = require('express');
const router = express.Router();

// Middleware
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate } = require('../middleware/validation');

// Controllers
const industryController = require('../controllers/industryController');

// Validators
const {
  createIndustryValidator,
  updateIndustryValidator,
  industryIdValidator,
  industrySlugValidator,
  industryQueryValidator
} = require('../validators/industryValidator');

// Public routes (no authentication required)
router.get('/', 
  validate(industryQueryValidator, 'query'),
  industryController.getAllIndustries
);

router.get('/active', 
  validate(industryQueryValidator, 'query'),
  industryController.getActiveIndustries
);

router.get('/slug/:slug', 
  validate(industrySlugValidator, 'params'),
  industryController.getIndustryBySlug
);

router.get('/:industryId', 
  validate(industryIdValidator, 'params'),
  industryController.getIndustryById
);

// Protected routes (require authentication)
router.use(auth);

router.post('/', 
  authorize(['admin', 'vendor']),
  validate(createIndustryValidator, 'body'),
  industryController.createIndustry
);

router.put('/:industryId', 
  authorize(['admin', 'vendor']),
  validate(industryIdValidator, 'params'),
  validate(updateIndustryValidator, 'body'),
  industryController.updateIndustry
);

router.patch('/:industryId/toggle-status', 
  authorize(['admin', 'vendor']),
  validate(industryIdValidator, 'params'),
  industryController.toggleIndustryStatus
);

router.delete('/:industryId', 
  authorize(['admin']),
  validate(industryIdValidator, 'params'),
  industryController.deleteIndustry
);

module.exports = router; 