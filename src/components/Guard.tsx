'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import AuthModal from './AuthModal'

interface GuardProps {
  children: React.ReactNode
  roles?: Array<'admin' | 'agent' | 'user'>
}

export default function Guard({ children, roles }: GuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) { setShowModal(true); return }
    if (roles && !roles.includes(user.role)) {
      if (user.role === 'admin') router.replace('/admin')
      else if (user.role === 'agent') router.replace('/agent')
      else router.replace('/dashboard')
    }
  }, [user, loading, roles, router])

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
        <p style={{ color:'var(--ink-muted)', fontSize:13, letterSpacing:'0.15em' }}>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        {/* Blurred locked page — clicking anywhere opens login */}
        <div onClick={() => setShowModal(true)} style={{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', userSelect:'none' }}>
          <div style={{ textAlign:'center', padding:48 }}>
            <p style={{ fontFamily:'var(--font-serif)', fontSize:72, opacity:0.08, marginBottom:20, lineHeight:1 }}>鍵</p>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:400, marginBottom:10 }}>Login Required</h2>
            <p style={{ color:'var(--ink-muted)', fontSize:14, marginBottom:28 }}>Please sign in to access this page</p>
            <span className="btn-primary" style={{ pointerEvents:'none' }}>Sign In →</span>
          </div>
        </div>
        {showModal && <AuthModal onClose={() => setShowModal(false)} />}
      </>
    )
  }

  if (roles && !roles.includes(user.role)) return null
  return <>{children}</>
}
