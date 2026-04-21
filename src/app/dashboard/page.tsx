'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Guard from '@/components/Guard'
import { useAuth } from '@/lib/auth-context'
import { useDBMessages } from '@/lib/useDBMessages'
import {
  getSavedByUser, getPropertyById, toggleSave,
  getUserMessages, getUserById, addReplyToMessage, getThreadMessages,
  updateMessageStatus, initStore, deleteUser,
  type Property, type Message
} from '@/lib/store'
import PropertyCard from '@/components/PropertyCard'
import { useLang } from '@/lib/i18n'

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

function EmptyState({ icon, text, cta, ctaHref }: { icon: string; text: string; cta?: string; ctaHref?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px', background: 'var(--card-bg)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
      <p style={{ fontSize: 44, opacity: 0.1, marginBottom: 12 }}>{icon}</p>
      <p style={{ color: 'var(--ink-muted)', fontSize: 13, marginBottom: cta ? 20 : 0 }}>{text}</p>
      {cta && ctaHref && <Link href={ctaHref} className="btn-primary">{cta}</Link>}
    </div>
  )
}

function Avatar({ src, initials, size, color, borderColor, onClick }: {
  src?: string; initials: string; size: number; color: string; borderColor?: string; onClick?: () => void
}) {
  const border = borderColor ? `${size >= 80 ? 4 : 3}px solid ${borderColor}` : 'none'
  return src ? (
    <img src={src} alt="" onClick={onClick} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border, cursor: onClick ? 'pointer' : 'default', display: 'block', flexShrink: 0 }} />
  ) : (
    <div onClick={onClick} style={{ width: size, height: size, borderRadius: '50%', background: color, border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: size * 0.36, color: 'white', cursor: onClick ? 'pointer' : 'default', flexShrink: 0 }}>
      {initials}
    </div>
  )
}

export default function UserDashboard() {
  return (
    <Guard roles={['user']}>
      <Suspense fallback={<div style={{ padding: 80, textAlign: 'center' }}>Loading…</div>}>
        <DashboardContent />
      </Suspense>
    </Guard>
  )
}

function DashboardContent() {
  const { user, updateCurrentUser } = useAuth()
  // Sync DB messages into localStorage on load
  useDBMessages(user?.id ?? '', 'user', () => {
    if (user) setInbox(getUserMessages(user.id))
  })
  const { lang } = useLang()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [tab, setTab] = useState(searchParams.get('tab') || 'saved')
  const [savedProps, setSavedProps] = useState<Property[]>([])
  const [inbox, setInbox] = useState<Message[]>([])
  const [refresh, setRefresh] = useState(0)
  const [editMode, setEditMode] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)

  const [pName, setPName] = useState('')
  const [pPhone, setPPhone] = useState('')
  const [pBio, setPBio] = useState('')
  const [pGender, setPGender] = useState('')
  const [pDob, setPDob] = useState('')
  const [pNationality, setPNationality] = useState('')
  const [pLanguage, setPLanguage] = useState('')
  const [pLineId, setPLineId] = useState('')
  const [pNotify, setPNotify] = useState(true)
  const [pPass, setPPass] = useState('')
  const [pPassNew, setPPassNew] = useState('')
  const [pPassConf, setPPassConf] = useState('')
  const [pMsg, setPMsg] = useState<{ type: 'ok'|'err'; text: string } | null>(null)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => { setTab(searchParams.get('tab') || 'saved') }, [searchParams])

  useEffect(() => {
    if (!user) return
    initStore()
    setSavedProps(getSavedByUser(user.id).map(s => getPropertyById(s.propertyId)).filter(Boolean) as Property[])
    setInbox(getUserMessages(user.id))
    setPName(user.name || ''); setPPhone((user as any).phone || ''); setPBio((user as any).bio || '')
    setPGender((user as any).gender || ''); setPDob((user as any).dateOfBirth || '')
    setPNationality((user as any).nationality || ''); setPLanguage((user as any).language || '')
    setPLineId((user as any).lineId || ''); setPNotify((user as any).notifications !== false)
  }, [user, refresh])

  const doRefresh = () => setRefresh(r => r + 1)
  const go = (t: string) => { setTab(t); router.push(`/dashboard?tab=${t}`, { scroll: false }) }

  const handleUnsave = (propertyId: string) => {
    if (!user) return
    toggleSave(user.id, propertyId); doRefresh()
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !user) return
    if (file.size > 1500000) { setPMsg({ type: 'err', text: 'Image too large. Max 1.5MB.' }); return }
    const reader = new FileReader()
    reader.onload = () => {
      updateCurrentUser({ avatar: reader.result as string })
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
    updateCurrentUser({ name: pName.trim() || user.name, phone: pPhone.trim(), bio: pBio.trim(), gender: pGender as any, dateOfBirth: pDob, nationality: pNationality.trim(), language: pLanguage.trim(), lineId: pLineId.trim(), notifications: pNotify, ...(pPassNew ? { passwordHash: pPassNew } : {}) } as any)
    setPPass(''); setPPassNew(''); setPPassConf('')
    setEditMode(false)
    setPMsg({ type: 'ok', text: '✓ Profile saved!' }); setTimeout(() => setPMsg(null), 4000)
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

  if (!user) return null
  const initials = user.name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const newInbox = inbox.filter(m => m.status === 'new').length
  const genderLabel = (g: string) => ({ male: 'Male / 男性', female: 'Female / 女性', other: 'Other', prefer_not_to_say: 'Prefer not to say' }[g] || '—')

  const TABS = [
    { key: 'saved',   en: `Saved (${savedProps.length})`,                       ja: `お気に入り (${savedProps.length})`, icon: '♡', badge: 0 },
    { key: 'inbox',   en: `Inbox${newInbox>0?` (${newInbox})`:''}`,             ja: `受信箱${newInbox>0?` (${newInbox})`:''}`, icon: '✉', badge: newInbox },
    { key: 'profile', en: 'Profile',                                             ja: 'プロフィール', icon: '👤', badge: 0 },
  ]

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--accent-sage) 0%, #2d4a28 100%)', color: 'white', padding: '36px 0 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, marginBottom: 28 }}>
            <Avatar src={user.avatar} initials={initials} size={60} color="rgba(255,255,255,0.25)" borderColor="rgba(255,255,255,0.6)" />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, letterSpacing: '0.3em', opacity: 0.45, textTransform: 'uppercase', marginBottom: 3 }}>マイページ</p>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem,3vw,1.9rem)', fontWeight: 400 }}>{user.name}</h1>
              <p style={{ fontSize: 12, opacity: 0.55, marginTop: 2 }}>{user.email}</p>
            </div>
            <div style={{ display: 'flex', gap: 24, paddingBottom: 4 }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', lineHeight: 1 }}>{savedProps.length}</p>
                <p style={{ fontSize: 10, opacity: 0.55, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>Saved</p>
              </div>
              {newInbox > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', lineHeight: 1, color: '#ffeb3b' }}>{newInbox}</p>
                  <p style={{ fontSize: 10, opacity: 0.55, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>New</p>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => { go(t.key); setEditMode(false) }} style={{
                position: 'relative', padding: '11px 20px', border: 'none',
                background: tab === t.key ? 'rgba(255,255,255,0.1)' : 'none',
                cursor: 'pointer', fontSize: 13,
                color: tab === t.key ? 'white' : 'rgba(255,255,255,0.5)',
                borderBottom: `2px solid ${tab === t.key ? 'white' : 'transparent'}`,
                fontFamily: 'var(--font-body)', transition: 'all 0.2s', marginBottom: -1,
                borderRadius: '3px 3px 0 0',
              }}>
                <span style={{ marginRight: 6 }}>{t.icon}</span>
                {lang === 'ja' ? t.ja : t.en}
                {(t as any).badge > 0 && <span style={{ position: 'absolute', top: 5, right: 4, minWidth: 16, height: 16, borderRadius: 8, background: '#f44336', color: 'white', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, padding: '0 3px' }}>{(t as any).badge}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>

        {/* ── Saved ── */}
        {tab === 'saved' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
              <SectionTitle icon="♡" title={lang==='ja'?'お気に入り物件':'Saved Properties'} />
              <Link href="/properties" className="btn-outline" style={{ fontSize: 12, padding: '8px 18px', whiteSpace: 'nowrap' }}>
                {lang==='ja'?'物件を探す →':'Browse More →'}
              </Link>
            </div>
            {savedProps.length === 0
              ? <EmptyState icon="♡" text={lang==='ja'?'お気に入りはまだありません':'No saved properties yet. Tap ♡ on any property to save it here.'} cta="Browse Properties" ctaHref="/properties" />
              : (
                <div className="properties-grid">
                  {savedProps.map(p => (
                    <div key={p.id} style={{ position: 'relative' }}>
                      <PropertyCard property={p} />
                      <button onClick={() => handleUnsave(p.id)} title="Remove from saved"
                        style={{ position: 'absolute', top: 52, right: 12, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-red)', zIndex: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* ── Inbox ── */}
        {tab === 'inbox' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <SectionTitle icon="✉" title={lang==='ja'?'受信箱':'Inbox'} sub={lang==='ja'?'エージェントや管理者からのメッセージ':'Messages from agents and admin — reply directly here'} />
              <button className="btn-outline" onClick={doRefresh} style={{ fontSize: 12, padding: '8px 14px' }}>↻</button>
            </div>
            {inbox.length === 0
              ? <EmptyState icon="封" text={lang==='ja'?'まだメッセージはありません':'No messages yet. Contact an agent from a property page to receive replies here.'} cta="Browse Properties" ctaHref="/properties" />
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {inbox.map(msg => (
                    <InboxMessage key={msg.id} msg={msg} currentUser={user} onRefresh={doRefresh} />
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* ── Profile ── */}
        {tab === 'profile' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <SectionTitle icon="👤" title={lang==='ja'?'プロフィール':'My Profile'} />
              <button onClick={() => { setEditMode(e => !e); setPMsg(null) }} className={editMode ? 'btn-outline' : 'btn-primary'} style={{ padding: '9px 22px', fontSize: 13 }}>
                {editMode ? (lang==='ja'?'キャンセル':'Cancel') : (lang==='ja'?'✎ 編集':'✎ Edit Profile')}
              </button>
            </div>

            {pMsg && (
              <div style={{ background: pMsg.type==='ok'?'rgba(74,103,65,0.1)':'rgba(139,34,34,0.08)', border: `1px solid ${pMsg.type==='ok'?'var(--accent-sage)':'var(--accent-red)'}`, borderRadius: 'var(--radius)', padding: '11px 16px', fontSize: 13, color: pMsg.type==='ok'?'var(--accent-sage)':'var(--accent-red)', marginBottom: 24 }}>{pMsg.text}</div>
            )}

            {/* View mode */}
            {!editMode && (
              <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 28, alignItems: 'start' }}>
                <div>
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24, textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                      <Avatar src={user.avatar} initials={initials} size={120} color="var(--accent-sage)" borderColor="var(--accent-sage)" />
                      <span style={{ position: 'absolute', bottom: 6, right: 6, width: 16, height: 16, borderRadius: '50%', background: '#4CAF50', border: '3px solid var(--card-bg)' }} />
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 400, marginBottom: 8 }}>{user.name}</h3>
                    <span className="badge badge-user">User</span>
                  </div>
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      (user as any).phone && { icon: '📞', label: 'Phone', val: (user as any).phone },
                      { icon: '✉', label: 'Email', val: user.email },
                      (user as any).lineId && { icon: '💬', label: 'LINE', val: (user as any).lineId },
                    ].filter(Boolean).map((item: any) => (
                      <div key={item.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 14, marginTop: 1 }}>{item.icon}</span>
                        <div>
                          <p style={{ fontSize: 10, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{item.label}</p>
                          <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{item.val}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
                    <p style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Bio</p>
                    <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.85 }}>{(user as any).bio || 'No bio yet. Click Edit Profile to add one.'}</p>
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
                        { label: 'Notifications', value: pNotify ? 'On ✓' : 'Off' },
                        { label: 'Saved Properties', value: String(savedProps.length) },
                        { label: 'Member Since', value: new Date(user.createdAt).toLocaleDateString() },
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

            {/* Edit mode */}
            {editMode && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Photo */}
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
                    <p style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 16 }}>Profile Photo</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                      <div style={{ position: 'relative' }}>
                        <Avatar src={user.avatar} initials={initials} size={80} color="var(--accent-sage)" borderColor="var(--accent-sage)" />
                        <button onClick={() => avatarRef.current?.click()} style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-sage)', border: '3px solid var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', cursor: 'pointer' }}>✎</button>
                        <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                      </div>
                      <div>
                        <button onClick={() => avatarRef.current?.click()} style={{ fontSize: 13, color: 'var(--accent-sage)', background: 'none', border: '1px solid var(--accent-sage)', padding: '7px 16px', cursor: 'pointer', borderRadius: 'var(--radius)', marginBottom: 5, display: 'block' }}>
                          {user.avatar ? 'Change Photo' : 'Upload Photo'}
                        </button>
                        <p style={{ fontSize: 11, color: 'var(--ink-muted)' }}>JPG, PNG · Max 1.5MB</p>
                      </div>
                    </div>
                  </div>
                  {/* Personal info */}
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
                    <p style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 16 }}>Personal Information</p>
                    <div className="form-group"><label>Full Name</label><input value={pName} onChange={e => setPName(e.target.value)} /></div>
                    <div className="form-group"><label>Email (cannot change)</label><input type="email" value={user.email} disabled /></div>
                    <div className="form-group"><label>Phone</label><input value={pPhone} onChange={e => setPPhone(e.target.value)} placeholder="090-1234-5678" /></div>
                    <div className="form-group"><label>Gender</label><select value={pGender} onChange={e => setPGender(e.target.value)}><option value="">— Select —</option><option value="male">Male / 男性</option><option value="female">Female / 女性</option><option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option></select></div>
                    <div className="form-group"><label>Date of Birth</label><input type="date" value={pDob} onChange={e => setPDob(e.target.value)} /></div>
                    <div className="form-group"><label>Nationality</label><input value={pNationality} onChange={e => setPNationality(e.target.value)} placeholder="Japanese" /></div>
                    <div className="form-group"><label>Language</label><input value={pLanguage} onChange={e => setPLanguage(e.target.value)} placeholder="Japanese, English" /></div>
                    <div className="form-group"><label>LINE ID</label><input value={pLineId} onChange={e => setPLineId(e.target.value)} placeholder="@yourlineid" /></div>
                    <div className="form-group"><label>Bio / About</label><textarea rows={3} value={pBio} onChange={e => setPBio(e.target.value)} style={{ resize: 'vertical' }} placeholder="A short introduction…" /></div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border)', marginTop: 4 }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500 }}>Email Notifications</p>
                        <p style={{ fontSize: 11, color: 'var(--ink-muted)' }}>New property alerts</p>
                      </div>
                      <button onClick={() => setPNotify(n => !n)} style={{ width: 44, height: 24, borderRadius: 12, background: pNotify ? 'var(--accent-sage)' : 'var(--border-strong)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.25s' }}>
                        <span style={{ position: 'absolute', top: 3, left: pNotify ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                      </button>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Password */}
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
                  <div style={{ background: 'var(--paper-warm)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px', fontSize: 12, color: 'var(--ink-muted)' }}>
                    💾 Changes are saved to local storage and will persist after logout.
                  </div>
                  <button className="btn-primary" style={{ padding: 14, justifyContent: 'center', fontSize: 14 }} onClick={handleSaveProfile}>
                    {lang==='ja'?'変更を保存する':'Save All Changes'}
                  </button>
                  <button onClick={handleDeleteProfile} style={{ width: '100%', padding: '12px 18px', background: 'none', color: 'var(--accent-red)', border: '1px solid rgba(139,34,34,0.3)', cursor: 'pointer', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
                    {lang==='ja'?'プロフィールを削除':'Delete Profile'}
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

// ── Inbox message card with chat-style reply ──
function InboxMessage({ msg, currentUser, onRefresh }: { msg: Message; currentUser: any; onRefresh: () => void }) {
  const [open, setOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replySent, setReplySent] = useState(false)
  const [delConfirm, setDelConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fromUser = msg.fromId ? getUserById(msg.fromId) : null
  const property = msg.propertyId ? getPropertyById(msg.propertyId) : null
  const isAdmin = msg.fromRole === 'admin'
  const senderName = fromUser?.name?.includes('/') ? fromUser.name.split('/')[0].trim() : (fromUser?.name || msg.fromName)
  const senderColor = isAdmin ? 'var(--accent-red)' : 'var(--accent-indigo)'
  const threadReplies = (() => {
    const seen = new Set<string>()
    return getThreadMessages(msg.threadId).filter((m: Message) => {
      if (m.id === msg.id) return false   // exclude root
      if (seen.has(m.id)) return false    // deduplicate
      seen.add(m.id)
      return true
    })
  })()

  const handleOpen = () => {
    setOpen(o => !o)
    if (msg.status === 'new') { updateMessageStatus(msg.id, 'read'); onRefresh() }
  }

  const handleReply = () => {
    if (!replyText.trim()) return
    addReplyToMessage(msg.id, currentUser.id, currentUser.name, replyText)
    setReplyText(''); setReplySent(true); onRefresh()
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await fetch(`/api/messages/${encodeURIComponent(msg.id)}?threadId=${encodeURIComponent(msg.threadId)}`, {
        method: 'DELETE',
      })
    } catch { /* network error — still delete locally */ }
    // Delete root + all thread replies from localStorage
    const { getMessages, deleteMessage: del } = await import('@/lib/store')
    getMessages()
      .filter((m: Message) => m.threadId === msg.threadId)
      .forEach((m: Message) => del(m.id))
    onRefresh()
  }

  return (
    <div style={{ background: 'var(--card-bg)', border: `1px solid ${msg.status==='new'?'var(--accent-sage)':'var(--border)'}`, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      {/* Row header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer' }} onClick={handleOpen}>
        {fromUser?.avatar
          ? <img src={fromUser.avatar} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${senderColor}`, flexShrink: 0 }} />
          : <div style={{ width: 44, height: 44, borderRadius: '50%', background: senderColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'var(--font-display)', fontSize: 17, flexShrink: 0 }}>
            {(fromUser?.name || msg.fromName).charAt(0).toUpperCase()}
          </div>
        }
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 500, fontSize: 14 }}>{senderName}</span>
            <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 12, background: isAdmin ? 'rgba(139,34,34,0.1)' : 'rgba(43,74,107,0.1)', color: isAdmin ? 'var(--accent-red)' : 'var(--accent-indigo)', fontWeight: 500 }}>
              {isAdmin ? '🛡 Admin' : '🏠 Agent'}
            </span>
            {msg.status === 'new' && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-sage)', display: 'inline-block' }} />}
            {threadReplies.length > 0 && <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>💬 {threadReplies.length}</span>}
          </div>
          {property
            ? <Link href={`/properties/${property.id}`} style={{ fontSize: 12, color: 'var(--accent-indigo)', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>📍 {property.title}</Link>
            : <p style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{new Date(msg.createdAt).toLocaleString()}</p>
          }
        </div>
        <span style={{ fontSize: 11, color: 'var(--ink-muted)', flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {/* Original message */}
          <div style={{ padding: '14px 18px', background: 'var(--paper)' }}>
            <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 8 }}>{new Date(msg.createdAt).toLocaleString()}</p>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.8, background: 'var(--card-bg)', padding: '12px 16px', borderRadius: 'var(--radius)', borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', borderLeft: `3px solid ${senderColor}` }}>
              {msg.message}
            </div>
          </div>

          {/* Thread replies */}
          {threadReplies.length > 0 && (
            <div style={{ padding: '0 18px 14px', background: 'var(--paper)' }}>
              <p style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Conversation</p>
              {threadReplies.map((t: Message, i: number) => {
                const isMe = t.fromId === currentUser.id
                return (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    {!isMe && (
                      fromUser?.avatar
                        ? <img src={fromUser.avatar} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 30, height: 30, borderRadius: '50%', background: senderColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, flexShrink: 0 }}>{t.fromName.charAt(0)}</div>
                    )}
                    <div style={{ maxWidth: '72%' }}>
                      <div style={{ background: isMe ? 'var(--accent-sage)' : 'var(--card-bg)', color: isMe ? 'white' : 'var(--ink-soft)', padding: '9px 13px', borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px', fontSize: 13, lineHeight: 1.6, border: isMe ? 'none' : '1px solid var(--border)' }}>
                        {t.message}
                      </div>
                      <p style={{ fontSize: 10, color: 'var(--ink-muted)', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
                        {t.fromName.includes('/') ? t.fromName.split('/')[0].trim() : t.fromName} · {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {isMe && (
                      currentUser.avatar
                        ? <img src={currentUser.avatar} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, flexShrink: 0 }}>{currentUser.name.charAt(0)}</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Reply box */}
          <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', background: 'var(--paper-warm)' }}>
            {replySent ? (
              <p style={{ fontSize: 13, color: 'var(--accent-sage)' }}>✓ Reply sent</p>
            ) : (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                {currentUser.avatar
                  ? <img src={currentUser.avatar} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--accent-sage)' }} />
                  : <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, flexShrink: 0 }}>{currentUser.name.charAt(0)}</div>
                }
                <div style={{ flex: 1 }}>
                  <textarea rows={2} value={replyText} onChange={e => setReplyText(e.target.value)}
                    placeholder={`Reply to ${senderName}…`}
                    style={{ width: '100%', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '9px 13px', fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--ink)', background: 'var(--card-bg)', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply() } }}
                  />
                  <p style={{ fontSize: 10, color: 'var(--ink-muted)', marginTop: 2 }}>Enter to send · Shift+Enter for new line</p>
                </div>
                <button className="btn-primary" onClick={handleReply} disabled={!replyText.trim()} style={{ padding: '9px 16px', fontSize: 13, flexShrink: 0, alignSelf: 'flex-start' }}>
                  Send
                </button>
              </div>
            )}
            {fromUser && (
              <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`mailto:${fromUser.email}`} style={{ fontSize: 11, color: 'var(--ink-muted)', textDecoration: 'none', padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 2 }}>↩ Reply by Email</a>
                  {property && <Link href={`/properties/${property.id}`} style={{ fontSize: 11, color: 'var(--accent-indigo)', textDecoration: 'none', padding: '5px 10px', border: '1px solid var(--accent-indigo)', borderRadius: 2 }}>View Property →</Link>}
                </div>
                {delConfirm ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Delete thread?</span>
                    <button onClick={handleDelete} disabled={deleting} style={{ fontSize: 11, padding: '4px 10px', background: 'var(--accent-red)', color: 'white', border: 'none', borderRadius: 2, cursor: 'pointer', opacity: deleting ? 0.6 : 1 }}>
                      {deleting ? '…' : 'Yes'}
                    </button>
                    <button onClick={() => setDelConfirm(false)} style={{ fontSize: 11, padding: '4px 10px', background: 'none', border: '1px solid var(--border)', borderRadius: 2, cursor: 'pointer', color: 'var(--ink-muted)' }}>
                      No
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setDelConfirm(true)} style={{ fontSize: 11, color: 'var(--accent-red)', background: 'none', border: '1px solid rgba(139,34,34,0.25)', padding: '4px 10px', borderRadius: 2, cursor: 'pointer' }}>
                    🗑 Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
