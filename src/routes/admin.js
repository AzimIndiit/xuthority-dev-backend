const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, authorize } = require('../middleware');

// TODO: Implement admin routes

// PATCH /users/:id/verify - Admin verifies vendor profile
router.patch('/users/:id/verify', auth, authorize(['admin']), adminController.verifyVendorProfile);

module.exports = router;
