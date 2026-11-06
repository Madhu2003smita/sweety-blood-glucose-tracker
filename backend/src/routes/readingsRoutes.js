const express = require('express');
const requireAuth = require('../middleware/auth');
const createReadingsController = require('../controllers/readingsController');

module.exports = (pool) => {
  const router = express.Router();
  const controller = createReadingsController(pool);
  router.use(requireAuth);
  router.get('/', controller.list);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);
  return router;
};
