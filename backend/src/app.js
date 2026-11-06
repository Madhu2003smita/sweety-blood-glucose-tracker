const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const createAuthRoutes = require('./routes/authRoutes');
const createReadingsRoutes = require('./routes/readingsRoutes');
const createReportsRoutes = require('./routes/reportsRoutes');
const errorHandler = require('./middleware/errorHandler');

function createApp(pool) {
  const app = express();
  const allowedOrigins = new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...(process.env.CLIENT_ORIGIN || '').split(',').map((origin) => origin.trim()).filter(Boolean),
  ]);
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      callback(null, !origin || allowedOrigins.has(origin));
    },
  }));
  app.use(express.json({ limit: '20kb' }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', createAuthRoutes(pool));
  app.use('/api/readings', createReadingsRoutes(pool));
  app.use('/api/reports', createReportsRoutes(pool));
  app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
