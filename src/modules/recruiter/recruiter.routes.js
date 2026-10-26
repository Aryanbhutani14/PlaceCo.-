const express = require('express');
const router = express.Router();
const recruiterController = require('./recruiter.controller');
const { authenticate, requireRole } = require('../../shared/middleware/auth.middleware');

// All recruiter routes are protected and require recruiter role
router.use(authenticate);
router.use(requireRole('recruiter'));

// Recruiter Profile
router.get('/profile', (req, res, next) => recruiterController.getProfile(req, res, next));
router.put('/profile', (req, res, next) => recruiterController.updateProfile(req, res, next));

// Dashboard Stats
router.get('/dashboard', (req, res, next) => recruiterController.getDashboardStats(req, res, next));

// Opportunities CRUD
router.post('/opportunities', (req, res, next) => recruiterController.createOpportunity(req, res, next));
router.get('/opportunities', (req, res, next) => recruiterController.getOpportunities(req, res, next));
router.get('/opportunities/:id', (req, res, next) => recruiterController.getOpportunityById(req, res, next));
router.put('/opportunities/:id', (req, res, next) => recruiterController.updateOpportunity(req, res, next));
router.delete('/opportunities/:id', (req, res, next) => recruiterController.deleteOpportunity(req, res, next));

// Applicants View
router.get('/opportunities/:id/applicants', (req, res, next) => recruiterController.getApplicants(req, res, next));
router.get('/applicants', (req, res, next) => recruiterController.getApplicants(req, res, next));

module.exports = router;
