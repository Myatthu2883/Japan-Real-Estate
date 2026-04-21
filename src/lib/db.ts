import mysql from 'mysql2/promise'

// On Vercel, each API call is a serverless function.
// We use a small pool with short timeouts to avoid connection leaks.
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  port:     Number(process.env.DB_PORT || 38691),
  waitForConnections: true,
  connectionLimit: 3,       // keep low for serverless
  queueLimit: 0,
  connectTimeout: 10000,    // 10s — Vercel functions timeout at 10s on free plan
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
})

export default pool
