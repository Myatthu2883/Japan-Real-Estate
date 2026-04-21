import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
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
    const [rows] = await conn.query(
      'SELECT id, name, email, role, phone, bio, created_at FROM users ORDER BY created_at DESC'
    ) as any[]
    await conn.end()
    return NextResponse.json({ users: rows as any[] })
  } catch (error: any) {
    return NextResponse.json({ users: [], error: error.message }, { status: 200 })
  }
}
