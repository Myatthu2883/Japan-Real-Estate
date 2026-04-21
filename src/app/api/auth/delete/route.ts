import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { id, email } = await req.json().catch(() => ({}))

    if (!email && !id) {
      return NextResponse.json(
        { success: false, message: 'User email or id is required' },
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

    let result

    if (email) {
      const [res]: any = await conn.query(
        'DELETE FROM users WHERE email = ?',
        [email]
      )
      result = res
    } else {
      const cleanId = String(id).replace('db_', '')
      const [res]: any = await conn.query(
        'DELETE FROM users WHERE id = ?',
        [cleanId]
      )
      result = res
    }

    await conn.end()

    if (!result || result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: 'No matching user found in database' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile deleted from database successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Delete failed: ' + error.message,
      },
      { status: 500 }
    )
  }
}