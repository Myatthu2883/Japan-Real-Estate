import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || 'eugXIsxSlzRIJVRKMIZehteBsRbzMopj',
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 38691),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

export default pool