import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'japan-realestate-secret-2024'

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

// GET /api/properties/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const conn = await getConn()
  if (!conn) return NextResponse.json({ property: null, source: 'no-db' })

  try {
    const [rows]: any = await conn.query('SELECT * FROM properties WHERE id = ?', [id])
    await conn.end()
    if (!rows.length) return NextResponse.json({ message: 'Not found' }, { status: 404 })
    return NextResponse.json({ property: rows[0] })
  } catch (error: any) {
    try { await conn.end() } catch {}
    return NextResponse.json({ error: 'Failed to fetch property' }, { status: 500 })
  }
}

// PUT /api/properties/[id] — update a listing (called by agent edit form)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const conn = await getConn()
  if (!conn) return NextResponse.json({ updated: false, source: 'no-db' })

  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      await conn.end()
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const jwt     = await import('jsonwebtoken')
    const token   = authHeader.slice(7)
    const decoded = (jwt as any).verify(token, JWT_SECRET) as { userId: number; role: string }

    const [existing]: any = await conn.query(
      'SELECT user_id, agent_id FROM properties WHERE id = ?',
      [id]
    )
    if (!existing.length) {
      await conn.end()
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const isOwner = existing[0].user_id  === decoded.userId ||
                    existing[0].agent_id === decoded.userId
    if (!isOwner && decoded.role !== 'admin') {
      await conn.end()
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      title, title_ja, price, price_unit, type,
      area, city, rooms, size, floor, year_built,
      station, description, description_ja,
      image_url, images, is_active,
    } = body

    const imagesJson = images && images.length > 0 ? JSON.stringify(images) : null
    const primaryUrl = images?.[0] || image_url || null

    await conn.query(
      `UPDATE properties SET
         title=?, title_ja=?, price=?, price_unit=?, type=?,
         area=?, city=?, rooms=?, size=?, floor=?, year_built=?,
         station=?, description=?, description_ja=?,
         image_url=?, images=?, is_active=?,
         updated_at=NOW()
       WHERE id=?`,
      [
        title, title_ja || title, Number(price), price_unit || 'jpy', type,
        area, city,
        rooms       || null,
        size        ? Number(size)  : null,
        floor       ? Number(floor) : null,
        year_built  ? Number(year_built) : null,
        station     || null,
        description || null,
        description_ja || null,
        primaryUrl,
        imagesJson,
        is_active !== false ? 1 : 0,
        id,
      ]
    )

    await conn.end()
    return NextResponse.json({ updated: true, source: 'database' })
  } catch (error: any) {
    console.error('[PUT /api/properties/id]', error.message)
    try { await conn.end() } catch {}
    return NextResponse.json({ updated: false, error: error.message }, { status: 500 })
  }
}

// DELETE /api/properties/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const conn = await getConn()
  if (!conn) return NextResponse.json({ deleted: false, source: 'no-db' })

  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      await conn.end()
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const jwt     = await import('jsonwebtoken')
    const token   = authHeader.slice(7)
    const decoded = (jwt as any).verify(token, JWT_SECRET) as { userId: number; role: string }

    const [existing]: any = await conn.query(
      'SELECT user_id, agent_id FROM properties WHERE id = ?',
      [id]
    )
    if (!existing.length) {
      await conn.end()
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const isOwner = existing[0].user_id  === decoded.userId ||
                    existing[0].agent_id === decoded.userId
    if (!isOwner && decoded.role !== 'admin') {
      await conn.end()
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    await conn.query('DELETE FROM properties WHERE id = ?', [id])
    await conn.end()
    return NextResponse.json({ deleted: true, source: 'database' })
  } catch (error: any) {
    console.error('[DELETE /api/properties/id]', error.message)
    try { await conn.end() } catch {}
    return NextResponse.json({ deleted: false, error: error.message }, { status: 500 })
  }
}
