'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import AuthModal from './AuthModal'

interface LoginGateProps {
  children: React.ReactNode
  message?: string
}

/**
 * Wrap any clickable element. If the user is not logged in,
 * clicking anything inside shows the login modal instead of the action.
 */
export default function LoginGate({ children, message }: LoginGateProps) {
  const { user } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  if (user) return <>{children}</>

  return (
    <>
      <div
        onClick={e => { e.preventDefault(); e.stopPropagation(); setShowAuth(true) }}
        style={{ cursor: 'pointer' }}
        title={message || 'Login to continue'}
      >
        {children}
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
