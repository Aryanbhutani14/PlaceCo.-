const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// Ensure database is initialized
require('./shared/db/connection');

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const studentRoutes = require('./modules/student/student.routes');
const recruiterRoutes = require('./modules/recruiter/recruiter.routes');
const adminRoutes = require('./modules/admin/admin.routes');

// Import error handlers
const { errorHandler, notFoundHandler } = require('./shared/middleware/error.middleware');

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '../public')));

// Root route redirects to login
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'PlaceCo Placement Management Portal',
    timestamp: new Date().toISOString()
  });
});

// 404 & Centralized Error Middleware
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
