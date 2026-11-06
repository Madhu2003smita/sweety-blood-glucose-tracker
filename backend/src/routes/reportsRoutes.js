const express = require('express');
const requireAuth = require('../middleware/auth');
const { createReportsController } = require('../controllers/reportsController');

module.exports = (pool) => {
  const router = express.Router();
  const controller = createReportsController(pool);
  router.use(requireAuth);
  router.get('/daily', controller.daily);
  router.get('/month-to-date', controller.monthToDate);
  router.get('/monthly', controller.monthly);
  return router;
};
