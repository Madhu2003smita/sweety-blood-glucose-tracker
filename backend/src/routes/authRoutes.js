const express = require('express');
const createAuthController = require('../controllers/authController');

module.exports = (pool) => {
  const router = express.Router();
  const controller = createAuthController(pool);
  router.post('/register', controller.register);
  router.post('/login', controller.login);
  return router;
};
