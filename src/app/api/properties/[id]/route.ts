import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'japan-realestate-secret-2024'

// GET /api/properties/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const [rows]: any = await pool.query('SELECT * FROM properties WHERE id = ?', [id])
    if (!rows.length) return NextResponse.json({ message: 'Not found' }, { status: 404 })
    return NextResponse.json({ property: rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch property' }, { status: 500 })
  }
}

// PUT /api/properties/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.slice(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string }

    const [existing]: any = await pool.query('SELECT user_id FROM properties WHERE id = ?', [id])
    if (!existing.length) return NextResponse.json({ message: 'Not found' }, { status: 404 })

    if (existing[0].user_id !== decoded.userId && decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      title, title_ja, price, price_unit, type,
      area, city, rooms, size, floor, year_built,
      station, description, description_ja, image_url
    } = body

    await pool.query(
      `UPDATE properties SET
        title=?, title_ja=?, price=?, price_unit=?, type=?,
        area=?, city=?, rooms=?, size=?, floor=?, year_built=?,
        station=?, description=?, description_ja=?, image_url=?,
        updated_at=NOW()
       WHERE id=?`,
      [title, title_ja, price, price_unit, type, area, city, rooms, size, floor, year_built, station, description, description_ja, image_url, id]
    )
    return NextResponse.json({ message: 'Property updated' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update property' }, { status: 500 })
  }
}

// DELETE /api/properties/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.slice(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string }

    const [existing]: any = await pool.query('SELECT user_id FROM properties WHERE id = ?', [id])
    if (!existing.length) return NextResponse.json({ message: 'Not found' }, { status: 404 })

    if (existing[0].user_id !== decoded.userId && decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    await pool.query('DELETE FROM properties WHERE id = ?', [id])
    return NextResponse.json({ message: 'Property deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 })
  }
}
