import { NextResponse } from 'next/server'

export async function GET() {
  // Check env vars first
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
    return NextResponse.json({
      status: 'ok',
      db: 'disconnected',
      reason: 'Missing environment variables',
      required: ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'],
      fix: 'Add these to your .env.local file and restart the server'
    })
  }

  try {
    const mysql = await import('mysql2/promise')

    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT || 3306),
      connectTimeout: 5000,
    })

    // Count rows in each table
    const [users] = await conn.query('SELECT COUNT(*) AS n FROM users') as any[]
    const [properties] = await conn.query('SELECT COUNT(*) AS n FROM properties') as any[]
    const [messages] = await conn.query('SELECT COUNT(*) AS n FROM messages') as any[]

    await conn.end()

    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      tables: {
        users: users[0].n,
        properties: properties[0].n,
        messages: messages[0].n,
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    return NextResponse.json({
      status: 'ok',         // 200 so the site doesn't break
      db: 'disconnected',
      error: error.message,
      fix: 'Check DB_PASSWORD in .env.local and make sure MySQL is running'
    })
  }
}
