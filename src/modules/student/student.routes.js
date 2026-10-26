const express = require('express');
const router = express.Router();
const studentController = require('./student.controller');
const { authenticate, requireRole } = require('../../shared/middleware/auth.middleware');
const { handleUpload } = require('../../shared/middleware/upload.middleware');

// All student routes are protected and strictly require student role
router.use(authenticate);
router.use(requireRole('student'));

// Dashboard Stats
router.get('/dashboard', (req, res, next) => studentController.getDashboardStats(req, res, next));

// Student Profile
router.get('/profile', (req, res, next) => studentController.getProfile(req, res, next));
router.put('/profile', (req, res, next) => studentController.updateProfile(req, res, next));

// Document Management
router.get('/documents', (req, res, next) => studentController.getDocuments(req, res, next));
router.post('/documents', handleUpload('document'), (req, res, next) => studentController.uploadDocument(req, res, next));
router.delete('/documents/:id', (req, res, next) => studentController.deleteDocument(req, res, next));

// Opportunities & Applications
router.get('/opportunities', (req, res, next) => studentController.getOpportunities(req, res, next));
router.get('/opportunities/:id', (req, res, next) => studentController.getOpportunityById(req, res, next));
router.post('/opportunities/:id/apply', (req, res, next) => studentController.applyForOpportunity(req, res, next));
router.get('/applications', (req, res, next) => studentController.getApplications(req, res, next));

module.exports = router;
