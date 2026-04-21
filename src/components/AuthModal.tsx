'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/i18n'
import { useAuth } from '@/lib/auth-context'
import { getUserByEmail, updateUser } from '@/lib/store'

interface Props { onClose: () => void; defaultTab?: 'login'|'register'|'forgot' }

export default function AuthModal({ onClose, defaultTab = 'login' }: Props) {
  const { lang } = useLang()
  const { login, register, dbStatus } = useAuth()
  const router = useRouter()

  const [tab, setTab]             = useState<'login'|'register'|'forgot'>(defaultTab)
  // Register section: user or agent request
  const [regType, setRegType]     = useState<'user'|'agent'>('user')

  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [dbSaveStatus, setDbSaveStatus] = useState<'saved'|'local_only'|null>(null)

  // Forgot password
  const [fEmail, setFEmail]     = useState('')
  const [fCode, setFCode]       = useState('')
  const [fEntered, setFEntered] = useState('')
  const [fNewPass, setFNewPass] = useState('')
  const [fStep, setFStep]       = useState<'email'|'code'|'newpass'>('email')
  const [fMsg, setFMsg]         = useState('')

  // Demo accounts for quick login testing
  const allDemos = [
    { label:'Admin', email:'admin@japanproperty.jp', pass:'admin123', color:'var(--accent-red)' },
    { label:'Agent', email:'agent@japanproperty.jp', pass:'agent123', color:'var(--accent-indigo)' },
    { label:'User',  email:'user@japanproperty.jp',  pass:'user123',  color:'var(--accent-sage)' },
  ]

  const reset = (t: typeof tab) => {
    setTab(t); setError(''); setDbSaveStatus(null)
    setFStep('email'); setFMsg(''); setEmail(''); setPassword(''); setName('')
  }

  const handleSubmit = async () => {
    setError(''); setDbSaveStatus(null)
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields'); return }
    setLoading(true)
    try {
      if (tab === 'login') {
        const user = await login(email.trim(), password)
        onClose()
        if (user.role === 'admin')      router.replace('/admin')
        else if (user.role === 'agent') router.replace('/agent')
        else                            router.replace('/')
      } else {
        if (!name.trim()) { setError('Please enter your name'); setLoading(false); return }
        if (password.length < 6) { setError('Password must be 6+ characters'); setLoading(false); return }
        // Both user and agent: create account normally
        // Agent gets 'user' role pending admin approval
        const { savedToDb } = await register(name.trim(), email.trim(), password, regType)
        setDbSaveStatus(savedToDb ? 'saved' : 'local_only')
        setTimeout(() => { onClose(); router.replace('/') }, savedToDb ? 1000 : 1800)
      }
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleForgotSend = () => {
    const u = getUserByEmail(fEmail.trim())
    if (!u) { setFMsg('No account found with that email'); return }
    const code = String(Math.floor(100000 + Math.random() * 900000))
    setFCode(code); setFStep('code')
    setFMsg(`Demo mode — your reset code is: ${code}`)
  }
  const handleForgotVerify = () => {
    if (fEntered !== fCode) { setFMsg('Incorrect code. Try again.'); return }
    setFStep('newpass'); setFMsg('')
  }
  const handleForgotReset = () => {
    if (fNewPass.length < 6) { setFMsg('Password must be 6+ characters'); return }
    const u = getUserByEmail(fEmail.trim())
    if (!u) return
    updateUser(u.id, { passwordHash: fNewPass })
    setEmail(fEmail); setPassword('')
    reset('login')
    setError('Password reset! Please log in with your new password.')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth:440 }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <h2 className="modal-title">Japan Property</h2>
        <span className="modal-title-jp">日本不動産 — ようこそ</span>

        {/* ── Main tabs ── */}
        <div className="modal-tabs">
          {(['login','register'] as const).map(t => (
            <button key={t} className={`modal-tab ${tab===t?'active':''}`} onClick={() => reset(t)}>
              {t==='login' ? (lang==='ja'?'ログイン':'Login') : (lang==='ja'?'新規登録':'Register')}
            </button>
          ))}
        </div>

        {/* DB status dot */}
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:16 }}>
          <span style={{ width:7, height:7, borderRadius:'50%', display:'inline-block', background:dbStatus==='connected'?'#4CAF50':dbStatus==='disconnected'?'#f44336':'#9e9e9e' }} />
          <span style={{ fontSize:11, color:'var(--ink-muted)' }}>
            {dbStatus==='connected'?'Database connected':dbStatus==='disconnected'?'Database offline — saving locally':'Checking...'}
          </span>
        </div>

        {/* ══════════════ FORGOT PASSWORD ══════════════ */}
        {tab === 'forgot' && (
          <div>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', fontWeight:400, marginBottom:16 }}>Reset Password</h3>
            {fMsg && (
              <div style={{ background:fMsg.includes('Demo')?'rgba(43,74,107,0.1)':'rgba(139,34,34,0.08)', border:`1px solid ${fMsg.includes('Demo')?'var(--accent-indigo)':'var(--accent-red)'}`, borderRadius:'var(--radius)', padding:'10px 14px', fontSize:13, marginBottom:16, color:fMsg.includes('Demo')?'var(--accent-indigo)':'var(--accent-red)' }}>
                {fMsg}
              </div>
            )}
            {fStep==='email' && (
              <>
                <div className="form-group"><label>Email</label>
                  <input type="email" value={fEmail} onChange={e=>setFEmail(e.target.value)} placeholder="your@email.com" onKeyDown={e=>e.key==='Enter'&&handleForgotSend()} />
                </div>
                <button className="btn-primary" style={{ width:'100%', justifyContent:'center', padding:14 }} onClick={handleForgotSend}>Send Reset Code</button>
              </>
            )}
            {fStep==='code' && (
              <>
                <div className="form-group"><label>Enter 6-digit code</label>
                  <input value={fEntered} onChange={e=>setFEntered(e.target.value)} placeholder="123456" maxLength={6} onKeyDown={e=>e.key==='Enter'&&handleForgotVerify()} />
                </div>
                <button className="btn-primary" style={{ width:'100%', justifyContent:'center', padding:14 }} onClick={handleForgotVerify}>Verify Code</button>
              </>
            )}
            {fStep==='newpass' && (
              <>
                <div className="form-group"><label>New Password</label>
                  <input type="password" value={fNewPass} onChange={e=>setFNewPass(e.target.value)} placeholder="6+ characters" onKeyDown={e=>e.key==='Enter'&&handleForgotReset()} />
                </div>
                <button className="btn-primary" style={{ width:'100%', justifyContent:'center', padding:14 }} onClick={handleForgotReset}>Reset Password</button>
              </>
            )}
            <button onClick={() => reset('login')} style={{ width:'100%', textAlign:'center', marginTop:12, background:'none', border:'none', cursor:'pointer', color:'var(--ink-muted)', fontSize:12 }}>← Back to Login</button>
          </div>
        )}

        {/* ══════════════ LOGIN ══════════════ */}
        {tab === 'login' && (
          <div>
            {/* Demo accounts */}
            <div style={{ background:'var(--paper-warm)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'12px 14px', marginBottom:18 }}>
              <p style={{ fontSize:10, letterSpacing:'0.12em', color:'var(--ink-muted)', marginBottom:8, textTransform:'uppercase' }}>
                {lang==='ja' ? 'デモアカウント' : 'Demo Accounts'}
              </p>
              <div style={{ display:'flex', gap:6 }}>
                {allDemos.map(d => (
                  <button key={d.label} onClick={() => { setEmail(d.email); setPassword(d.pass); setError('') }}
                    style={{ fontSize:11, padding:'5px 12px', border:`1px solid ${d.color}20`, borderRadius:12, background:`${d.color}10`, cursor:'pointer', color:d.color, fontFamily:'var(--font-body)' }}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="error-msg">{error}</div>}

            <div className="form-group"><label>{lang==='ja'?'メールアドレス':'Email'}</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" onKeyDown={e=>e.key==='Enter'&&handleSubmit()} />
            </div>
            <div className="form-group"><label>{lang==='ja'?'パスワード':'Password'}</label>
              <div style={{ position:'relative' }}>
                <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" style={{ paddingRight:44 }} onKeyDown={e=>e.key==='Enter'&&handleSubmit()} />
                <button type="button" onClick={()=>setShowPass(s=>!s)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--ink-muted)', fontSize:16, lineHeight:1, padding:0 }} tabIndex={-1}>
                  {showPass?'🙈':'👁'}
                </button>
              </div>
            </div>

            <div style={{ textAlign:'right', marginTop:-10, marginBottom:14 }}>
              <button onClick={() => reset('forgot')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'var(--accent-indigo)', textDecoration:'underline' }}>
                {lang==='ja'?'パスワードを忘れた方':'Forgot password?'}
              </button>
            </div>

            <button className="btn-primary" style={{ width:'100%', justifyContent:'center', padding:'14px', fontSize:14 }}
              onClick={handleSubmit} disabled={loading}>
              {loading ? 'Processing...' : (lang==='ja'?'ログイン':'Login')}
            </button>
          </div>
        )}

        {/* ══════════════ REGISTER ══════════════ */}
        {tab === 'register' && (
          <div>
            {/* Account type selector — ONLY on register */}
            <div style={{ marginBottom:20 }}>
              <p style={{ fontSize:12, color:'var(--ink-muted)', marginBottom:10 }}>
                {lang==='ja' ? 'アカウントの種類を選択してください' : 'Select account type'}
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  { key:'user'  as const, title: lang==='ja'?'ユーザー':'User',
                    desc: lang==='ja'?'物件を探す・保存する':'Browse & save properties',
                    icon:'👤', color:'var(--accent-sage)' },
                  { key:'agent' as const, title: lang==='ja'?'エージェント':'Agent',
                    desc: lang==='ja'?'物件を掲載・管理する':'List & manage properties',
                    icon:'🏠', color:'var(--accent-indigo)' },
                ].map(opt => (
                  <button key={opt.key} onClick={() => { setRegType(opt.key); setError(''); setDbSaveStatus(null) }}
                    style={{ padding:'14px 12px', border:`2px solid ${regType===opt.key?opt.color:'var(--border)'}`, borderRadius:'var(--radius-md)', background:regType===opt.key?`${opt.color}10`:'var(--card-bg)', cursor:'pointer', textAlign:'left', transition:'all 0.2s' }}>
                    <div style={{ fontSize:20, marginBottom:6 }}>{opt.icon}</div>
                    <p style={{ fontSize:13, fontWeight:500, color:regType===opt.key?opt.color:'var(--ink)', marginBottom:3 }}>{opt.title}</p>
                    <p style={{ fontSize:11, color:'var(--ink-muted)', lineHeight:1.4 }}>{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Shared registration form — same for both User and Agent */}
            <>
              {regType === 'agent' && (
                <div style={{ background:'rgba(43,74,107,0.07)', border:'1px solid rgba(43,74,107,0.25)', borderRadius:'var(--radius)', padding:'10px 14px', fontSize:12, color:'var(--accent-indigo)', marginBottom:16, lineHeight:1.6 }}>
                  🏠 {lang==='ja'
                    ? 'エージェントとして申請します。管理者が確認後、アカウントが有効化されます。'
                    : 'Registering as an agent. Your account will be reviewed and activated by the admin.'}
                </div>
              )}

              {error && <div className="error-msg">{error}</div>}

              {dbSaveStatus === 'saved' && (
                <div style={{ background:'rgba(76,175,80,0.1)', border:'1px solid #4CAF50', borderRadius:'var(--radius)', padding:'10px 14px', fontSize:13, color:'#2e7d32', marginBottom:16 }}>
                  ✓ {regType === 'agent'
                    ? (lang==='ja' ? 'エージェント申請を受け付けました！' : 'Agent application submitted!')
                    : (lang==='ja' ? 'アカウントを作成しました！' : 'Account created successfully!')}
                </div>
              )}
              {dbSaveStatus === 'local_only' && (
                <div style={{ background:'rgba(255,152,0,0.1)', border:'1px solid #FF9800', borderRadius:'var(--radius)', padding:'10px 14px', fontSize:13, color:'#e65100', marginBottom:16 }}>
                  ⚠ Saved locally. Connect database to persist across devices.
                </div>
              )}

              <div className="form-group">
                <label>{lang==='ja'?'お名前':'Full Name'}</label>
                <input type="text" value={name} onChange={e=>setName(e.target.value)}
                  placeholder={lang==='ja'?'山田 太郎':'Your full name'}
                  onKeyDown={e=>e.key==='Enter'&&handleSubmit()} />
              </div>
              <div className="form-group">
                <label>{lang==='ja'?'メールアドレス':'Email'}</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="example@email.com"
                  onKeyDown={e=>e.key==='Enter'&&handleSubmit()} />
              </div>
              <div className="form-group">
                <label>{lang==='ja'?'パスワード':'Password'}</label>
                <div style={{ position:'relative' }}>
                  <input type={showPass?'text':'password'} value={password}
                    onChange={e=>setPassword(e.target.value)}
                    placeholder="6+ characters" style={{ paddingRight:44 }}
                    onKeyDown={e=>e.key==='Enter'&&handleSubmit()} />
                  <button type="button" onClick={()=>setShowPass(s=>!s)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--ink-muted)', fontSize:16, lineHeight:1, padding:0 }}
                    tabIndex={-1}>
                    {showPass?'🙈':'👁'}
                  </button>
                </div>
              </div>

              <button className="btn-primary"
                style={{ width:'100%', justifyContent:'center', padding:'14px', fontSize:14 }}
                onClick={handleSubmit} disabled={loading || dbSaveStatus !== null}>
                {loading ? 'Processing...'
                  : regType === 'agent'
                    ? (lang==='ja'?'エージェントとして申請':'Apply as Agent')
                    : (lang==='ja'?'アカウント作成':'Create Account')}
              </button>
            </>
          </div>
        )}
      </div>
    </div>
  )
}
