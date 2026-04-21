import { NextRequest, NextResponse } from 'next/server'

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

// PATCH /api/messages/[id] — update status (new → read → replied)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const pool = await getPool()
  if (!pool) return NextResponse.json({ updated: false, source: 'no-db' })

  try {
    const { status } = await req.json()
    await pool.query('UPDATE messages SET status = ? WHERE id = ?', [status, id])
    return NextResponse.json({ updated: true })
  } catch (error: any) {
    return NextResponse.json({ updated: false, error: error.message })
  }
}

// DELETE /api/messages/[id]?threadId=xxx — delete message + entire thread from DB
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const pool = await getPool()
  if (!pool) return NextResponse.json({ deleted: true, source: 'no-db' })

  try {
    const threadId = req.nextUrl.searchParams.get('threadId')

    // Delete all messages in the thread if threadId provided
    if (threadId) {
      await pool.query('DELETE FROM messages WHERE thread_id = ?', [threadId])
    } else {
      await pool.query('DELETE FROM messages WHERE id = ?', [id])
    }

    return NextResponse.json({ deleted: true, source: 'database' })
  } catch (error: any) {
    console.error('[DELETE /api/messages]', error.message)
    return NextResponse.json({ deleted: true, source: 'error', error: error.message })
  }
}
