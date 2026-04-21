import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'japan-realestate-secret-2024'

async function getPool() {
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) return null
  const mysql = await import('mysql2/promise')
  return mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 5,
  })
}

// GET /api/messages?role=admin|agent|user&userId=xxx
// Returns messages for the current user from the DB
export async function GET(req: NextRequest) {
  const pool = await getPool()
  if (!pool) return NextResponse.json({ messages: [], source: 'no-db' })

  try {
    const { searchParams } = new URL(req.url)
    const role   = searchParams.get('role')
    const userId = searchParams.get('userId')

    if (!role || !userId) {
      return NextResponse.json({ messages: [] })
    }

    let query = 'SELECT * FROM messages WHERE 1=1'
    const params: any[] = []

    if (role === 'admin') {
      query += " AND (type = 'contact' OR to_id = ?)"
      params.push(userId)
    } else if (role === 'agent') {
      query += ' AND to_id = ?'
      params.push(userId)
    } else {
      // user
      query += " AND to_id = ? AND type IN ('reply','direct','inquiry')"
      params.push(userId)
    }

    query += ' ORDER BY created_at DESC'

    const [rows] = await pool.query(query, params)
    return NextResponse.json({ messages: rows, source: 'database' })
  } catch (error: any) {
    console.error('[GET /api/messages]', error.message)
    return NextResponse.json({ messages: [], source: 'error', error: error.message })
  }
}

// POST /api/messages — save a new message to the DB
export async function POST(req: NextRequest) {
  const pool = await getPool()
  if (!pool) return NextResponse.json({ saved: false, source: 'no-db' })

  try {
    const body = await req.json()
    const {
      id, threadId, type,
      fromId, fromRole, fromName, fromEmail,
      toId, toRole, toName, toEmail,
      propertyId, subject, message, status, createdAt,
    } = body

    await pool.query(
      `INSERT INTO messages
        (id, thread_id, type,
         from_id, from_role, from_name, from_email,
         to_id,   to_role,   to_name,   to_email,
         property_id, subject, message, status, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [
        id, threadId, type,
        fromId, fromRole, fromName, fromEmail,
        toId,   toRole,   toName,   toEmail,
        propertyId || null, subject || null, message,
        status || 'new',
        createdAt ? new Date(createdAt) : new Date(),
      ]
    )

    return NextResponse.json({ saved: true, source: 'database' })
  } catch (error: any) {
    console.error('[POST /api/messages]', error.message)
    // Return ok so localStorage still saves
    return NextResponse.json({ saved: false, source: 'error', error: error.message })
  }
}
