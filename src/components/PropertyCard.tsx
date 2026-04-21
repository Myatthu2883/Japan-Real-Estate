'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useLang } from '@/lib/i18n'
import AuthModal from './AuthModal'
import type { Property } from '@/lib/store'

function formatPrice(price: number) {
  if (price >= 100000000) return `¥${(price / 100000000).toFixed(1)}億`
  if (price >= 10000) return `¥${Math.round(price / 10000)}万`
  return `¥${price.toLocaleString()}`
}

export default function PropertyCard({ property }: { property: Property }) {
  const { lang, t } = useLang()
  const { user } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const title = lang === 'ja' && property.titleJa ? property.titleJa : property.title

  // Non-logged-in users see the card but clicking opens login
  const handleClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault()
      setShowLogin(true)
    }
  }

  return (
    <>
      <Link href={`/properties/${property.id}`} className="property-card" onClick={handleClick}>
        <div className="property-card-img">
          <img src={property.imageUrl || 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600&q=80'} alt={title} loading="lazy" />
          <span className="property-card-badge">{property.type === 'sale' ? t.for_sale : t.for_rent}</span>
        </div>
        <div className="property-card-body">
          <div className="property-card-price">
            {formatPrice(property.price)}
            {property.type === 'rent' && <span style={{ fontSize:'0.65em', opacity:0.7, marginLeft:4 }}>/mo</span>}
          </div>
          <p className="property-card-title">{title}</p>
          <p className="property-card-location">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {property.city}, {property.area}{property.station && ` · ${property.station}`}
          </p>
          <div className="property-card-meta">
            {property.rooms && <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>{property.rooms}</span>}
            <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>{property.size}{t.sqm}</span>
            {property.floor && <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="4"/><polyline points="6 10 12 4 18 10"/></svg>{property.floor}F</span>}
          </div>
          {!user && (
            <div style={{ marginTop:10, padding:'6px 10px', background:'rgba(139,34,34,0.07)', borderRadius:'var(--radius)', fontSize:11, color:'var(--accent-red)', textAlign:'center', letterSpacing:'0.05em' }}>
              🔒 Login to view details
            </div>
          )}
        </div>
      </Link>
      {showLogin && <AuthModal onClose={() => setShowLogin(false)} />}
    </>
  )
}
