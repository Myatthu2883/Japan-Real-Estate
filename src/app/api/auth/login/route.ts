import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'japan-realestate-secret-2024'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json().catch(() => ({}))

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password required' },
        { status: 400 }
      )
    }

    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
      return NextResponse.json(
        {
          message: 'Database not configured',
          detail: 'Missing DB_HOST, DB_USER, or DB_NAME in .env.local',
          dbError: true,
        },
        { status: 503 }
      )
    }

    const mysql = await import('mysql2/promise')
    const jwt = await import('jsonwebtoken')

    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT || 38691),
    })

    const [rows] = await conn.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    ) as any[]

    await conn.end()

    if (!rows.length) {
      return NextResponse.json(
        { message: 'No account found with that email' },
        { status: 401 }
      )
    }

    const user = rows[0]

    const valid = password === user.password_hash

    if (!valid) {
      return NextResponse.json(
        { message: 'Incorrect password' },
        { status: 401 }
      )
    }

    const token = (jwt as any).sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error: any) {
    console.error('[login]', error.message)
    return NextResponse.json(
      {
        message: 'Database error: ' + error.message,
        dbError: true,
      },
      { status: 500 }
    )
  }
}