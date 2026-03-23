// server/server.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const config = require('./config/config');
const { notFound, globalErrorHandler } = require('./middleware/errorHandler');

const app = express();

connectDB();

// ============ UPDATED CORS ============
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://apmock.icu',
  'https://www.apmock.icu',
  // Add any other domains you might use
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(null, true); // Allow all for now, change to callback(new Error('Not allowed by CORS')) to block
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());
// ============================================

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

// Health check - Keep Render awake
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'NETprep API is running',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

// Wake up endpoint
app.get('/api/wake', (req, res) => {
  res.json({ success: true, message: 'Server is awake!', time: new Date().toISOString() });
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
app.use('/api/syllabus', require('./routes/syllabusRoutes'));
app.use('/api/pyq', require('./routes/pyqRoutes'));  // ✅ NEW: PYQ Analysis Hub


// 404 handler
app.use(notFound);

// Global error handler
app.use(globalErrorHandler);

const PORT = config.port || 5000;
const server = app.listen(PORT, () => {
  console.log(`NETprep API running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Allowed Origins: ${allowedOrigins.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
// ─── Keep Alive: Self-ping every 14 min to prevent Render cold starts ───
if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
  const SELF_URL = 'https://netprep-api.onrender.com';
  
  // Pehla ping 30 sec baad (server fully ready hone ke baad)
  setTimeout(() => {
    setInterval(() => {
      require('https').get(`${SELF_URL}/api/health`, (res) => {
        console.log(`[Keep-Alive] ${new Date().toISOString()} - Status: ${res.statusCode}`);
      }).on('error', (err) => {
        console.error(`[Keep-Alive] Failed: ${err.message}`);
      });
    }, 14 * 60 * 1000); // Har 14 minute
    
    console.log('[Keep-Alive] Self-ping scheduled every 14 minutes');
  }, 30000);
}


module.exports = app;