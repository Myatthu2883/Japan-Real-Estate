import { NextRequest, NextResponse } from 'next/server'

async function getConn() {
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) return null
  const mysql = await import('mysql2/promise')
  return mysql.createConnection({
    host:           process.env.DB_HOST,
    user:           process.env.DB_USER,
    password:       process.env.DB_PASSWORD || '',
    database:       process.env.DB_NAME,
    port:           Number(process.env.DB_PORT || 3306),
    connectTimeout: 8000,
  })
}

// GET /api/users/[id] — fetch a single user's public profile
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const conn = await getConn()
  if (!conn) return NextResponse.json({ user: null, source: 'no-db' })

  try {
    const cleanId = String(id).replace(/^db_/, '')
    const [rows]: any = await conn.query(
      'SELECT id, name, email, role, phone, bio, avatar, pref_lang, created_at FROM users WHERE id = ?',
      [cleanId]
    )
    await conn.end()

    if (!rows.length) return NextResponse.json({ user: null }, { status: 404 })
    return NextResponse.json({ user: rows[0] })
  } catch (error: any) {
    try { await conn.end() } catch {}
    return NextResponse.json({ user: null, error: error.message }, { status: 500 })
  }
}

// PATCH /api/users/[id] — update profile fields (name, phone, bio, avatar, password)
// This is called by agent/user profile save and avatar upload.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const conn = await getConn()
  if (!conn) {
    // No DB configured — return ok so localStorage fallback still works in the frontend
    return NextResponse.json({ updated: false, source: 'no-db' })
  }

  try {
    const body = await req.json()
    const {
      name, phone, bio, avatar,
      gender, dateOfBirth, nationality, language,
      lineId, website, specialties, yearsExperience,
      prefLang, notifications, password,
    } = body

    const cleanId = String(id).replace(/^db_/, '')

    // Build dynamic SET clause — only update fields that were actually sent
    const fields: string[] = []
    const values: any[]   = []

    if (name           !== undefined) { fields.push('name = ?');           values.push(name) }
    if (phone          !== undefined) { fields.push('phone = ?');          values.push(phone || null) }
    if (bio            !== undefined) { fields.push('bio = ?');            values.push(bio || null) }
    if (avatar         !== undefined) { fields.push('avatar = ?');         values.push(avatar || null) }
    if (prefLang       !== undefined) { fields.push('pref_lang = ?');      values.push(prefLang) }
    if (notifications  !== undefined) { fields.push('notifications = ?');  values.push(notifications ? 1 : 0) }

    // Extra agent/user fields stored as JSON in the bio column would be lossy.
    // Instead we store them in dedicated columns if they exist, or just skip.
    // For fields the schema doesn't have (gender, dob, etc.) we silently ignore them
    // — they stay in localStorage. Only phone, bio, avatar, name sync to MySQL.

    if (password !== undefined && password.trim()) {
      const bcrypt = await import('bcryptjs')
      const hash = await (bcrypt as any).hash(password, 10)
      fields.push('password_hash = ?')
      values.push(hash)
    }

    if (fields.length === 0) {
      await conn.end()
      return NextResponse.json({ updated: true, source: 'no-changes' })
    }

    fields.push('updated_at = NOW()')
    values.push(cleanId)

    await conn.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    )

    await conn.end()
    return NextResponse.json({ updated: true, source: 'database' })
  } catch (error: any) {
    console.error('[PATCH /api/users]', error.message)
    try { await conn.end() } catch {}
    return NextResponse.json({ updated: false, error: error.message }, { status: 500 })
  }
}
