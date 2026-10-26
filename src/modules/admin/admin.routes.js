const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { authenticate, requireRole } = require('../../shared/middleware/auth.middleware');

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/dashboard', (req, res, next) => adminController.getDashboardStats(req, res, next));

module.exports = router;
