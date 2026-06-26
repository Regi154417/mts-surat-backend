const mysql = require('mysql2/promise');
require('dotenv').config();

console.log({
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  ssl: {
    rejectUnauthorized: true
  }
});

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Database MySQL terhubung');
    conn.release();
  } catch (err) {
    console.error('❌ Gagal koneksi database:', err);
    process.exit(1);
  }
})();

module.exports = pool;