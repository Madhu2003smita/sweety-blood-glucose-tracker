require('dotenv').config();
const pool = require('./db/pool');
const initializeDatabase = require('./db/init');
const createApp = require('./app');

async function start() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required.');
  await initializeDatabase(pool);
  const port = Number(process.env.PORT) || 4000;
  createApp(pool).listen(port, () => {
    console.log(`Sweety API listening on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('Unable to start Sweety API:', error);
  process.exitCode = 1;
});
