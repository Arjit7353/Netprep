// server/server.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const config = require('./config/config');
const { notFound, globalErrorHandler } = require('./middleware/errorHandler');

const app = express();

connectDB();

// ============ YAHAN CHANGE KARO ============
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://apmock.icu',
    'https://www.apmock.icu'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// ============================================

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
  });
}

// Health check - Render ko jaagta rakhne ke liye
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'NETprep API is running',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    name: 'NETprep API',
    version: '1.0.0',
    description: 'UGC NET Mock Test Application API'
  });
});

// API Routes
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/tests', require('./routes/testRoutes'));
app.use('/api/attempts', require('./routes/attemptRoutes'));
app.use('/api/translate', require('./routes/translateRoutes'));
app.use('/api/syllabus', require('./routes/syllabusRoutes'));

// 404 handler
app.use(notFound);

// Global error handler
app.use(globalErrorHandler);

const PORT = config.port || 5000;
const server = app.listen(PORT, () => {
  console.log(`NETprep API running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = app;