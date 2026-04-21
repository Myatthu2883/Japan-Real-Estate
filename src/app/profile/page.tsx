'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function ProfileRedirect() {
  const { user, loading } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/?login=1'); return }
    if (user.role === 'admin') router.replace('/admin')
    else if (user.role === 'agent') router.replace('/agent')
    else router.replace('/dashboard')
  }, [user, loading, router])
  return <div style={{ padding: 80, textAlign: 'center', color: 'var(--ink-muted)', fontSize: 13 }}>Redirecting to your panel...</div>
}
