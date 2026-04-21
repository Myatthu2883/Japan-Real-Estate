'use client'
import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getUserById, getProperties, type User, type Property } from '@/lib/store'
import { useAuth } from '@/lib/auth-context'
import { useLang } from '@/lib/i18n'
import PropertyCard from '@/components/PropertyCard'

function fmt(p: number) {
  if (p >= 100000000) return `¥${(p/100000000).toFixed(1)}億`
  if (p >= 10000) return `¥${Math.round(p/10000)}万`
  return `¥${p.toLocaleString()}`
}

export default function AgentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const { lang } = useLang()
  const router = useRouter()
  const [agent, setAgent] = useState<User | null>(null)
  const [listings, setListings] = useState<Property[]>([])

  useEffect(() => {
    const a = getUserById(id)
    if (!a || a.role !== 'agent') { router.push('/properties'); return }
    setAgent(a)
    setListings(getProperties().filter(p => p.agentId === id && p.isActive))
  }, [id])

  if (!agent) return <div style={{ padding:80, textAlign:'center', color:'var(--ink-muted)' }}>Loading...</div>

  const initials = agent.name.split(' ').filter(Boolean).map((n:string)=>n[0]).join('').toUpperCase().slice(0,2)
  const displayName = agent.name.includes('/') ? agent.name.split('/')[0].trim() : agent.name

  return (
    <div style={{ background:'var(--paper)', minHeight:'100vh' }}>
      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg, var(--accent-indigo) 0%, #1a3050 100%)', color:'white', padding:'64px 0' }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', gap:32, flexWrap:'wrap' }}>
            {agent.avatar
              ? <img src={agent.avatar} alt={displayName} style={{ width:120, height:120, borderRadius:'50%', objectFit:'cover', border:'4px solid rgba(255,255,255,0.4)', flexShrink:0 }} />
              : <div style={{ width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'4px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:44, color:'white', flexShrink:0 }}>{initials}</div>
            }
            <div>
              <p style={{ fontSize:11, letterSpacing:'0.25em', opacity:0.55, textTransform:'uppercase', marginBottom:8 }}>Property Specialist · 不動産エージェント</p>
              <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2rem,4vw,3rem)', fontWeight:300, marginBottom:8 }}>{displayName}</h1>
              {agent.name.includes('/') && <p style={{ fontFamily:'var(--font-serif)', fontSize:'1.1rem', opacity:0.7, marginBottom:12 }}>{agent.name.split('/')[1]?.trim()}</p>}
              <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                {agent.phone && <span style={{ fontSize:13, opacity:0.8 }}>📞 {agent.phone}</span>}
                <span style={{ fontSize:13, opacity:0.8 }}>✉ {agent.email}</span>
                <span style={{ fontSize:13, opacity:0.6 }}>{listings.length} {lang==='ja'?'掲載物件':'listings'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop:48, paddingBottom:60 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:48, alignItems:'start' }}>

          {/* Left */}
          <div>
            {agent.bio && (
              <div style={{ marginBottom:48 }}>
                <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', fontWeight:400, marginBottom:16 }}>
                  {lang==='ja'?'自己紹介':'About'}
                </h2>
                <div className="divider-jp" style={{ margin:'0 0 20px' }}><span>{lang==='ja'?'プロフィール':'Profile'}</span></div>
                <p style={{ color:'var(--ink-soft)', lineHeight:1.85, fontSize:14 }}>{agent.bio}</p>
              </div>
            )}

            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', fontWeight:400, marginBottom:16 }}>
              {lang==='ja'?'掲載物件':'Listings'} ({listings.length})
            </h2>
            <div className="divider-jp" style={{ margin:'0 0 24px' }}><span>{lang==='ja'?'物件一覧':'Properties'}</span></div>
            {listings.length===0
              ? <p style={{ color:'var(--ink-muted)', fontSize:13 }}>No active listings.</p>
              : <div className="properties-grid">{listings.map(p => <PropertyCard key={p.id} property={p} />)}</div>
            }
          </div>

          {/* Right: Contact card */}
          <div style={{ position:'sticky', top:80 }}>
            <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:28 }}>
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', fontWeight:400, marginBottom:6 }}>
                {lang==='ja'?'お問い合わせ':'Contact Agent'}
              </h3>
              <p style={{ fontSize:11, letterSpacing:'0.15em', color:'var(--ink-muted)', marginBottom:20 }}>エージェントへの連絡</p>

              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {agent.phone && (
                  <a href={`tel:${agent.phone}`} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'var(--paper-warm)', borderRadius:'var(--radius)', textDecoration:'none', color:'var(--ink)' }}>
                    <span style={{ fontSize:18 }}>📞</span>
                    <div><p style={{ fontSize:11, color:'var(--ink-muted)', marginBottom:1 }}>{lang==='ja'?'電話':'Phone'}</p><p style={{ fontSize:13, fontWeight:500 }}>{agent.phone}</p></div>
                  </a>
                )}
                <a href={`mailto:${agent.email}`} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'var(--paper-warm)', borderRadius:'var(--radius)', textDecoration:'none', color:'var(--ink)' }}>
                  <span style={{ fontSize:18 }}>✉</span>
                  <div><p style={{ fontSize:11, color:'var(--ink-muted)', marginBottom:1 }}>{lang==='ja'?'メール':'Email'}</p><p style={{ fontSize:13, fontWeight:500 }}>{agent.email}</p></div>
                </a>
              </div>

              <div style={{ marginTop:20 }}>
                {user ? (
                  <Link href="/properties" className="btn-primary" style={{ display:'flex', justifyContent:'center', padding:13 }}>
                    {lang==='ja'?'物件を見る':'Browse Their Listings'}
                  </Link>
                ) : (
                  <Link href="/?login=1" className="btn-primary" style={{ display:'flex', justifyContent:'center', padding:13 }}>
                    {lang==='ja'?'ログインして問い合わせ':'Login to Send Inquiry'}
                  </Link>
                )}
              </div>
            </div>

            <Link href="/dashboard?tab=agents" className="btn-outline" style={{ display:'flex', justifyContent:'center', width:'100%', marginTop:12 }}>
              ← {lang==='ja'?'エージェント一覧':'All Agents'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
