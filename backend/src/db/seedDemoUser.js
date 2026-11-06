const bcrypt = require('bcryptjs');

const DEMO_USER = {
  name: 'Demo User',
  email: 'demo@sweety.com',
  password: 'Demo@12345',
};

const DEMO_READINGS = [
  { timeSlot: 'morning_fasting', value: 105 },
  { timeSlot: 'after_breakfast', value: 140 },
  { timeSlot: 'after_lunch', value: 120 },
  { timeSlot: 'after_dinner', value: 115 },
];

async function seedDemoUser(pool) {
  const client = await pool.connect();
  const readingDate = new Date().toISOString().slice(0, 10);

  try {
    await client.query('BEGIN');
    const passwordHash = await bcrypt.hash(DEMO_USER.password, 12);
    await client.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING`,
      [DEMO_USER.name, DEMO_USER.email, passwordHash],
    );

    const userResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [DEMO_USER.email],
    );
    const userId = userResult.rows[0].id;

    for (const reading of DEMO_READINGS) {
      await client.query(
        `INSERT INTO readings (user_id, reading_date, time_slot, value)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, reading_date, time_slot) DO NOTHING`,
        [userId, readingDate, reading.timeSlot, reading.value],
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      error.rollbackError = rollbackError;
    }
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  require('dotenv').config({ path: require('node:path').resolve(__dirname, '../../.env') });
  const pool = require('./pool');

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required.');
    process.exitCode = 1;
    pool.end();
  } else {
    seedDemoUser(pool)
      .then(() => console.log('Demo user and sample readings are ready.'))
      .catch((error) => {
        console.error('Unable to seed the demo user:', error);
        process.exitCode = 1;
      })
      .finally(() => pool.end());
  }
}

module.exports = seedDemoUser;
