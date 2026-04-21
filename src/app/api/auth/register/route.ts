import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json().catch(() => ({}))

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email and password are required' },
        { status: 400 }
      )
    }

    const mysql = await import('mysql2/promise')

    const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  connectTimeout: 5000,
})
    const [existing] = await conn.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any[]

    if (existing.length > 0) {
      await conn.end()
      return NextResponse.json(
        { message: 'Email already exists' },
        { status: 409 }
      )
    }

    await conn.query(
      `INSERT INTO users
      (name, email, password_hash, role, pref_lang, notifications, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, email, password, role || 'user', 'en', 1]
    )

    await conn.end()

    return NextResponse.json({
      success: true,
      message: 'Registered successfully'
    })
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Register failed: ' + error.message },
      { status: 500 }
    )
  }
}