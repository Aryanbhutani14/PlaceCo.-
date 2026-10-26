const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');

// Public routes
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/logout', (req, res) => authController.logout(req, res));

// Protected session route
router.get('/me', authenticate, (req, res, next) => authController.getCurrentUser(req, res, next));

module.exports = router;
