const express = require('express');
const router = express.Router();

// Middleware
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate } = require('../middleware/validation');

// Controllers
const marketSegmentController = require('../controllers/marketSegmentController');

// Validators
const marketSegmentValidator = require('../validators/marketSegmentValidator');

// Public routes (no authentication required)
router.get('/', 
  marketSegmentValidator.query,
  validate(marketSegmentValidator.query, 'query'),
  marketSegmentController.getAllMarketSegments
);

router.get('/active', 
  marketSegmentValidator.query,
  validate(marketSegmentValidator.query, 'query'),
  marketSegmentController.getActiveMarketSegments
);

router.get('/slug/:slug', 
  marketSegmentValidator.getBySlug,
  validate(marketSegmentValidator.getBySlug, 'params'),
  marketSegmentController.getMarketSegmentBySlug
);

router.get('/:marketSegmentId', 
  marketSegmentValidator.getById,
  validate(marketSegmentValidator.getById, 'params'),
  marketSegmentController.getMarketSegmentById
);

// Protected routes (require authentication)
router.use(auth);

router.post('/', 
  authorize(['admin', 'vendor']),
  marketSegmentValidator.create,
  validate(marketSegmentValidator.create, 'body'),
  marketSegmentController.createMarketSegment
);

router.put('/:marketSegmentId', 
  authorize(['admin', 'vendor']),
  marketSegmentValidator.update,
  validate(marketSegmentValidator.update, 'body'),
  marketSegmentController.updateMarketSegment
);

router.patch('/:marketSegmentId/toggle-status', 
  authorize(['admin', 'vendor']),
  marketSegmentValidator.toggleStatus,
  validate(marketSegmentValidator.toggleStatus, 'params'),
  marketSegmentController.toggleMarketSegmentStatus
);

router.delete('/:marketSegmentId', 
  authorize(['admin']),
  marketSegmentValidator.delete,
  validate(marketSegmentValidator.delete, 'params'),
  marketSegmentController.deleteMarketSegment
);

module.exports = router; 