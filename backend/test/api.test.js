process.env.JWT_SECRET = 'test-secret-that-is-long-enough';
process.env.JWT_EXPIRES_IN = '1h';

const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { newDb } = require('pg-mem');
const createApp = require('../src/app');
const { dateRangeFor } = require('../src/controllers/reportsController');

let app;
let db;
let userToken;
let secondUserToken;
const today = new Date().toISOString().slice(0, 10);

before(async () => {
  db = newDb();
  const { Pool } = db.adapters.createPg();
  const pool = new Pool();
  await require('../src/db/init')(pool);
  app = createApp(pool);
  db.pool = pool;

  const first = await request(app).post('/api/auth/register').send({
    name: 'Avery Sample',
    email: 'avery@example.com',
    password: 'secure-password',
  });
  assert.equal(first.status, 201);
  userToken = first.body.token;

  const second = await request(app).post('/api/auth/register').send({
    name: 'Jordan Sample',
    email: 'jordan@example.com',
    password: 'secure-password',
  });
  assert.equal(second.status, 201);
  secondUserToken = second.body.token;
});

after(async () => {
  if (db && db.pool) await db.pool.end();
});

test('registers users with hashed passwords and logs in', async () => {
  const stored = await db.pool.query('SELECT password_hash FROM users WHERE email = $1', ['avery@example.com']);
  assert.notEqual(stored.rows[0].password_hash, 'secure-password');
  const response = await request(app).post('/api/auth/login').send({
    email: 'AVERY@example.com',
    password: 'secure-password',
  });
  assert.equal(response.status, 200);
  assert.equal(response.body.user.email, 'avery@example.com');
  assert.ok(response.body.token);
  assert.equal(Object.hasOwn(response.body.user, 'password_hash'), false);
});

test('rejects duplicate registrations and invalid authentication input', async () => {
  const duplicate = await request(app).post('/api/auth/register').send({
    name: 'Avery Sample',
    email: 'AVERY@example.com',
    password: 'secure-password',
  });
  assert.equal(duplicate.status, 409);
  assert.match(duplicate.body.message, /already exists/i);

  const missingRegistrationFields = await request(app).post('/api/auth/register').send({
    name: 'Missing Email',
    password: 'secure-password',
  });
  assert.equal(missingRegistrationFields.status, 400);

  const missingLoginFields = await request(app).post('/api/auth/login').send({ email: 'not-an-email' });
  assert.equal(missingLoginFields.status, 400);
});

test('rejects login with an incorrect password', async () => {
  const response = await request(app).post('/api/auth/login').send({
    email: 'avery@example.com',
    password: 'incorrect-password',
  });
  assert.equal(response.status, 401);
  assert.match(response.body.message, /incorrect/i);
});

test('accepts a valid JWT and rejects missing or invalid tokens', async () => {
  const authorized = await request(app).get('/api/readings')
    .set('Authorization', `Bearer ${userToken}`);
  assert.equal(authorized.status, 200);

  const missing = await request(app).get('/api/readings');
  assert.equal(missing.status, 401);

  const invalid = await request(app).get('/api/readings')
    .set('Authorization', 'Bearer invalid-token');
  assert.equal(invalid.status, 401);
});

test('allows the configured local frontend origin through CORS', async () => {
  const response = await request(app).options('/api/auth/register')
    .set('Origin', 'http://localhost:5173')
    .set('Access-Control-Request-Method', 'POST');
  assert.equal(response.headers['access-control-allow-origin'], 'http://localhost:5173');
  assert.match(response.headers['access-control-allow-methods'], /POST/);
});

test('rejects invalid glucose values', async () => {
  for (const value of [39, 601, 88.5, '']) {
    const response = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ date: today, timeSlot: 'morning_fasting', value });
    assert.equal(response.status, 400);
    assert.ok(response.body.errors.value);
  }
});

test('rejects duplicate time slots per user and day', async () => {
  const payload = { date: today, timeSlot: 'morning_fasting', value: 105 };
  const first = await request(app).post('/api/readings')
    .set('Authorization', `Bearer ${userToken}`).send(payload);
  const second = await request(app).post('/api/readings')
    .set('Authorization', `Bearer ${userToken}`).send(payload);
  assert.equal(first.status, 201);
  assert.equal(second.status, 409);
});

test('allows no more than the four supported time slots per day', async () => {
  const slots = ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'];
  for (const [index, timeSlot] of slots.entries()) {
    const response = await request(app).post('/api/readings')
      .set('Authorization', `Bearer ${secondUserToken}`)
      .send({ date: today, timeSlot, value: 100 + index });
    assert.equal(response.status, 201);
  }
  const invalidFifth = await request(app).post('/api/readings')
    .set('Authorization', `Bearer ${secondUserToken}`)
    .send({ date: today, timeSlot: 'bedtime', value: 110 });
  assert.equal(invalidFifth.status, 400);
});

test('rejects future reading dates', async () => {
  const future = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const response = await request(app).post('/api/readings')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ date: future, timeSlot: 'after_breakfast', value: 111 });
  assert.equal(response.status, 400);
  assert.match(response.body.errors.date, /Future dates/);
});

test('isolates readings and mutations by authenticated user', async () => {
  const created = await request(app).post('/api/readings')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ date: today, timeSlot: 'after_lunch', value: 122 });
  const secondUserReadings = await request(app).get('/api/readings')
    .set('Authorization', `Bearer ${secondUserToken}`);
  assert.equal(secondUserReadings.status, 200);
  assert.equal(secondUserReadings.body.readings.length, 4);

  const foreignUpdate = await request(app).put(`/api/readings/${created.body.reading.id}`)
    .set('Authorization', `Bearer ${secondUserToken}`)
    .send({ date: today, timeSlot: 'after_lunch', value: 130 });
  const foreignDelete = await request(app).delete(`/api/readings/${created.body.reading.id}`)
    .set('Authorization', `Bearer ${secondUserToken}`);
  assert.equal(foreignUpdate.status, 404);
  assert.equal(foreignDelete.status, 404);

  const ownUpdate = await request(app).put(`/api/readings/${created.body.reading.id}`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({ date: today, timeSlot: 'after_lunch', value: 126 });
  assert.equal(ownUpdate.status, 200);
  assert.equal(ownUpdate.body.reading.value, 126);
});

test('returns daily report statistics, rounded average, and individual readings', async () => {
  const response = await request(app).get('/api/reports/daily')
    .query({ date: today })
    .set('Authorization', `Bearer ${userToken}`);
  assert.equal(response.status, 200);
  assert.equal(response.body.total, 2);
  assert.equal(response.body.lowest, 105);
  assert.equal(response.body.highest, 126);
  assert.equal(response.body.average, 115.5);
  assert.equal(response.body.readings.length, 2);
  assert.deepEqual(
    response.body.readings.map((reading) => reading.timeSlot),
    ['morning_fasting', 'after_lunch'],
  );
});

test('calculates month-to-date and prior full-month report ranges', () => {
  assert.deepEqual(dateRangeFor('month-to-date', '2024-03-15'), {
    start: '2024-03-01',
    end: '2024-03-15',
  });
  assert.deepEqual(dateRangeFor('monthly', '2024-03-15'), {
    start: '2024-02-01',
    end: '2024-02-29',
  });
  assert.deepEqual(dateRangeFor('monthly', '2025-01-15'), {
    start: '2024-12-01',
    end: '2024-12-31',
  });
});
