'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/i18n'
import { useAuth } from '@/lib/auth-context'
import { getProperties, initStore, type Property } from '@/lib/store'
import PropertyCard from '@/components/PropertyCard'
import AuthModal from '@/components/AuthModal'

const AREAS = ['Tokyo', 'Kyoto', 'Osaka', 'Kanagawa', 'Hokkaido', 'Fukuoka']
const AREAS_JP = ['東京', '京都', '大阪', '神奈川', '北海道', '福岡']

export default function HomePage() {
  const { t, lang } = useLang()
  const { user } = useAuth()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [featured, setFeatured] = useState<Property[]>([])
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    initStore()
    const all = getProperties()
    setFeatured(all.filter(p => p.isFeatured).slice(0, 3))
  }, [])

  // Handle ?login=1 from guard redirects
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('login') === '1' && !user) setShowAuth(true)
    }
  }, [user])

  return (
    <>
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="hero-kamon">Japan Property · 日本不動産</p>
          <h1 className="hero-title">
            {lang === 'ja' && <span className="hero-title-jp">夢の日本不動産を見つけよう</span>}
            {t.hero_title}
          </h1>
          <p className="hero-subtitle">{t.hero_subtitle}</p>
          <div className="hero-search">
            <input
              type="text"
              placeholder={t.hero_search_placeholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && router.push(`/properties?q=${search}`)}
            />
            <button onClick={() => router.push(`/properties?q=${search}`)}>
              {t.hero_btn}
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="stats-bar">
        <div className="stats-inner">
          {[
            { num: '2,400+', enLabel: 'Listings', jaLabel: '掲載物件' },
            { num: '47', enLabel: 'Prefectures', jaLabel: '都道府県' },
            { num: '850+', enLabel: 'Transactions', jaLabel: '仲介実績' },
            { num: '18+', enLabel: 'Years Experience', jaLabel: '年の実績' },
          ].map(s => (
            <div key={s.num} className="stat-item">
              <span className="stat-num">{s.num}</span>
              <span className="stat-label">{lang === 'ja' ? s.jaLabel : s.enLabel}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Areas ── */}
      <section className="section" style={{ background: 'var(--paper-warm)', padding: '48px 0' }}>
        <div className="container">
          <div className="section-heading">
            <h2 style={{ fontSize: '1.6rem' }}>{lang === 'ja' ? '人気エリアから探す' : 'Browse by Area'}</h2>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {AREAS.map((area, i) => (
              <Link key={area} href={`/properties?area=${area}`}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px 28px', textDecoration: 'none', color: 'var(--ink)', transition: 'all 0.2s', minWidth: 110 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-red)'; (e.currentTarget as HTMLElement).style.background = '#fff8f8' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'white' }}
              >
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 4, color: 'var(--accent-red)', opacity: 0.8 }}>{AREAS_JP[i]}</span>
                <span style={{ fontSize: 12, letterSpacing: '0.08em', color: 'var(--ink-muted)' }}>{area}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured ── */}
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <h2>{t.featured}</h2>
            <div className="divider-jp"><span>{t.featured_sub}</span></div>
          </div>
          <div className="properties-grid">
            {featured.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Link href="/properties" className="btn-outline">
              {t.all_props} →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why Us ── */}
      <section className="section" style={{ background: 'var(--ink)', color: 'white' }}>
        <div className="container">
          <div className="section-heading">
            <h2 style={{ color: 'white' }}>{lang === 'ja' ? 'なぜ選ばれるのか' : 'Why Choose Us'}</h2>
            <div className="divider-jp"><span style={{ color: 'var(--accent-gold)' }}>{lang === 'ja' ? '信頼と実績' : 'Trust & Excellence'}</span></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
            {[
              { icon: '◈', en: 'Curated Listings', ja: '厳選物件', desc: lang === 'ja' ? '品質を保証した厳選物件のみご紹介します' : 'Only hand-selected premium properties' },
              { icon: '⊕', en: 'Expert Agents', ja: '専門エージェント', desc: lang === 'ja' ? '経験豊富な専門家がサポートします' : 'Experienced bilingual agents at your service' },
              { icon: '◎', en: 'Transparent Process', ja: '透明なプロセス', desc: lang === 'ja' ? '安心・安全な取引をお約束します' : 'Clear, honest transactions every step' },
              { icon: '⊞', en: 'After-Sales Support', ja: 'アフターサポート', desc: lang === 'ja' ? '購入後も継続してサポートいたします' : 'We stay with you long after closing' },
            ].map(item => (
              <div key={item.en} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--accent-gold)', marginBottom: 12, opacity: 0.8 }}>{item.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'white', marginBottom: 6 }}>
                  {lang === 'ja' ? item.ja : item.en}
                </h3>
                <p style={{ fontSize: 13, opacity: 0.5, lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
