'use client'
import { useLang } from '@/lib/i18n'

export default function AboutPage() {
  const { lang } = useLang()

  return (
    <>
      <div style={{ background: 'var(--paper-warm)', padding: '80px 0 60px', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 11, letterSpacing: '0.3em', color: 'var(--accent-red)', textTransform: 'uppercase', marginBottom: 12 }}>会社概要</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 300 }}>
            {lang === 'ja' ? '日本不動産について' : 'About Japan Property'}
          </h1>
          <div className="divider-jp" style={{ margin: '20px auto' }}><span>Our Story</span></div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 300, marginBottom: 20 }}>
                {lang === 'ja' ? '信頼と実績の18年' : '18 Years of Trust & Excellence'}
              </h2>
              <p style={{ color: 'var(--ink-soft)', lineHeight: 1.9, fontSize: 14, marginBottom: 16 }}>
                {lang === 'ja'
                  ? 'Japan Propertyは2006年に東京で創業した不動産会社です。国内外のお客様に対し、日本全国の優良物件をご紹介してまいりました。'
                  : 'Founded in Tokyo in 2006, Japan Property has been connecting discerning buyers with exceptional properties across Japan for over 18 years.'}
              </p>
              <p style={{ color: 'var(--ink-soft)', lineHeight: 1.9, fontSize: 14 }}>
                {lang === 'ja'
                  ? '私たちのチームは日英バイリンガルのエージェントで構成され、外国人のお客様にも安心してご利用いただけます。'
                  : 'Our bilingual team of Japanese and international agents ensures seamless transactions for both domestic and foreign clients.'}
              </p>
            </div>
            <div style={{ background: 'var(--ink)', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '4/3' }}>
              <img src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80" alt="Tokyo skyline" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--paper-warm)' }}>
        <div className="container">
          <div className="section-heading">
            <h2>{lang === 'ja' ? 'チームメンバー' : 'Our Team'}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 28 }}>
            {[
              { name: '田中 健一', en: 'Kenichi Tanaka', role: 'CEO · 代表取締役', bg: 'var(--accent-indigo)' },
              { name: '佐藤 美香', en: 'Mika Sato', role: 'Kyoto Branch · 京都支店長', bg: 'var(--accent-red)' },
              { name: '山田 太郎', en: 'Taro Yamada', role: 'International Sales · 海外担当', bg: 'var(--accent-sage)' },
              { name: '鈴木 花子', en: 'Hanako Suzuki', role: 'Property Manager · 管理部長', bg: 'var(--accent-gold)' },
            ].map(m => (
              <div key={m.name} style={{ textAlign: 'center', background: 'white', borderRadius: 'var(--radius-md)', padding: '32px 24px', border: '1px solid var(--border)' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'var(--font-serif)', fontSize: 22, margin: '0 auto 16px' }}>
                  {m.name.charAt(0)}
                </div>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: 18, marginBottom: 2 }}>{m.name}</p>
                <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 4 }}>{m.en}</p>
                <p style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--accent-red)', opacity: 0.7 }}>{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
