'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import Guard from '@/components/Guard'
import { useAuth } from '@/lib/auth-context'
import { useDBMessages } from '@/lib/useDBMessages'
import {
  getProperties, getAdminMessages, deleteProperty,
  updateMessageStatus, deleteMessage, createMessage,
  initStore, type Property, type User, type Message
} from '@/lib/store'
import MessageThread from '@/components/MessageThread'

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

function StatCard({ jp, en, value, color, icon }: { jp: string; en: string; value: number; color: string; icon: string }) {
  return (
    <div style={{
      background: 'var(--card-bg)', borderRadius: 'var(--radius-md)',
      padding: '20px 20px 16px',
      borderTop: '1px solid var(--border)',
      borderRight: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      borderLeft: `4px solid ${color}`,
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-muted)', textTransform: 'uppercase' }}>{jp}</p>
        <span style={{ fontSize: 18, opacity: 0.6 }}>{icon}</span>
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{en}</p>
    </div>
  )
}

export default function AdminPanel() {
  return (
    <Guard roles={['admin']}>
      <Suspense fallback={<div style={{ padding: 80, textAlign: 'center' }}>Loading...</div>}>
        <AdminContent />
      </Suspense>
    </Guard>
  )
}

function AdminContent() {
  const { user } = useAuth()
  // Sync DB messages into localStorage on load
  useDBMessages(user?.id ?? '', 'admin', () => {
    if (user) setMessages(getAdminMessages(user.id))
  })
  const searchParams = useSearchParams()
  const router = useRouter()
  const [tab, setTab] = useState(searchParams.get('tab') || 'overview')
  const [properties, setProperties] = useState<Property[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [refresh, setRefresh] = useState(0)
  const [dbSyncDone, setDbSyncDone] = useState(false)

  const [toType, setToType] = useState<'agent'|'user'>('agent')
  const [toId, setToId] = useState('')
  const [composeText, setComposeText] = useState('')
  const [composeSubject, setComposeSubject] = useState('')
  const [composeSent, setComposeSent] = useState(false)

  useEffect(() => { setTab(searchParams.get('tab') || 'overview') }, [searchParams])

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => {
        if (data?.users) {
          setUsers(data.users.map((u: any) => ({
            id: 'db_' + String(u.id), name: u.name, email: u.email,
            passwordHash: '(from database)', role: u.role || 'user',
            phone: u.phone || '', createdAt: u.created_at || new Date().toISOString(),
          })))
        } else setUsers([])
      })
      .catch(() => setUsers([]))
  }, [])

  useEffect(() => {
    if (user) { initStore(); setProperties(getProperties()); setMessages(getAdminMessages(user.id)) }
  }, [user, refresh])

  const doRefresh = () => setRefresh(r => r + 1)

  const go = (t: string) => {
    setTab(t)
    router.push(`/admin?tab=${t}`, { scroll: false })
    initStore(); setProperties(getProperties())
    if (user) setMessages(getAdminMessages(user.id))
  }

  const handleSend = () => {
    const selectedRecipient = [...agents, ...regularUsers].find(u => u.id === toId)
    if (!user || !selectedRecipient || !composeText.trim()) return
    createMessage({
      threadId: `thread_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: 'direct', fromId: user.id, fromRole: 'admin',
      fromName: user.name, fromEmail: user.email,
      toId: selectedRecipient.id, toRole: selectedRecipient.role as 'agent'|'user',
      toName: selectedRecipient.name, toEmail: selectedRecipient.email,
      message: composeText, subject: composeSubject || 'Admin Message',
    })
    setComposeText(''); setComposeSubject(''); setComposeSent(true)
    if (user) setMessages(getAdminMessages(user.id))
    setTimeout(() => setComposeSent(false), 3000)
  }

  const agents = users.filter(u => u.role === 'agent')
  const regularUsers = users.filter(u => u.role === 'user')
  const newCount = messages.filter(m => m.status === 'new').length
  if (!user) return null

  const TABS = [
    { key: 'overview',   label: 'Overview',    icon: '◈', badge: 0 },
    { key: 'properties', label: 'Properties',  icon: '🏠', badge: 0 },
    { key: 'users',      label: 'Users',        icon: '👥', badge: 0 },
    { key: 'messages',   label: 'Messages',    icon: '✉',  badge: newCount },
    { key: 'compose',    label: 'Compose',     icon: '✍',  badge: 0 },
  ]

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a1410 0%, #2d2520 100%)', color: 'white', padding: '36px 0 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', background: 'var(--accent-red)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 22, color: 'white',
              boxShadow: '0 0 0 3px rgba(139,34,34,0.3)',
            }}>A</div>
            <div>
              <p style={{ fontSize: 10, letterSpacing: '0.3em', opacity: 0.4, textTransform: 'uppercase', marginBottom: 3 }}>管理者パネル · Admin Panel</p>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 400 }}>Welcome back, {user.name}</h1>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <p style={{ fontSize: 10, opacity: 0.4, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Today</p>
              <p style={{ fontSize: 13, opacity: 0.7 }}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', overflowX: 'auto', gap: 2 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => go(t.key)} style={{
                position: 'relative', padding: '11px 20px', border: 'none',
                background: tab === t.key ? 'rgba(255,255,255,0.08)' : 'none',
                cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap',
                color: tab === t.key ? 'white' : 'rgba(255,255,255,0.45)',
                borderBottom: `2px solid ${tab === t.key ? 'var(--accent-red)' : 'transparent'}`,
                fontFamily: 'var(--font-body)', transition: 'all 0.2s', marginBottom: -1,
                borderRadius: '3px 3px 0 0',
              }}>
                <span style={{ marginRight: 6 }}>{t.icon}</span>{t.label}
                {t.badge > 0 && (
                  <span style={{
                    position: 'absolute', top: 5, right: 5,
                    minWidth: 17, height: 17, borderRadius: 9,
                    background: 'var(--accent-red)', color: 'white',
                    fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, padding: '0 4px', border: '1.5px solid #1a1410',
                  }}>{t.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 40 }}>
              <StatCard jp="総物件数" en="Properties" value={properties.length} color="var(--accent-indigo)" icon="🏠" />
              <StatCard jp="売買" en="For Sale" value={properties.filter(p => p.type === 'sale').length} color="var(--accent-red)" icon="💴" />
              <StatCard jp="賃貸" en="For Rent" value={properties.filter(p => p.type === 'rent').length} color="var(--accent-sage)" icon="🔑" />
              <StatCard jp="登録ユーザー" en="Total Users" value={users.length} color="var(--accent-gold)" icon="👥" />
              <StatCard jp="エージェント" en="Agents" value={agents.length} color="var(--accent-indigo)" icon="🏅" />
              <StatCard jp="新着メッセージ" en="New Messages" value={newCount} color={newCount > 0 ? 'var(--accent-red)' : 'var(--ink-muted)'} icon="✉" />
            </div>

            <SectionTitle icon="✉" title="Recent Messages" sub="Latest incoming messages — click Reply to respond" />
            {messages.length === 0
              ? <EmptyState icon="封" text="No messages yet." />
              : messages.slice(0, 4).map(m => <MessageThread key={m.id} msg={m} currentUser={user} onRefresh={doRefresh} />)
            }
          </div>
        )}

        {/* ── Properties ── */}
        {tab === 'properties' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
              <SectionTitle icon="🏠" title={`All Properties (${properties.length})`} sub="Manage all listings across agents" />
              <Link href="/properties" className="btn-outline" style={{ fontSize: 12, padding: '8px 18px', whiteSpace: 'nowrap' }}>View Site →</Link>
            </div>

            {properties.length === 0
              ? <EmptyState icon="🏠" text="No properties listed yet." />
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {properties.map(p => {
                    const agent = p.agentId ? users.find(u => u.id === p.agentId) : null
                    return (
                      <div key={p.id} style={{
                        background: 'var(--card-bg)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)', padding: '14px 18px',
                        display: 'flex', alignItems: 'center', gap: 16,
                      }}>
                        {p.imageUrl && (
                          <img src={p.imageUrl} alt="" style={{ width: 72, height: 52, objectFit: 'cover', borderRadius: 'var(--radius)', flexShrink: 0 }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                          <p style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{p.city} · {p.area} · {p.rooms}{agent ? ` · ${agent.name.split('/')[0].trim()}` : ''}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--accent-indigo)' }}>{fmt(p.price)}</span>
                          <span className={`badge badge-${p.type}`}>{p.type}</span>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <Link href={`/properties/${p.id}`} style={{ fontSize: 11, color: 'var(--accent-indigo)', textDecoration: 'none', padding: '5px 10px', border: '1px solid var(--accent-indigo)', borderRadius: 2 }}>View</Link>
                            <button onClick={() => { if (confirm('Delete this property?')) { deleteProperty(p.id); doRefresh() } }}
                              style={{ fontSize: 11, color: 'var(--accent-red)', background: 'none', border: '1px solid rgba(139,34,34,0.3)', padding: '5px 10px', cursor: 'pointer', borderRadius: 2 }}>Delete</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            }
          </div>
        )}

        {/* ── Users ── */}
        {tab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
              <SectionTitle icon="👥" title={`All Users (${users.length})`} sub="Users registered on this device + synced from database" />
              <button className="btn-outline" onClick={() => { setDbSyncDone(false); doRefresh() }} style={{ fontSize: 12, padding: '8px 16px', whiteSpace: 'nowrap' }}>↻ Sync DB</button>
            </div>

            {users.length === 0
              ? <EmptyState icon="👤" text="No users found." />
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {users.map(u => (
                    <div key={u.id} style={{
                      background: 'var(--card-bg)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)', padding: '14px 18px',
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}>
                      {u.avatar
                        ? <img src={u.avatar} alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{
                            width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                            background: u.role === 'admin' ? 'var(--accent-red)' : u.role === 'agent' ? 'var(--accent-indigo)' : 'var(--accent-sage)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600,
                          }}>{u.name.charAt(0)}</div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <p style={{ fontWeight: 500, fontSize: 13 }}>{u.name.includes('/') ? u.name.split('/')[0].trim() : u.name}</p>
                          <span className={`badge badge-${u.role}`}>{u.role}</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.email}{u.phone ? ` · ${u.phone}` : ''} · Joined {new Date(u.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => { setToType(u.role === 'agent' ? 'agent' : 'user'); setToId(u.id); go('compose') }}
                        style={{ fontSize: 12, color: 'var(--accent-indigo)', background: 'rgba(43,74,107,0.07)', border: '1px solid var(--accent-indigo)', padding: '6px 14px', cursor: 'pointer', borderRadius: 2, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        ✉ Message
                      </button>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* ── Messages ── */}
        {tab === 'messages' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <SectionTitle icon="✉" title="Messages" sub="Contact form submissions + direct messages + replies" />
              <button className="btn-outline" onClick={doRefresh} style={{ fontSize: 12, padding: '8px 16px' }}>↻ Refresh</button>
            </div>
            {messages.length === 0
              ? <EmptyState icon="封" text="No messages yet. Messages from users and the contact form will appear here." />
              : messages.map(m => <MessageThread key={m.id} msg={m} currentUser={user} onRefresh={doRefresh} />)
            }
          </div>
        )}

        {/* ── Compose ── */}
        {tab === 'compose' && (
          <div style={{ maxWidth: 600 }}>
            <SectionTitle icon="✍" title="Send a Message" sub="Send a direct message to any agent or user. They will see it in their inbox." />

            {composeSent && (
              <div style={{ background: 'rgba(74,103,65,0.1)', border: '1px solid var(--accent-sage)', borderRadius: 'var(--radius)', padding: '12px 18px', marginBottom: 24, color: 'var(--accent-sage)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                ✓ Message sent successfully!
              </div>
            )}

            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 32 }}>

              {/* Recipient type selector */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Send To</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {(['agent', 'user'] as const).map(type => (
                    <button key={type} onClick={() => { setToType(type); setToId('') }} style={{
                      flex: 1, padding: '10px', border: `1.5px solid ${toType === type ? (type === 'agent' ? 'var(--accent-indigo)' : 'var(--accent-sage)') : 'var(--border)'}`,
                      background: toType === type ? (type === 'agent' ? 'rgba(43,74,107,0.07)' : 'rgba(74,103,65,0.07)') : 'var(--card-bg)',
                      borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13,
                      color: toType === type ? (type === 'agent' ? 'var(--accent-indigo)' : 'var(--accent-sage)') : 'var(--ink-muted)',
                      fontFamily: 'var(--font-body)', fontWeight: toType === type ? 500 : 400, transition: 'all 0.15s',
                    }}>
                      {type === 'agent' ? '🏠 Agent' : '👤 User'}
                    </button>
                  ))}
                </div>
                <select value={toId} onChange={e => setToId(e.target.value)} style={{ width: '100%' }}>
                  <option value="">— Select {toType} —</option>
                  {(toType === 'agent' ? agents : regularUsers).map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name.includes('/') ? u.name.split('/')[0].trim() : u.name} · {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Subject</label>
                <input value={composeSubject} onChange={e => setComposeSubject(e.target.value)} placeholder="e.g. Property availability update" />
              </div>

              <div className="form-group">
                <label>Message *</label>
                <textarea rows={5} value={composeText} onChange={e => setComposeText(e.target.value)}
                  style={{ resize: 'vertical' }} placeholder={`Write your message to the ${toType}…`} />
              </div>

              <button className="btn-primary" style={{ width: '100%', padding: '13px', justifyContent: 'center', fontSize: 14 }}
                onClick={handleSend} disabled={!toId || !composeText.trim()}>
                Send Message ↑
              </button>
            </div>

            {/* Quick-select list */}
            {toId === '' && (toType === 'agent' ? agents : regularUsers).length > 0 && (
              <div style={{ marginTop: 28 }}>
                <p style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
                  Quick Select {toType === 'agent' ? 'Agent' : 'User'}
                </p>
                {(toType === 'agent' ? agents : regularUsers).map(u => (
                  <div key={u.id} onClick={() => setToId(u.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 16px', background: 'var(--card-bg)',
                    border: `1px solid ${toId === u.id ? 'var(--accent-indigo)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)', marginBottom: 8, cursor: 'pointer', transition: 'border-color 0.15s',
                  }}>
                    {u.avatar
                      ? <img src={u.avatar} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'var(--font-display)', fontSize: 15 }}>{u.name.charAt(0)}</div>
                    }
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 500, fontSize: 13 }}>{u.name.includes('/') ? u.name.split('/')[0].trim() : u.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--accent-indigo)', fontFamily: 'var(--font-body)' }}>Select →</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--card-bg)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 40, opacity: 0.12, marginBottom: 12 }}>{icon}</p>
      <p style={{ color: 'var(--ink-muted)', fontSize: 13 }}>{text}</p>
    </div>
  )
}
