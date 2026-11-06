const fs = require('node:fs/promises');
const path = require('node:path');

async function initializeDatabase(pool) {
  const schema = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
}

module.exports = initializeDatabase;
