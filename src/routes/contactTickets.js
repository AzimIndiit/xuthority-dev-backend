const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation');
const contactTicketController = require('../controllers/contactTicketController');
const contactTicketValidator = require('../validators/contactTicketValidator');

// Public endpoint to create a contact ticket
router.post('/', validate(contactTicketValidator.create), contactTicketController.create);

// Admin endpoints to manage tickets (add admin auth later if needed)
router.get('/', validate(contactTicketValidator.list, 'query'), contactTicketController.list);
router.patch('/:id/status', validate(contactTicketValidator.updateStatus), contactTicketController.updateStatus);
router.get('/:id', contactTicketController.getById);
router.post('/:id/reply', contactTicketController.reply);

module.exports = router;


