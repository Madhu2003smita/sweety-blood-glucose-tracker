const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function createAuthController(pool) {
  function createToken(user) {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required.');
    return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  }

  return {
    async register(req, res, next) {
      try {
        const body = req.body && typeof req.body === 'object' ? req.body : {};
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = typeof body.password === 'string' ? body.password : '';

        if (!name || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
          return res.status(400).json({
            message: 'Name and a valid email are required. Password must be at least 8 characters.',
          });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const result = await pool.query(
          'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
          [name, email, passwordHash],
        );
        const user = result.rows[0];
        return res.status(201).json({ user, token: createToken(user) });
      } catch (error) {
        if (error.code === '23505') {
          return res.status(409).json({ message: 'An account with this email already exists.' });
        }
        return next(error);
      }
    },

    async login(req, res, next) {
      try {
        const body = req.body && typeof req.body === 'object' ? req.body : {};
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = typeof body.password === 'string' ? body.password : '';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
          return res.status(400).json({ message: 'A valid email and password are required.' });
        }
        const result = await pool.query(
          'SELECT id, name, email, password_hash FROM users WHERE email = $1',
          [email],
        );
        const user = result.rows[0];
        const passwordMatches = user && await bcrypt.compare(password, user.password_hash);
        if (!passwordMatches) {
          return res.status(401).json({ message: 'Email or password is incorrect.' });
        }
        const safeUser = { id: user.id, name: user.name, email: user.email };
        return res.json({ user: safeUser, token: createToken(safeUser) });
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = createAuthController;
