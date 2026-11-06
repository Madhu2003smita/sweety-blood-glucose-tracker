const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const createAuthRoutes = require('./routes/authRoutes');
const createReadingsRoutes = require('./routes/readingsRoutes');
const createReportsRoutes = require('./routes/reportsRoutes');
const errorHandler = require('./middleware/errorHandler');

function createApp(pool) {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
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
