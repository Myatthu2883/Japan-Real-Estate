'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLang } from '@/lib/i18n'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'
import { getAgentMessages, getAllAgentMessages, getAdminUnreadCount, getUserUnreadCount, getMessages, initStore } from '@/lib/store'
import AuthModal from './AuthModal'

export default function Navbar() {
  const { lang, setLang } = useLang()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const [showAuth, setShowAuth] = useState(false)
  const [navAuthOpen, setNavAuthOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (new URLSearchParams(window.location.search).get('login') === '1' && !user) setShowAuth(true)
  }, [user])

  useEffect(() => {
    if (!user) return
    initStore()
    const update = () => {
      if (user.role === 'agent') setUnread(getAllAgentMessages(user.id).filter(m => m.status === 'new').length)
      else if (user.role === 'admin') setUnread(getAdminUnreadCount(user.id))
      else setUnread(getUserUnreadCount(user.id))
    }
    update()
    const t = setInterval(update, 5000)
    return () => clearInterval(t)
  }, [user])

  const handleLogout = () => { logout(); router.push('/') }

  // ── Nav links per role ──────────────────────────────────
  const publicNav = [
    { href:'/', label:'Home', ja:'ホーム' },
    { href:'/properties', label:'Properties', ja:'物件一覧' },
    { href:'/about', label:'About', ja:'会社概要' },
    { href:'/contact', label:'Contact', ja:'お問い合わせ' },
  ]
  const adminNav = [
    { href:'/admin', label:'Dashboard', ja:'ダッシュボード' },
    { href:'/admin?tab=properties', label:'Properties', ja:'物件管理' },
    { href:'/admin?tab=users', label:'Users', ja:'ユーザー' },
    { href:'/admin?tab=messages', label:'Messages', ja:'メッセージ', badge: unread },
  ]
  const agentNav = [
    { href:'/agent', label:'Dashboard', ja:'ダッシュボード' },
    { href:'/agent?tab=listings', label:'My Listings', ja:'掲載物件' },
    { href:'/agent?tab=inquiries', label:'Inquiries', ja:'問い合わせ', badge: unread },
    { href:'/agent?tab=add', label:'+ Add', ja:'物件追加' },
    { href:'/agent?tab=profile', label:'Profile', ja:'プロフィール' },
  ]
  const userNav = [
    { href:'/', label:'Home', ja:'ホーム' },
    { href:'/properties', label:'Properties', ja:'物件一覧' },
    { href:'/dashboard', label:'My Saved', ja:'お気に入り' },
    { href:'/dashboard?tab=inbox', label:'Inbox', ja:'受信箱', badge: unread },
    { href:'/contact', label:'Contact', ja:'お問い合わせ' },
  ]

  const navLinks = !user ? publicNav
    : user.role === 'admin' ? adminNav
    : user.role === 'agent' ? agentNav
    : userNav

  const panelHref = !user ? '/' : user.role === 'admin' ? '/admin' : user.role === 'agent' ? '/agent' : '/dashboard'
  const roleColor = !user ? 'var(--ink-muted)' : user.role === 'admin' ? 'var(--accent-red)' : user.role === 'agent' ? 'var(--accent-indigo)' : 'var(--accent-sage)'

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo">
            <span className="navbar-logo-en">Japan Property</span>
            <span className="navbar-logo-jp">日本不動産</span>
          </Link>

          <ul className="navbar-nav">
            {navLinks.map(link => (
              <li key={link.href} style={{ position:'relative' }}>
                <Link
                  href={!user && (link.href.includes('dashboard') || link.href.includes('inbox') || link.href.includes('admin') || link.href.includes('agent')) ? '#' : link.href}
                  onClick={e => { if (!user && (link.href.includes('dashboard') || link.href.includes('inbox'))) { e.preventDefault(); setNavAuthOpen(true) } }}
                  className={pathname === link.href.split('?')[0] && !link.href.includes('?') ? 'active' : ''}
                >
                  {lang==='ja' ? link.ja : link.label}
                </Link>
                {(link as any).badge > 0 && (
                  <span style={{ position:'absolute', top:-4, right:-6, minWidth:16, height:16, borderRadius:8, background:'var(--accent-red)', color:'white', fontSize:9, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, padding:'0 4px' }}>
                    {(link as any).badge}
                  </span>
                )}
              </li>
            ))}
          </ul>

          <div className="navbar-actions">
            <button className="theme-btn" onClick={toggleTheme} title={theme==='dark'?'Light mode':'Dark mode'}>
              {theme==='dark'?'☀':'◐'}
            </button>
            <div className="lang-toggle">
              <button className={`lang-btn ${lang==='en'?'active':''}`} onClick={() => setLang('en')}>EN</button>
              <button className={`lang-btn ${lang==='ja'?'active':''}`} onClick={() => setLang('ja')}>日本語</button>
            </div>

            {user ? (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span className={`badge badge-${user.role}`}>{user.role.toUpperCase()}</span>
                <Link href={panelHref} style={{ display:'flex', alignItems:'center', gap:7, textDecoration:'none' }}>
                  {user.avatar
                    ? <img src={user.avatar} alt="" style={{ width:34, height:34, borderRadius:'50%', objectFit:'cover', border:`2px solid ${roleColor}` }} />
                    : <div style={{ width:34, height:34, borderRadius:'50%', background:roleColor, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:13, fontWeight:600 }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                  }
                  <span style={{ fontSize:12, color:'var(--ink-soft)', maxWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {user.name.split('/')[0].split(' ')[0]}
                  </span>
                </Link>
                <button onClick={handleLogout} style={{ fontSize:11, border:'1px solid var(--border)', background:'none', padding:'5px 11px', cursor:'pointer', borderRadius:2, color:'var(--ink-muted)', letterSpacing:'0.06em' }}>
                  {lang==='ja'?'ログアウト':'Logout'}
                </button>
              </div>
            ) : (
              <button className="btn-primary" onClick={() => setShowAuth(true)} style={{ padding:'8px 20px' }}>
                {lang==='ja'?'ログイン':'Login'}
              </button>
            )}
          </div>
        </div>
      </nav>
      {showAuth && <AuthModal onClose={() => { setShowAuth(false); window.history.replaceState({}, '', window.location.pathname) }} />}
      {navAuthOpen && <AuthModal onClose={() => setNavAuthOpen(false)} />}
    </>
  )
}
