require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.query("SELECT NOW()")
  .then((result) => {
    console.log("PostgreSQL Connected Successfully!");
    console.log(result.rows[0]);
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
  })
  .finally(() => pool.end());