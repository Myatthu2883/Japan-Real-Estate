'use client'
import { useState } from 'react'
import { useLang } from '@/lib/i18n'
import { useAuth } from '@/lib/auth-context'
import { createMessage, getAdminId, getUserById } from '@/lib/store'
import AuthModal from '@/components/AuthModal'

export default function ContactPage() {
  const { lang, t } = useLang()
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: ''
  })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showLoginModal, setShowLoginModal] = useState(false)

  const update = (field: string, val: string) => setForm(f => ({ ...f, [field]: val }))

  const handleSubmit = async () => {
    setError('')
    if (!user) {
      setShowLoginModal(true)
      return
    }
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in name, email, and message')
      return
    }
    setLoading(true)
    // Save message to localStorage — admin can see it in their panel
    const adminId = getAdminId()
    const admin = getUserById(adminId)

    createMessage({
      threadId: `thread_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: 'contact',
      fromId: user?.id ?? '',
      fromRole: 'user',
      fromName: form.name,
      fromEmail: form.email,
      toId: adminId,
      toRole: 'admin',
      toName: admin?.name ?? 'Admin',
      toEmail: admin?.email ?? '',
      message: (form.subject ? `[${form.subject}] ` : '') + form.message,
      subject: form.subject || undefined,
    })
    await new Promise(r => setTimeout(r, 400))
    setSent(true)
    setLoading(false)
  }

  return (
    <>
      <div style={{ background: 'var(--paper-warm)', padding: '80px 0 60px', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 11, letterSpacing: '0.3em', color: 'var(--accent-red)', textTransform: 'uppercase', marginBottom: 12 }}>お問い合わせ</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 300 }}>{t.nav_contact}</h1>
          <div className="divider-jp" style={{ margin: '20px auto' }}>
            <span>{lang === 'ja' ? 'いつでもご連絡ください' : 'Get in touch'}</span>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>
            {/* Contact Info */}
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 400, marginBottom: 24 }}>
                {lang === 'ja' ? '私たちに連絡する' : 'Reach Us'}
              </h2>
              <p style={{ color: 'var(--ink-soft)', lineHeight: 1.9, fontSize: 14, marginBottom: 36 }}>
                {lang === 'ja'
                  ? '物件に関するお問い合わせや内見のご予約は、お気軽にご連絡ください。バイリンガルのエージェントが対応いたします。'
                  : 'Questions about a property, or ready to schedule a viewing? Our bilingual team is happy to help.'}
              </p>
              {[
                { label: lang === 'ja' ? '東京本社' : 'Tokyo HQ', value: '〒150-0001 東京都渋谷区神宮前1-1-1', icon: '◎' },
                { label: lang === 'ja' ? '京都支店' : 'Kyoto Branch', value: '〒605-0001 京都市東山区古川町123', icon: '◎' },
                { label: lang === 'ja' ? 'お電話' : 'Phone', value: '03-1234-5678', icon: '◈' },
                { label: lang === 'ja' ? 'メール' : 'Email', value: 'info@japanproperty.jp', icon: '◈' },
                { label: lang === 'ja' ? '営業時間' : 'Hours', value: lang === 'ja' ? '月〜土 9:00〜18:00' : 'Mon–Sat 9:00–18:00', icon: '⊕' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--accent-red)', fontSize: 14, opacity: 0.7, marginTop: 2, minWidth: 16 }}>{item.icon}</span>
                  <div>
                    <p style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</p>
                    <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{item.value}</p>
                  </div>
                </div>
              ))}

              {/* Note for users */}
              <div style={{ background: 'var(--paper-warm)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', marginTop: 24 }}>
                <p style={{ fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.7 }}>
                  {lang === 'ja'
                    ? '送信されたメッセージは管理者が確認し、2営業日以内にご返信いたします。'
                    : 'Messages are reviewed by our team and replied to within 2 business days.'}
                </p>
              </div>
            </div>

            {/* Form */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 40 }}>
              {!user && !sent && (
                <div style={{ background: 'rgba(139,34,34,0.06)', border: '1px solid rgba(139,34,34,0.2)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  🔒 <span>
                    <button onClick={() => setShowLoginModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)', textDecoration: 'underline', fontSize: 13, padding: 0, fontWeight: 500 }}>Login</button>
                    {' '}to send a message to our team.
                  </span>
                </div>
              )}
              {sent ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: 48, color: 'var(--accent-red)', opacity: 0.4, marginBottom: 16 }}>◎</p>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 400, marginBottom: 8 }}>
                    {lang === 'ja' ? '送信完了' : 'Message Sent!'}
                  </h3>
                  <p style={{ color: 'var(--ink-muted)', fontSize: 13, marginBottom: 20 }}>
                    {lang === 'ja' ? '2営業日以内にご返信いたします。' : "We'll get back to you within 2 business days."}
                  </p>
                  <button className="btn-outline" onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }) }}>
                    {lang === 'ja' ? '別のメッセージを送る' : 'Send another message'}
                  </button>
                </div>
              ) : (
                <>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: 4 }}>
                    {lang === 'ja' ? 'メッセージを送る' : 'Send a Message'}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: 11, letterSpacing: '0.2em', color: 'var(--ink-muted)', marginBottom: 28 }}>メッセージ送信</p>

                  {error && <div className="error-msg">{error}</div>}

                  <div className="form-group">
                    <label>{t.name} *</label>
                    <input value={form.name} onChange={e => update('name', e.target.value)} placeholder={lang === 'ja' ? '山田 太郎' : 'Your name'} />
                  </div>
                  <div className="form-group">
                    <label>{t.email} *</label>
                    <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="example@email.com" />
                  </div>
                  <div className="form-group">
                    <label>{lang === 'ja' ? '件名' : 'Subject'}</label>
                    <input value={form.subject} onChange={e => update('subject', e.target.value)} placeholder={lang === 'ja' ? '物件についてのお問い合わせ' : 'Property inquiry'} />
                  </div>
                  <div className="form-group">
                    <label>{lang === 'ja' ? 'メッセージ *' : 'Message *'}</label>
                    <textarea rows={5} value={form.message} onChange={e => update('message', e.target.value)} style={{ resize: 'vertical' }}
                      placeholder={lang === 'ja' ? 'ご質問やご要望をご記入ください...' : 'Tell us how we can help...'} />
                  </div>
                  <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14 }}
                    onClick={handleSubmit} disabled={loading}>
                    {loading ? t.loading : t.submit}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
      {showLoginModal && <AuthModal onClose={() => setShowLoginModal(false)} />}
    </>
  )
}
