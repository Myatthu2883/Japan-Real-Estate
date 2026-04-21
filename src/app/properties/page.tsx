'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLang } from '@/lib/i18n'
import { useAuth } from '@/lib/auth-context'
import { getProperties, initStore, type Property } from '@/lib/store'
import PropertyCard from '@/components/PropertyCard'
import Link from 'next/link'

function PropertiesContent() {
  const { t, lang } = useLang()
  const { user } = useAuth()
  const searchParams = useSearchParams()

  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all')
  const [areaFilter, setAreaFilter] = useState(searchParams.get('area') || '')
  const [searchQ, setSearchQ] = useState(searchParams.get('q') || '')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [allProps, setAllProps] = useState<Property[]>([])

  useEffect(() => {
    initStore()
    setAllProps(getProperties())
  }, [])

  const filtered = allProps.filter(p => {
    if (!p.isActive) return false
    if (typeFilter !== 'all' && p.type !== typeFilter) return false
    if (areaFilter) {
      const a = areaFilter.toLowerCase()
      if (!p.city.toLowerCase().includes(a) && !p.area.toLowerCase().includes(a)) return false
    }
    if (searchQ) {
      const q = searchQ.toLowerCase()
      if (![p.title, p.titleJa, p.city, p.area, p.station || ''].some(s => s.toLowerCase().includes(q))) return false
    }
    if (minPrice && p.price < Number(minPrice)) return false
    if (maxPrice && p.price > Number(maxPrice)) return false
    return true
  })

  const cities = [...new Set(allProps.map(p => p.city))]

  return (
    <>
      {/* Page header */}
      <div style={{ background: 'var(--paper-warm)', padding: '48px 0 32px', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, letterSpacing: '0.25em', color: 'var(--accent-red)', textTransform: 'uppercase', marginBottom: 6 }}>
                {lang === 'ja' ? '物件一覧' : 'All Listings'}
              </p>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400 }}>{t.all_props}</h1>
              <p style={{ color: 'var(--ink-muted)', fontSize: 13, marginTop: 6 }}>
                {filtered.length} {lang === 'ja' ? '件の物件' : 'properties found'}
              </p>
            </div>
            {/* Only agents/admins can add listings from here */}
            {user && (user.role === 'agent' || user.role === 'admin') && (
              <Link href={user.role === 'agent' ? '/agent' : '/admin'} className="btn-primary" style={{ padding: '10px 20px' }}>
                {t.add_listing} →
              </Link>
            )}
            {!user && (
              <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                <Link href="/?login=1" style={{ color: 'var(--accent-red)' }}>Sign in</Link> to save favourites
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="filter-inner">
          <input type="text" placeholder={lang === 'ja' ? '検索...' : 'Search...'} value={searchQ} onChange={e => setSearchQ(e.target.value)} style={{ minWidth: 200 }} />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">{t.filter_all}</option>
            <option value="sale">{t.filter_sale}</option>
            <option value="rent">{t.filter_rent}</option>
          </select>
          <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)}>
            <option value="">{t.filter_area}: {t.filter_all}</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" placeholder={t.filter_min} value={minPrice} onChange={e => setMinPrice(e.target.value)} style={{ maxWidth: 130 }} />
          <input type="number" placeholder={t.filter_max} value={maxPrice} onChange={e => setMaxPrice(e.target.value)} style={{ maxWidth: 130 }} />
          <button className="btn-outline" onClick={() => { setSearchQ(''); setTypeFilter('all'); setAreaFilter(''); setMinPrice(''); setMaxPrice('') }} style={{ padding: '8px 16px', fontSize: 12 }}>
            {t.reset}
          </button>
        </div>
      </div>

      {/* Grid */}
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container">
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 32, opacity: 0.2, marginBottom: 12 }}>物件なし</p>
              <p style={{ color: 'var(--ink-muted)' }}>{t.no_results}</p>
            </div>
          ) : (
            <div className="properties-grid">
              {filtered.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div style={{ padding: 80, textAlign: 'center', color: 'var(--ink-muted)' }}>Loading...</div>}>
      <PropertiesContent />
    </Suspense>
  )
}
