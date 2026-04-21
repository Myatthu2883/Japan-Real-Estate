import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'japan-realestate-secret-2024'

// GET /api/properties — list with optional filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const area = searchParams.get('area')
    const city = searchParams.get('city')
    const q = searchParams.get('q')
    const minPrice = searchParams.get('min_price')
    const maxPrice = searchParams.get('max_price')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = 'SELECT * FROM properties WHERE 1=1'
    const params: any[] = []

    if (type && type !== 'all') {
      query += ' AND type = ?'
      params.push(type)
    }
    if (area) {
      query += ' AND (area LIKE ? OR city LIKE ?)'
      params.push(`%${area}%`, `%${area}%`)
    }
    if (city) {
      query += ' AND city LIKE ?'
      params.push(`%${city}%`)
    }
    if (q) {
      query += ' AND (title LIKE ? OR title_ja LIKE ? OR city LIKE ? OR area LIKE ?)'
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`)
    }
    if (minPrice) {
      query += ' AND price >= ?'
      params.push(Number(minPrice))
    }
    if (maxPrice) {
      query += ' AND price <= ?'
      params.push(Number(maxPrice))
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const [rows] = await pool.query(query, params)
    return NextResponse.json({ properties: rows })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
  }
}

// POST /api/properties — create new listing (auth required)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.slice(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }

    const body = await req.json()
    const {
      title, title_ja, price, price_unit = 'jpy', type,
      area, city, rooms, size, floor, year_built,
      station, description, description_ja, image_url
    } = body

    if (!title || !price || !type || !city) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    const [result]: any = await pool.query(
      `INSERT INTO properties 
       (title, title_ja, price, price_unit, type, area, city, rooms, size, floor, year_built, station, description, description_ja, image_url, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, title_ja, price, price_unit, type, area, city, rooms, size, floor, year_built, station, description, description_ja, image_url, decoded.userId]
    )

    return NextResponse.json({ id: result.insertId, message: 'Property created' }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 })
  }
}
