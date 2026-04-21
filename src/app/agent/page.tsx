'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import Guard from '@/components/Guard'
import { useAuth } from '@/lib/auth-context'
import { useDBMessages } from '@/lib/useDBMessages'
import {
  getProperties, getAllAgentMessages, updateMessageStatus,
  createMessage, createProperty, updateProperty, deleteProperty,
  updateUser, deleteUser, initStore,
  type Property, type Message, type User
} from '@/lib/store'
import MessageThread from '@/components/MessageThread'
import { useLang } from '@/lib/i18n'

function fmt(p: number) {
  if (p >= 100000000) return `¥${(p/100000000).toFixed(1)}億`
  if (p >= 10000) return `¥${Math.round(p/10000)}万`
  return `¥${p.toLocaleString()}`
}

function SectionTitle({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 400 }}>{title}</h2>
      </div>
      {sub && <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 4, paddingLeft: 30 }}>{sub}</p>}
    </div>
  )
}

function EmptyState({ icon, text, cta, onCta }: { icon: string; text: string; cta?: string; onCta?: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px', background: 'var(--card-bg)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
      <p style={{ fontSize: 40, opacity: 0.12, marginBottom: 12 }}>{icon}</p>
      <p style={{ color: 'var(--ink-muted)', fontSize: 13, marginBottom: cta ? 20 : 0 }}>{text}</p>
      {cta && onCta && <button className="btn-primary" onClick={onCta} style={{ padding: '10px 24px' }}>{cta}</button>}
    </div>
  )
}

function Avatar({ src, initials, size, color, borderColor, onClick }: {
  src?: string; initials: string; size: number; color: string;
  borderColor?: string; onClick?: () => void
}) {
  const border = borderColor ? `${size >= 80 ? 4 : 3}px solid ${borderColor}` : 'none'
  return src ? (
    <img src={src} alt="" onClick={onClick} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border, cursor: onClick ? 'pointer' : 'default', display: 'block', flexShrink: 0 }} />
  ) : (
    <div onClick={onClick} style={{ width: size, height: size, borderRadius: '50%', background: color, border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: size * 0.35, color: 'white', cursor: onClick ? 'pointer' : 'default', flexShrink: 0 }}>
      {initials}
    </div>
  )
}

export default function AgentPanel() {
  return <Guard roles={['agent']}><Suspense fallback={<div style={{ padding: 80, textAlign: 'center' }}>Loading…</div>}><AgentContent /></Suspense></Guard>
}

function AgentContent() {
  const { user, refreshUser, updateCurrentUser } = useAuth()
  // Sync DB messages into localStorage on load
  useDBMessages(user?.id ?? '', 'agent', () => {
    if (user) setMessages(getAllAgentMessages(user.id))
  })
  const { lang } = useLang()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [tab, setTab] = useState(searchParams.get('tab') || 'overview')
  const [myListings, setMyListings] = useState<Property[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [refresh, setRefresh] = useState(0)
  const [editMode, setEditMode] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)
  const [addImages, setAddImages] = useState<string[]>(['', '', ''])
  const addImgRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Property>>({})
  const [editImages, setEditImages] = useState<string[]>(['', '', ''])
  const editImgRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  const emptyForm = { title: '', titleJa: '', price: '', type: 'sale', city: '', area: '', rooms: '', size: '', floor: '', yearBuilt: '', station: '', description: '', descriptionJa: '' }
  const [form, setForm] = useState(emptyForm)
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState(false)

  const [pName, setPName] = useState('')
  const [pPhone, setPPhone] = useState('')
  const [pBio, setPBio] = useState('')
  const [pGender, setPGender] = useState('')
  const [pDob, setPDob] = useState('')
  const [pNationality, setPNationality] = useState('')
  const [pLanguage, setPLanguage] = useState('')
  const [pLineId, setPLineId] = useState('')
  const [pSpecialties, setPSpecialties] = useState('')
  const [pYears, setPYears] = useState('')
  const [pWebsite, setPWebsite] = useState('')
  const [pPass, setPPass] = useState('')
  const [pPassNew, setPPassNew] = useState('')
  const [pPassConf, setPPassConf] = useState('')
  const [pMsg, setPMsg] = useState<{ type: 'ok'|'err'; text: string } | null>(null)
  const [showPass, setShowPass] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => { setTab(searchParams.get('tab') || 'overview') }, [searchParams])

  useEffect(() => {
    if (!user) return
    initStore()
    setMyListings(getProperties().filter(p => p.agentId === user.id || p.userId === user.id))
    setMessages(getAllAgentMessages(user.id))
    setPName(user.name || ''); setPPhone(user.phone || ''); setPBio(user.bio || '')
    setPGender((user as any).gender || ''); setPDob((user as any).dateOfBirth || '')
    setPNationality((user as any).nationality || ''); setPLanguage((user as any).language || '')
    setPLineId((user as any).lineId || ''); setPSpecialties((user as any).specialties || '')
    setPYears((user as any).yearsExperience || ''); setPWebsite((user as any).website || '')
    if (user.avatar) setAvatarPreview(user.avatar)
  }, [user, refresh])

  const doRefresh = () => setRefresh(r => r + 1)
  const go = (t: string) => { setTab(t); router.push(`/agent?tab=${t}`, { scroll: false }) }
  const upd = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))
  const upEdit = (f: string, v: string | boolean) => setEditForm(p => ({ ...p, [f]: v }))

  const makeFileHandler = (imgs: string[], setImgs: (v: string[]) => void, idx: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return
      if (file.size > 2000000) { setAddError('Image too large. Max 2MB.'); return }
      const reader = new FileReader()
      reader.onload = () => { const updated = [...imgs]; updated[idx] = reader.result as string; setImgs(updated) }
      reader.readAsDataURL(file)
    }

  const setAddImage = (idx: number, val: string) => { const u = [...addImages]; u[idx] = val; setAddImages(u) }
  const setEditImage = (idx: number, val: string) => { const u = [...editImages]; u[idx] = val; setEditImages(u) }

  const startEdit = (p: Property) => {
    setEditingId(p.id); setEditForm({ ...p })
    const existing = p.images?.length ? p.images : [p.imageUrl || '']
    const slots = ['', '', '']; existing.slice(0, 3).forEach((img, i) => { slots[i] = img || '' })
    setEditImages(slots)
  }

  const handleSaveEdit = () => {
    if (!editingId) return
    const imgs = editImages.filter(s => s.trim())
    updateProperty(editingId, {
      title: editForm.title, titleJa: editForm.titleJa, price: Number(editForm.price) || 0,
      type: editForm.type, city: editForm.city, area: editForm.area, rooms: editForm.rooms,
      size: Number(editForm.size) || 0, floor: editForm.floor ? Number(editForm.floor) : undefined,
      yearBuilt: editForm.yearBuilt ? Number(editForm.yearBuilt) : undefined, station: editForm.station,
      description: editForm.description, descriptionJa: editForm.descriptionJa,
      imageUrl: imgs[0] || editForm.imageUrl || '', images: imgs.length > 0 ? imgs : undefined,
      isActive: editForm.isActive,
    })
    setEditingId(null); setEditForm({}); setEditImages(['', '', '']); doRefresh()
  }

  const handleAdd = () => {
    setAddError('')
    if (!form.title || !form.price || !form.city || !form.area) { setAddError('Title, Price, City and Area are required'); return }
    if (!user) return
    const imgs = addImages.filter(s => s.trim())
    const primaryUrl = imgs[0] || 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600&q=80'
    createProperty({
      userId: user.id, agentId: user.id, title: form.title, titleJa: form.titleJa || form.title,
      price: Number(form.price), priceUnit: 'jpy', type: form.type as 'sale'|'rent',
      city: form.city, area: form.area, rooms: form.rooms, size: Number(form.size) || 0,
      floor: form.floor ? Number(form.floor) : undefined, yearBuilt: form.yearBuilt ? Number(form.yearBuilt) : undefined,
      station: form.station, description: form.description, descriptionJa: form.descriptionJa,
      imageUrl: primaryUrl, images: imgs.length > 0 ? imgs : undefined, isFeatured: false, isActive: true,
    })
    setAddSuccess(true); setForm(emptyForm); setAddImages(['', '', '']); doRefresh()
    setTimeout(() => { setAddSuccess(false); go('listings') }, 1400)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !user) return
    if (file.size > 1200000) { setPMsg({ type: 'err', text: 'Image too large. Max 1.2MB.' }); return }
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setAvatarPreview(result); updateUser(user.id, { avatar: result }); refreshUser(); doRefresh()
      setPMsg({ type: 'ok', text: 'Photo updated ✓' }); setTimeout(() => setPMsg(null), 2000)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = () => {
    if (!user) return; setPMsg(null)
    if (pPass || pPassNew || pPassConf) {
      if (pPass !== user.passwordHash) { setPMsg({ type: 'err', text: 'Current password is incorrect' }); return }
      if (pPassNew.length < 6) { setPMsg({ type: 'err', text: 'New password must be 6+ characters' }); return }
      if (pPassNew !== pPassConf) { setPMsg({ type: 'err', text: 'Passwords do not match' }); return }
    }
    updateCurrentUser({ name: pName || user.name, phone: pPhone, bio: pBio, gender: pGender as any, dateOfBirth: pDob, nationality: pNationality, language: pLanguage, lineId: pLineId, specialties: pSpecialties, yearsExperience: pYears, website: pWebsite, ...(pPassNew ? { passwordHash: pPassNew } : {}) } as any)
    setPPass(''); setPPassNew(''); setPPassConf('')
    setPMsg({ type: 'ok', text: '✓ Profile saved!' }); setEditMode(false)
    setTimeout(() => setPMsg(null), 3000)
  }

  const handleDeleteProfile = async () => {
    if (!user) return
    if (!confirm('Delete your profile? This cannot be undone.')) return
    try {
      const res = await fetch('/api/auth/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: user.id, email: user.email }) })
      const data = await res.json()
      if (!res.ok) { alert(data.message || 'Failed to delete'); return }
      deleteUser(user.id)
      ;['jp_current_user','jp_token','jp_role'].forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k) })
      window.location.href = '/'
    } catch { alert('Something went wrong') }
  }

  const newCount = messages.filter(m => m.status === 'new').length
  if (!user) return null
  const initials = user.name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const displayName = user.name.includes('/') ? user.name.split('/')[0].trim() : user.name
  const genderLabel = (g: string) => ({ male: 'Male / 男性', female: 'Female / 女性', other: 'Other', prefer_not_to_say: 'Prefer not to say' }[g] || '—')

  const TABS = [
    { key: 'overview',  label: 'Overview',   icon: '◈', badge: 0 },
    { key: 'listings',  label: 'Listings',   icon: '🏠', badge: 0 },
    { key: 'inquiries', label: 'Inquiries',  icon: '✉',  badge: newCount },
    { key: 'add',       label: '+ Add',      icon: '',   badge: 0 },
    { key: 'profile',   label: 'Profile',    icon: '👤', badge: 0 },
  ]

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--accent-indigo) 0%, #1a3050 100%)', color: 'white', padding: '36px 0 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <Avatar src={avatarPreview || undefined} initials={initials} size={56} color="rgba(255,255,255,0.25)" borderColor="rgba(255,255,255,0.55)" />
            <div>
              <p style={{ fontSize: 10, letterSpacing: '0.3em', opacity: 0.4, textTransform: 'uppercase', marginBottom: 3 }}>エージェントパネル · Agent Panel</p>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 400 }}>{displayName}</h1>
              <p style={{ fontSize: 12, opacity: 0.55, marginTop: 2 }}>{user.email}{user.phone ? ` · ${user.phone}` : ''}</p>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 20 }}>
              {[{ label: 'Listings', v: myListings.length }, { label: 'New', v: newCount }].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', lineHeight: 1 }}>{s.v}</p>
                  <p style={{ fontSize: 10, opacity: 0.5, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => go(t.key)} style={{
                position: 'relative', padding: '11px 18px', border: 'none',
                background: tab === t.key ? 'rgba(255,255,255,0.1)' : 'none',
                cursor: 'pointer', fontSize: 13,
                color: tab === t.key ? 'white' : 'rgba(255,255,255,0.5)',
                borderBottom: `2px solid ${tab === t.key ? 'white' : 'transparent'}`,
                fontFamily: 'var(--font-body)', transition: 'all 0.2s', marginBottom: -1,
                borderRadius: '3px 3px 0 0',
              }}>
                {t.icon && <span style={{ marginRight: 5 }}>{t.icon}</span>}{t.label}
                {t.badge > 0 && <span style={{ position: 'absolute', top: 5, right: 4, minWidth: 16, height: 16, borderRadius: 8, background: 'var(--accent-red)', color: 'white', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, padding: '0 3px' }}>{t.badge}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, marginBottom: 40 }}>
              {[
                { jp: '掲載物件', en: 'My Listings', v: myListings.length, c: 'var(--accent-indigo)', icon: '🏠' },
                { jp: '売買', en: 'For Sale', v: myListings.filter(p => p.type === 'sale').length, c: 'var(--accent-red)', icon: '💴' },
                { jp: '賃貸', en: 'For Rent', v: myListings.filter(p => p.type === 'rent').length, c: 'var(--accent-sage)', icon: '🔑' },
                { jp: '新着', en: 'New Messages', v: newCount, c: newCount > 0 ? 'var(--accent-red)' : 'var(--ink-muted)', icon: '✉' },
              ].map(s => (
                <div key={s.en} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius-md)', padding: '18px 20px 14px', borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', borderLeft: `4px solid ${s.c}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-muted)', textTransform: 'uppercase' }}>{s.jp}</p>
                    <span style={{ opacity: 0.5 }}>{s.icon}</span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: s.c, lineHeight: 1.1, margin: '6px 0 2px' }}>{s.v}</p>
                  <p style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{s.en}</p>
                </div>
              ))}
            </div>
            <SectionTitle icon="✉" title="Recent Inquiries" />
            {messages.length === 0
              ? <EmptyState icon="封" text="No messages yet. Inquiries from users will appear here." />
              : messages.slice(0, 3).map(m => <MessageThread key={m.id} msg={m} currentUser={user} onRefresh={doRefresh} />)
            }
          </div>
        )}

        {/* ── Listings ── */}
        {tab === 'listings' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <SectionTitle icon="🏠" title={`My Listings (${myListings.length})`} />
              <button className="btn-primary" onClick={() => go('add')} style={{ padding: '9px 18px', fontSize: 12, whiteSpace: 'nowrap' }}>+ Add Listing</button>
            </div>
            {myListings.length === 0
              ? <EmptyState icon="🏠" text="No listings yet." cta="Add First Listing" onCta={() => go('add')} />
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {myListings.map(p => {
                    const allImgs = p.images?.length ? p.images : [p.imageUrl].filter(Boolean) as string[]
                    return (
                      <div key={p.id} style={{ background: 'var(--card-bg)', border: `1px solid ${editingId === p.id ? 'var(--accent-indigo)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', overflow: 'hidden', transition: 'border-color 0.2s' }}>

                        {/* Collapsed row */}
                        {editingId !== p.id && (
                          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                              {allImgs.slice(0, 2).map((src, i) => (
                                <img key={i} src={src} alt="" style={{ width: 64, height: 52, objectFit: 'cover', borderRadius: 2 }}
                                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                              ))}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                              <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{p.city} · {p.area} · {p.rooms} · {p.size}㎡</p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--accent-indigo)' }}>{fmt(p.price)}</p>
                              <span className={`badge badge-${p.type}`}>{p.type}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                              <Link href={`/properties/${p.id}`} style={{ fontSize: 12, color: 'var(--accent-indigo)', textDecoration: 'none', padding: '5px 10px', border: '1px solid var(--accent-indigo)', borderRadius: 2 }}>View</Link>
                              <button onClick={() => startEdit(p)} style={{ fontSize: 12, color: 'var(--accent-sage)', background: 'none', border: '1px solid var(--accent-sage)', padding: '5px 10px', cursor: 'pointer', borderRadius: 2 }}>✎ Edit</button>
                              <button onClick={() => { if (confirm('Delete this listing?')) { deleteProperty(p.id); doRefresh() } }} style={{ fontSize: 12, color: 'var(--accent-red)', background: 'none', border: '1px solid rgba(139,34,34,0.3)', padding: '5px 10px', cursor: 'pointer', borderRadius: 2 }}>Delete</button>
                            </div>
                          </div>
                        )}

                        {/* Inline edit form */}
                        {editingId === p.id && (
                          <div style={{ padding: '22px 24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 400, color: 'var(--accent-indigo)' }}>✎ Editing: {p.title}</h3>
                              <button onClick={() => { setEditingId(null); setEditImages(['', '', '']) }} className="btn-outline" style={{ fontSize: 12, padding: '6px 14px' }}>Cancel</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                              <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Title (English) *</label><input value={editForm.title || ''} onChange={e => upEdit('title', e.target.value)} /></div>
                              <div className="form-group" style={{ gridColumn: 'span 2' }}><label>タイトル（日本語）</label><input value={editForm.titleJa || ''} onChange={e => upEdit('titleJa', e.target.value)} /></div>
                              <div className="form-group"><label>Price (¥)</label><input type="number" value={editForm.price || ''} onChange={e => upEdit('price', e.target.value)} /></div>
                              <div className="form-group"><label>Type</label><select value={editForm.type || 'sale'} onChange={e => upEdit('type', e.target.value)}><option value="sale">For Sale</option><option value="rent">For Rent</option></select></div>
                              <div className="form-group"><label>City</label><input value={editForm.city || ''} onChange={e => upEdit('city', e.target.value)} /></div>
                              <div className="form-group"><label>Area</label><input value={editForm.area || ''} onChange={e => upEdit('area', e.target.value)} /></div>
                              <div className="form-group"><label>Rooms</label><input value={editForm.rooms || ''} onChange={e => upEdit('rooms', e.target.value)} /></div>
                              <div className="form-group"><label>Size (㎡)</label><input type="number" value={editForm.size || ''} onChange={e => upEdit('size', e.target.value)} /></div>
                              <div className="form-group"><label>Floor</label><input type="number" value={editForm.floor || ''} onChange={e => upEdit('floor', e.target.value)} /></div>
                              <div className="form-group"><label>Year Built</label><input type="number" value={editForm.yearBuilt || ''} onChange={e => upEdit('yearBuilt', e.target.value)} /></div>
                              <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Nearest Station</label><input value={editForm.station || ''} onChange={e => upEdit('station', e.target.value)} /></div>
                              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>Photos (up to 3)</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 8 }}>
                                  {[0,1,2].map(i => (
                                    <div key={i} style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: 10 }}>
                                      <p style={{ fontSize: 10, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Photo {i+1}{i===0?' (main)':''}</p>
                                      {editImages[i] ? (
                                        <div style={{ position: 'relative', marginBottom: 8 }}>
                                          <img src={editImages[i]} alt="" style={{ width: '100%', height: 70, objectFit: 'cover', borderRadius: 2 }} onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                                          <button onClick={() => setEditImage(i, '')} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-red)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 11 }}>×</button>
                                        </div>
                                      ) : (
                                        <div style={{ height: 70, background: 'var(--paper-warm)', borderRadius: 2, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, opacity: 0.25 }}>🖼</div>
                                      )}
                                      <input value={(editImages[i]||'').startsWith('data:') ? '' : editImages[i]||''} onChange={e => setEditImage(i, e.target.value)} placeholder="https://..." style={{ fontSize: 11, marginBottom: 6 }} />
                                      <button onClick={() => editImgRefs[i].current?.click()} style={{ width: '100%', fontSize: 11, padding: '5px', border: '1px solid var(--accent-indigo)', background: 'rgba(43,74,107,0.06)', borderRadius: 2, cursor: 'pointer', color: 'var(--accent-indigo)' }}>📁 Upload</button>
                                      <input ref={editImgRefs[i]} type="file" accept="image/*" style={{ display: 'none' }} onChange={makeFileHandler(editImages, setEditImages, i)} />
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Description (English)</label><textarea rows={2} value={editForm.description||''} onChange={e => upEdit('description', e.target.value)} style={{ resize: 'vertical' }} /></div>
                              <div className="form-group" style={{ gridColumn: 'span 2' }}><label>説明（日本語）</label><textarea rows={2} value={editForm.descriptionJa||''} onChange={e => upEdit('descriptionJa', e.target.value)} style={{ resize: 'vertical' }} /></div>
                              <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--border)', marginBottom: 16 }}>
                                <div><p style={{ fontSize: 13, fontWeight: 500 }}>Active Listing</p><p style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Hidden from users when inactive</p></div>
                                <button onClick={() => upEdit('isActive', !editForm.isActive)} style={{ width: 44, height: 24, borderRadius: 12, background: editForm.isActive ? 'var(--accent-sage)' : 'var(--border-strong)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.25s' }}>
                                  <span style={{ position: 'absolute', top: 3, left: editForm.isActive ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                                </button>
                              </div>
                              <div style={{ gridColumn: 'span 2', display: 'flex', gap: 10 }}>
                                <button className="btn-primary" style={{ padding: '11px 24px' }} onClick={handleSaveEdit}>Save Changes</button>
                                <button className="btn-outline" style={{ padding: '11px 18px' }} onClick={() => { setEditingId(null); setEditImages(['','','']) }}>Cancel</button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            }
          </div>
        )}

        {/* ── Inquiries ── */}
        {tab === 'inquiries' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <SectionTitle icon="✉" title="Inquiries & Messages" sub="Messages from users and admin" />
              <button className="btn-outline" onClick={doRefresh} style={{ fontSize: 12, padding: '8px 14px' }}>↻ Refresh</button>
            </div>
            {messages.length === 0
              ? <EmptyState icon="封" text="No messages yet. When users contact you about a property, it appears here." />
              : messages.map(m => <MessageThread key={m.id} msg={m} currentUser={user} onRefresh={doRefresh} />)
            }
          </div>
        )}

        {/* ── Add Listing ── */}
        {tab === 'add' && (
          <div style={{ maxWidth: 680 }}>
            <SectionTitle icon="+" title="Add New Listing" sub="Fill in the details below to publish a new property" />
            {addSuccess && <div style={{ background: 'rgba(74,103,65,0.1)', border: '1px solid var(--accent-sage)', borderRadius: 'var(--radius)', padding: '12px 18px', marginBottom: 20, color: 'var(--accent-sage)', fontSize: 13 }}>✓ Listing published! Redirecting…</div>}
            {addError && <div className="error-msg" style={{ marginBottom: 16 }}>{addError}</div>}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 28 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Title (English) *</label><input value={form.title} onChange={e => upd('title', e.target.value)} placeholder="e.g. Modern Apartment Shinjuku" /></div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label>タイトル（日本語）</label><input value={form.titleJa} onChange={e => upd('titleJa', e.target.value)} placeholder="新宿区モダンアパートメント" /></div>
                <div className="form-group"><label>Price (¥) *</label><input type="number" value={form.price} onChange={e => upd('price', e.target.value)} placeholder="e.g. 85000000" /></div>
                <div className="form-group"><label>Type *</label><select value={form.type} onChange={e => upd('type', e.target.value)}><option value="sale">For Sale</option><option value="rent">For Rent / 月</option></select></div>
                <div className="form-group"><label>City *</label><input value={form.city} onChange={e => upd('city', e.target.value)} placeholder="Tokyo" /></div>
                <div className="form-group"><label>Area *</label><input value={form.area} onChange={e => upd('area', e.target.value)} placeholder="Shinjuku" /></div>
                <div className="form-group"><label>Rooms</label><input value={form.rooms} onChange={e => upd('rooms', e.target.value)} placeholder="1LDK" /></div>
                <div className="form-group"><label>Size (㎡)</label><input type="number" value={form.size} onChange={e => upd('size', e.target.value)} /></div>
                <div className="form-group"><label>Floor</label><input type="number" value={form.floor} onChange={e => upd('floor', e.target.value)} /></div>
                <div className="form-group"><label>Year Built</label><input type="number" value={form.yearBuilt} onChange={e => upd('yearBuilt', e.target.value)} placeholder="2020" /></div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Nearest Station</label><input value={form.station} onChange={e => upd('station', e.target.value)} placeholder="新宿駅 徒歩5分" /></div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Photos (1–3) — first photo is the main image</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 8 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: 10, background: 'var(--paper)' }}>
                        <p style={{ fontSize: 10, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Photo {i+1}{i===0?' · main':''}</p>
                        {addImages[i] ? (
                          <div style={{ position: 'relative', marginBottom: 8 }}>
                            <img src={addImages[i]} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 2 }} onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                            <button onClick={() => setAddImage(i, '')} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-red)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 11 }}>×</button>
                          </div>
                        ) : (
                          <div style={{ height: 80, background: 'var(--card-bg)', borderRadius: 2, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, opacity: 0.2 }}>🖼</div>
                        )}
                        <input value={(addImages[i]||'').startsWith('data:') ? '' : addImages[i]||''} onChange={e => setAddImage(i, e.target.value)} placeholder="https://..." style={{ fontSize: 11, marginBottom: 6 }} />
                        <button onClick={() => addImgRefs[i].current?.click()} style={{ width: '100%', fontSize: 11, padding: '5px', border: '1px solid var(--accent-indigo)', background: 'rgba(43,74,107,0.06)', borderRadius: 2, cursor: 'pointer', color: 'var(--accent-indigo)' }}>📁 Upload from PC</button>
                        <input ref={addImgRefs[i]} type="file" accept="image/*" style={{ display: 'none' }} onChange={makeFileHandler(addImages, setAddImages, i)} />
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 8 }}>JPG, PNG · Max 2MB per photo · Paste a URL or upload from your computer</p>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Description (English)</label><textarea rows={3} value={form.description} onChange={e => upd('description', e.target.value)} style={{ resize: 'vertical' }} /></div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label>説明（日本語）</label><textarea rows={3} value={form.descriptionJa} onChange={e => upd('descriptionJa', e.target.value)} style={{ resize: 'vertical' }} /></div>
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: 10 }}>
                  <button className="btn-primary" style={{ padding: '13px 28px', fontSize: 14 }} onClick={handleAdd}>Publish Listing</button>
                  <button className="btn-outline" onClick={() => go('listings')} style={{ padding: '13px 18px' }}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Profile ── */}
        {tab === 'profile' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <SectionTitle icon="👤" title="My Profile" />
              <button onClick={() => { setEditMode(e => !e); setPMsg(null) }} className={editMode ? 'btn-outline' : 'btn-primary'} style={{ padding: '9px 22px', fontSize: 13 }}>
                {editMode ? 'Cancel' : '✎ Edit Profile'}
              </button>
            </div>

            {pMsg && (
              <div style={{ background: pMsg.type==='ok'?'rgba(74,103,65,0.1)':'rgba(139,34,34,0.08)', border: `1px solid ${pMsg.type==='ok'?'var(--accent-sage)':'var(--accent-red)'}`, borderRadius: 'var(--radius)', padding: '11px 16px', fontSize: 13, color: pMsg.type==='ok'?'var(--accent-sage)':'var(--accent-red)', marginBottom: 24 }}>{pMsg.text}</div>
            )}

            {!editMode && (
              <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 28, alignItems: 'start' }}>
                {/* Left */}
                <div>
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24, textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                      <Avatar src={avatarPreview||undefined} initials={initials} size={120} color="var(--accent-indigo)" borderColor="var(--accent-indigo)" />
                      <span style={{ position: 'absolute', bottom: 6, right: 6, width: 16, height: 16, borderRadius: '50%', background: '#4CAF50', border: '3px solid var(--card-bg)' }} />
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 400, marginBottom: 4 }}>{displayName}</h3>
                    {user.name.includes('/') && <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 8 }}>{user.name.split('/')[1]?.trim()}</p>}
                    <span className="badge badge-agent">Agent</span>
                  </div>
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      user.phone && { icon: '📞', label: 'Phone', val: user.phone },
                      { icon: '✉', label: 'Email', val: user.email },
                      (user as any).lineId && { icon: '💬', label: 'LINE', val: (user as any).lineId },
                      (user as any).website && { icon: '🌐', label: 'Web', val: (user as any).website },
                    ].filter(Boolean).map((item: any) => (
                      <div key={item.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 15, marginTop: 1 }}>{item.icon}</span>
                        <div>
                          <p style={{ fontSize: 10, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{item.label}</p>
                          <p style={{ fontSize: 12, color: 'var(--ink-soft)', wordBreak: 'break-all' }}>{item.val}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Right */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
                    <p style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Bio</p>
                    <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.85 }}>{user.bio || 'No bio added yet.'}</p>
                  </div>
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
                    <p style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 16 }}>Personal Details</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      {[
                        { label: 'Full Name', value: user.name },
                        { label: 'Gender', value: genderLabel((user as any).gender||'') },
                        { label: 'Date of Birth', value: (user as any).dateOfBirth||'—' },
                        { label: 'Nationality', value: (user as any).nationality||'—' },
                        { label: 'Language', value: (user as any).language||'—' },
                        { label: 'Member Since', value: new Date(user.createdAt).toLocaleDateString() },
                      ].map(item => (
                        <div key={item.label}>
                          <p style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 3 }}>{item.label}</p>
                          <p style={{ fontSize: 13, color: 'var(--ink)' }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
                    <p style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 16 }}>Professional</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      {[
                        { label: 'Specialties', value: (user as any).specialties||'—' },
                        { label: 'Experience', value: (user as any).yearsExperience ? (user as any).yearsExperience+' years' : '—' },
                        { label: 'Total Listings', value: String(myListings.length) },
                        { label: 'New Inquiries', value: String(newCount) },
                      ].map(item => (
                        <div key={item.label}>
                          <p style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 3 }}>{item.label}</p>
                          <p style={{ fontSize: 13, color: 'var(--ink)' }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {editMode && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
                {/* Left column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
                    <p style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 16 }}>Profile Photo</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                      <div style={{ position: 'relative' }}>
                        <Avatar src={avatarPreview||undefined} initials={initials} size={80} color="var(--accent-indigo)" borderColor="var(--accent-indigo)" />
                        <button onClick={() => avatarRef.current?.click()} style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-indigo)', border: '3px solid var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', cursor: 'pointer' }}>✎</button>
                        <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                      </div>
                      <div>
                        <button onClick={() => avatarRef.current?.click()} style={{ fontSize: 13, color: 'var(--accent-indigo)', background: 'none', border: '1px solid var(--accent-indigo)', padding: '7px 16px', cursor: 'pointer', borderRadius: 'var(--radius)', marginBottom: 5, display: 'block' }}>
                          {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                        </button>
                        <p style={{ fontSize: 11, color: 'var(--ink-muted)' }}>JPG, PNG · Max 1.2MB</p>
                      </div>
                    </div>
                  </div>
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
                    <p style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 16 }}>Personal Information</p>
                    <div className="form-group"><label>Full Name</label><input value={pName} onChange={e => setPName(e.target.value)} /></div>
                    <div className="form-group"><label>Email (cannot change)</label><input type="email" value={user.email} disabled /></div>
                    <div className="form-group"><label>Phone</label><input value={pPhone} onChange={e => setPPhone(e.target.value)} placeholder="03-1234-5678" /></div>
                    <div className="form-group"><label>Gender</label><select value={pGender} onChange={e => setPGender(e.target.value)}><option value="">— Select —</option><option value="male">Male / 男性</option><option value="female">Female / 女性</option><option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option></select></div>
                    <div className="form-group"><label>Date of Birth</label><input type="date" value={pDob} onChange={e => setPDob(e.target.value)} /></div>
                    <div className="form-group"><label>Nationality</label><input value={pNationality} onChange={e => setPNationality(e.target.value)} placeholder="Japanese" /></div>
                    <div className="form-group"><label>Language</label><input value={pLanguage} onChange={e => setPLanguage(e.target.value)} placeholder="Japanese, English" /></div>
                    <div className="form-group"><label>LINE ID</label><input value={pLineId} onChange={e => setPLineId(e.target.value)} placeholder="@yourlineid" /></div>
                    <div className="form-group"><label>Website</label><input value={pWebsite} onChange={e => setPWebsite(e.target.value)} placeholder="https://yoursite.com" /></div>
                  </div>
                </div>
                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
                    <p style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 16 }}>Professional Info</p>
                    <div className="form-group"><label>Bio / Introduction</label><textarea rows={5} value={pBio} onChange={e => setPBio(e.target.value)} style={{ resize: 'vertical' }} placeholder="Tell clients about yourself…" /></div>
                    <div className="form-group"><label>Specialties</label><input value={pSpecialties} onChange={e => setPSpecialties(e.target.value)} placeholder="Luxury, Kyoto, Overseas clients" /></div>
                    <div className="form-group"><label>Years of Experience</label><input type="number" value={pYears} onChange={e => setPYears(e.target.value)} placeholder="10" /></div>
                  </div>
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
                    <p style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Change Password</p>
                    <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 16 }}>Leave blank to keep current password</p>
                    {[{ l: 'Current Password', v: pPass, s: setPPass, eye: true }, { l: 'New Password', v: pPassNew, s: setPPassNew, eye: false }, { l: 'Confirm New', v: pPassConf, s: setPPassConf, eye: false }].map((f, i) => (
                      <div key={i} className="form-group">
                        <label>{f.l}</label>
                        <div style={{ position: 'relative' }}>
                          <input type={showPass && f.eye ? 'text' : 'password'} value={f.v} onChange={e => f.s(e.target.value)} placeholder="••••••••" style={{ paddingRight: f.eye ? 44 : 14 }} />
                          {f.eye && <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', fontSize: 14 }}>{showPass ? '🙈' : '👁'}</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="btn-primary" style={{ padding: 14, justifyContent: 'center', fontSize: 14 }} onClick={handleSaveProfile}>Save All Changes</button>
                  <button onClick={handleDeleteProfile} style={{ width: '100%', padding: '12px 18px', background: 'none', color: 'var(--accent-red)', border: '1px solid rgba(139,34,34,0.3)', cursor: 'pointer', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
                    Delete Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
