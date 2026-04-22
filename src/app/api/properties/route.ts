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

// GET /api/properties — list with optional filters
export async function GET(req: NextRequest) {
  const conn = await getConn()
  if (!conn) return NextResponse.json({ properties: [], source: 'no-db' })

  try {
    const { searchParams } = new URL(req.url)
    const type     = searchParams.get('type')
    const area     = searchParams.get('area')
    const city     = searchParams.get('city')
    const q        = searchParams.get('q')
    const minPrice = searchParams.get('min_price')
    const maxPrice = searchParams.get('max_price')
    const limit    = parseInt(searchParams.get('limit')  || '50')
    const offset   = parseInt(searchParams.get('offset') || '0')

    let query = 'SELECT * FROM properties WHERE 1=1'
    const params: any[] = []

    if (type && type !== 'all') { query += ' AND type = ?';                     params.push(type) }
    if (area)                   { query += ' AND (area LIKE ? OR city LIKE ?)'; params.push(`%${area}%`, `%${area}%`) }
    if (city)                   { query += ' AND city LIKE ?';                  params.push(`%${city}%`) }
    if (q)                      { query += ' AND (title LIKE ? OR title_ja LIKE ? OR city LIKE ? OR area LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`) }
    if (minPrice)               { query += ' AND price >= ?';                   params.push(Number(minPrice)) }
    if (maxPrice)               { query += ' AND price <= ?';                   params.push(Number(maxPrice)) }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const [rows] = await conn.query(query, params)
    await conn.end()
    return NextResponse.json({ properties: rows })
  } catch (error: any) {
    try { await conn.end() } catch {}
    console.error('[GET /api/properties]', error.message)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
  }
}

// POST /api/properties — create new listing (auth required, called by agent page)
export async function POST(req: NextRequest) {
  const conn = await getConn()
  if (!conn) return NextResponse.json({ saved: false, source: 'no-db' })

  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      await conn.end()
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const jwt     = await import('jsonwebtoken')
    const token   = authHeader.slice(7)
    const decoded = (jwt as any).verify(token, JWT_SECRET) as { userId: number }

    const body = await req.json()
    const {
      title, title_ja, price, price_unit = 'jpy', type,
      area, city, rooms, size, floor, year_built,
      station, description, description_ja,
      image_url,
      images,        // NEW: array of up to 3 image URLs/base64 strings
    } = body

    if (!title || !price || !type || !city || !area) {
      await conn.end()
      return NextResponse.json({ message: 'Missing required fields: title, price, type, city, area' }, { status: 400 })
    }

    // Store multiple images as JSON string in the `images` column
    const imagesJson = images && images.length > 0 ? JSON.stringify(images) : null
    const primaryUrl = images?.[0] || image_url || null

    const [result]: any = await conn.query(
      `INSERT INTO properties
         (user_id, agent_id, title, title_ja, price, price_unit, type, area, city,
          rooms, size, floor, year_built, station, description, description_ja,
          image_url, images, is_featured, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`,
      [
        decoded.userId, decoded.userId,
        title, title_ja || title,
        Number(price), price_unit, type,
        area, city,
        rooms || null,
        size  ? Number(size) : null,
        floor ? Number(floor) : null,
        year_built ? Number(year_built) : null,
        station     || null,
        description || null,
        description_ja || null,
        primaryUrl,
        imagesJson,
      ]
    )

    await conn.end()
    return NextResponse.json({ id: result.insertId, saved: true, source: 'database' }, { status: 201 })
  } catch (error: any) {
    console.error('[POST /api/properties]', error.message)
    try { await conn.end() } catch {}
    return NextResponse.json({ saved: false, error: error.message }, { status: 500 })
  }
}
