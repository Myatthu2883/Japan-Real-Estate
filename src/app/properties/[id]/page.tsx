'use client'
import { useState, use, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/i18n'
import { useAuth } from '@/lib/auth-context'
import { getPropertyById, getUserById, isSaved, toggleSave, createMessage, type Property, type User } from '@/lib/store'
import AuthModal from '@/components/AuthModal'

function formatPrice(price: number) {
  if (price >= 100000000) return `¥${(price / 100000000).toFixed(1)}億`
  if (price >= 10000) return `¥${Math.round(price / 10000)}万`
  return `¥${price.toLocaleString()}`
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { t, lang } = useLang()
  const { user } = useAuth()
  const router = useRouter()

  const [property, setProperty] = useState<Property | null>(null)
  const [agent, setAgent] = useState<User | null>(null)
  const [saved, setSaved] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactMsg, setContactMsg] = useState('')
  const [msgSent, setMsgSent] = useState(false)
  const [msgError, setMsgError] = useState('')
  const [showLogin, setShowLogin] = useState(false)

  useEffect(() => {
    const p = getPropertyById(id)
    if (!p) { router.push('/properties'); return }
    setProperty(p)
    if (p.agentId) setAgent(getUserById(p.agentId) || null)
    if (user) {
      setSaved(isSaved(user.id, id))
      setContactName(user.name)
      setContactEmail(user.email)
    }
  }, [id, user])

  const handleToggleSave = () => {
    if (!user) { setShowLogin(true); return }
    const newState = toggleSave(user.id, id)
    setSaved(newState)
  }

  const handleContactClick = () => {
    if (!user) { setShowLogin(true); return }
    setShowContact(true)
  }

  const handleSendMessage = () => {
    setMsgError('')
    if (!contactName.trim() || !contactEmail.trim() || !contactMsg.trim()) {
      setMsgError(lang === 'ja' ? '名前・メール・メッセージは必須です' : 'Please fill in name, email, and message')
      return
    }
    if (!property?.agentId) {
      setMsgError('No agent assigned to this property')
      return
    }
    const agent = property?.agentId ? getUserById(property.agentId) : null

    createMessage({
      threadId: `thread_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: 'inquiry',
      propertyId: id,
      fromId: user?.id ?? '',
      fromRole: 'user',
      fromName: contactName,
      fromEmail: contactEmail,
      toId: property.agentId,
      toRole: 'agent',
      toName: agent?.name ?? '',
      toEmail: agent?.email ?? '',
      message: contactMsg,
    })
    setMsgSent(true)
  }

  if (!property) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--ink-muted)' }}>Loading...</div>

  const title = lang === 'ja' && property.titleJa ? property.titleJa : property.title
  const description = lang === 'ja' && property.descriptionJa ? property.descriptionJa : property.description


  const specs = [
    { label: t.price, value: formatPrice(property.price) + (property.type === 'rent' ? '/月' : '') },
    { label: t.size, value: `${property.size}${t.sqm}` },
    { label: t.rooms, value: property.rooms || '—' },
    { label: t.floor, value: property.floor ? `${property.floor}F` : '—' },
    { label: t.year_built, value: property.yearBuilt ? `${property.yearBuilt}年` : '—' },
    { label: t.station, value: property.station || '—' },
  ]

  const isAdminOrAgent = user?.role === 'admin' || user?.role === 'agent'

  return (
    <div style={{ background: 'var(--paper)' }}>
      {/* Breadcrumb */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '12px 0', background: 'var(--card-bg)' }}>
        <div className="container" style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--ink-muted)', alignItems: 'center' }}>
          <Link href="/" style={{ color: 'var(--ink-muted)', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link href="/properties" style={{ color: 'var(--ink-muted)', textDecoration: 'none' }}>{t.nav_properties}</Link>
          <span>›</span>
          <span style={{ color: 'var(--ink)' }}>{title}</span>
        </div>
      </div>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 48, alignItems: 'start' }}>

            {/* ── Left ── */}
            <div>
              {/* Gallery */}
              {(() => {
                // Build image list: use images[] if available, otherwise just imageUrl
                const imgs = (property.images && property.images.length > 0)
                  ? property.images.filter(Boolean)
                  : [property.imageUrl].filter(Boolean)
                if (imgs.length === 1) {
                  return (
                    <div style={{ marginBottom: 40, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <img src={imgs[0]} alt={title} style={{ width: '100%', height: 460, objectFit: 'cover', display: 'block' }} />
                    </div>
                  )
                }
                if (imgs.length === 2) {
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 40, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      {imgs.map((src, i) => <img key={i} src={src} alt={`${title} ${i + 1}`} style={{ width: '100%', height: 400, objectFit: 'cover', display: 'block' }} />)}
                    </div>
                  )
                }
                return (
                  <div className="detail-gallery" style={{ marginBottom: 40 }}>
                    {imgs.slice(0, 3).map((src, i) => (
                      <img key={i} src={src} alt={`${title} ${i + 1}`}
                        style={i === 0 ? { gridColumn: 'span 2' } : {}}
                      />
                    ))}
                  </div>
                )
              })()}

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--accent-red)', textTransform: 'uppercase' }}>{property.city} · {property.area}</span>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 400, margin: '4px 0 8px' }}>{title}</h1>
                  {property.station && <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-muted)', fontSize: 13 }}>{property.station}</p>}
                </div>
                <button
                  onClick={handleToggleSave}
                  title={saved ? 'Remove from saved' : 'Save this property'}
                  style={{ background: saved ? '#fff0f0' : 'var(--card-bg)', border: `1px solid ${saved ? 'var(--accent-red)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '10px 16px', cursor: 'pointer', fontSize: 20, transition: 'all 0.2s', color: saved ? 'var(--accent-red)' : 'var(--ink-muted)', flexShrink: 0 }}
                >
                  {saved ? '♥' : '♡'}
                </button>
              </div>

              {!user && (
                <div style={{ background: 'rgba(139,34,34,0.06)', border: '1px solid rgba(139,34,34,0.2)', borderRadius: 'var(--radius)', padding: '10px 16px', marginBottom: 20, fontSize: 13, color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  🔒 <span><button onClick={() => setShowLogin(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)', textDecoration: 'underline', fontSize: 13, padding: 0 }}>Login</button> to save this property or contact the agent</span>
                </div>
              )}

              {/* Specs */}
              <div className="detail-specs">
                {specs.map(s => (
                  <div key={s.label} className="detail-spec">
                    <p className="detail-spec-label">{s.label}</p>
                    <p className="detail-spec-value">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div style={{ marginTop: 32 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: 16 }}>
                  {lang === 'ja' ? '物件説明' : 'About this property'}
                </h2>
                <div className="divider-jp" style={{ margin: '0 0 20px' }}><span>{lang === 'ja' ? '詳細情報' : 'Details'}</span></div>
                <p style={{ color: 'var(--ink-soft)', lineHeight: 1.85, fontSize: 14 }}>{description || 'No description available.'}</p>
              </div>
            </div>

            {/* ── Right: Price + Agent + Contact ── */}
            <div style={{ position: 'sticky', top: 80 }}>
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 28, marginBottom: 12 }}>
                {/* Price */}
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--accent-indigo)', marginBottom: 4 }}>
                  {formatPrice(property.price)}
                  {property.type === 'rent' && <span style={{ fontSize: '0.6em', opacity: 0.7 }}>/月</span>}
                </div>
                <p style={{ fontSize: 12, letterSpacing: '0.1em', color: 'var(--ink-muted)', marginBottom: 24 }}>
                  {property.type === 'sale' ? t.for_sale : t.for_rent}
                </p>

                {/* Agent card */}
                {agent && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginBottom: 20 }}>
                    <p style={{ fontSize: 11, letterSpacing: '0.15em', color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
                      {lang === 'ja' ? '担当エージェント' : 'Your Agent'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {agent.avatar
                        ? <img src={agent.avatar} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-indigo)', boxShadow: '0 0 0 2px rgba(43,74,107,0.2)' }} />
                        : <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontFamily: 'var(--font-display)', flexShrink: 0 }}>
                          {agent.name.charAt(0)}
                        </div>
                      }
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
                          {agent.name.includes('/') ? agent.name.split('/')[0].trim() : agent.name}
                        </p>
                        {agent.phone && <p style={{ fontSize: 11, color: 'var(--ink-muted)' }}>📞 {agent.phone}</p>}
                      </div>
                    </div>
                    {/* Link to agent profile */}
                    <Link href={`/agents/${agent.id}`} style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: 'var(--accent-indigo)', textDecoration: 'none', borderBottom: '1px solid var(--accent-indigo)' }}>
                      {lang === 'ja' ? 'エージェントのプロフィールを見る →' : 'View Agent Profile →'}
                    </Link>
                  </div>
                )}

                {/* Contact Agent button — hidden for admin/agent */}
                {!isAdminOrAgent && (
                  !showContact ? (
                    <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14 }} onClick={handleContactClick}>
                      {user ? t.contact_agent : (lang === 'ja' ? '🔒 ログインして問い合わせ' : '🔒 Login to Contact Agent')}
                    </button>
                  ) : msgSent ? (
                    <div style={{ textAlign: 'center', padding: '16px 0', background: 'rgba(74,103,65,0.1)', borderRadius: 'var(--radius)', border: '1px solid var(--accent-sage)' }}>
                      <p style={{ color: 'var(--accent-sage)', fontSize: 14, fontWeight: 500 }}>✓ {lang === 'ja' ? 'メッセージを送信しました' : 'Message sent!'}</p>
                      <p style={{ color: 'var(--accent-sage)', fontSize: 11, marginTop: 4, opacity: 0.8 }}>{lang === 'ja' ? 'エージェントが折り返しご連絡します' : 'The agent will contact you soon'}</p>
                    </div>
                  ) : (
                    <div>
                      {msgError && <div className="error-msg" style={{ marginBottom: 12 }}>{msgError}</div>}
                      <div className="form-group">
                        <label>{lang === 'ja' ? 'お名前 *' : 'Your Name *'}</label>
                        <input value={contactName} onChange={e => setContactName(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>{lang === 'ja' ? 'メール *' : 'Email *'}</label>
                        <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>{lang === 'ja' ? '電話（任意）' : 'Phone (optional)'}</label>
                        <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>{lang === 'ja' ? 'メッセージ *' : 'Message *'}</label>
                        <textarea rows={3} value={contactMsg} onChange={e => setContactMsg(e.target.value)}
                          placeholder={lang === 'ja' ? 'この物件について詳しく教えてください...' : 'I am interested in this property...'}
                          style={{ resize: 'vertical' }} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSendMessage}>{t.submit}</button>
                        <button className="btn-outline" onClick={() => setShowContact(false)} style={{ padding: '10px 14px' }}>{t.cancel}</button>
                      </div>
                    </div>
                  )
                )}

                {/* Admin / agent see a note instead */}
                {isAdminOrAgent && (
                  <div style={{ background: 'var(--paper-warm)', borderRadius: 'var(--radius)', padding: '12px 14px', fontSize: 12, color: 'var(--ink-muted)', textAlign: 'center' }}>
                    {user?.role === 'admin' ? 'Viewing as Admin' : 'Viewing as Agent — contact form is for users'}
                  </div>
                )}
              </div>

              <Link href="/properties" className="btn-outline" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                ← {t.back}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {showLogin && <AuthModal onClose={() => setShowLogin(false)} />}
    </div>
  )
}
