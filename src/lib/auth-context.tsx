'use client'
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { initStore, getUserByEmail, createUser, getUserById, updateUser as storeUpdateUser, type User } from './store'

interface AuthContextType {
  user: User | null
  loading: boolean
  dbStatus: 'unknown' | 'connected' | 'disconnected'
  login: (email: string, password: string) => Promise<User>
  register: (name: string, email: string, password: string, role?: 'user'|'agent') => Promise<{ user: User; savedToDb: boolean }>
  logout: () => void
  refreshUser: () => void
  updateCurrentUser: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true, dbStatus: 'unknown',
  login: async () => { throw new Error() },
  register: async () => { throw new Error('') },
  logout: () => {},
  refreshUser: () => {},
  updateCurrentUser: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]         = useState<User | null>(null)
  const [loading, setLoading]   = useState(true)
  const [dbStatus, setDbStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown')

  useEffect(() => {
    initStore()
    const stored = localStorage.getItem('jp_current_user')
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User
        // Always get the LATEST data from jp_users (has avatar, bio etc.)
        const fresh = getUserById(parsed.id)
        if (fresh) {
          setUser(fresh)
          localStorage.setItem('jp_current_user', JSON.stringify(fresh))
        }
      } catch { localStorage.removeItem('jp_current_user') }
    }
    setLoading(false)
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setDbStatus(d.db === 'connected' ? 'connected' : 'disconnected'))
      .catch(() => setDbStatus('disconnected'))
  }, [])

  // Read fresh data from jp_users and update session
  const refreshUser = useCallback(() => {
    const stored = localStorage.getItem('jp_current_user')
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as User
      const fresh = getUserById(parsed.id)
      if (fresh) {
        setUser({ ...fresh })
        localStorage.setItem('jp_current_user', JSON.stringify(fresh))
      }
    } catch {}
  }, [])

  // Update user: saves to jp_users store, updates React state, updates jp_current_user session
  // This is the KEY function — it must do all three atomically
  const updateCurrentUser = useCallback((updates: Partial<User>) => {
    const stored = localStorage.getItem('jp_current_user')
    if (!stored) return
    try {
      const current = JSON.parse(stored) as User
      // 1. Save to persistent store (jp_users)
      storeUpdateUser(current.id, updates)
      // 2. Read back to get the latest merged version
      const fresh = getUserById(current.id)
      if (fresh) {
        // 3. Update session (jp_current_user)
        localStorage.setItem('jp_current_user', JSON.stringify(fresh))
        // 4. Update React state — force re-render with new object reference
        setUser({ ...fresh })
      }
    } catch {}
  }, [])

  const login = async (email: string, password: string): Promise<User> => {
    initStore()
    // Try MySQL first if connected
    if (dbStatus === 'connected') {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          // For DB login: check if we have local profile data (avatar etc.)
          const localUser = getUserByEmail(email)
          const dbUser: User = localUser
            ? { ...localUser, name: data.user.name, email: data.user.email, role: data.user.role }
            : { id: String(data.user.id), name: data.user.name, email: data.user.email, passwordHash: password, role: data.user.role, createdAt: new Date().toISOString() }
          if (data.token) localStorage.setItem('jp_token', data.token)
          setUser(dbUser)
          localStorage.setItem('jp_current_user', JSON.stringify(dbUser))
          return dbUser
        }
        if (!data.dbError) throw new Error(data.message || 'Login failed')
      } catch (e: any) {
        if (!e.message?.includes('Database') && !e.message?.includes('fetch')) throw e
      }
    }
    // localStorage fallback — reads from jp_users which has all profile data
    const u = getUserByEmail(email)
    if (!u) throw new Error('No account found with that email address')
    if (u.passwordHash !== password) throw new Error('Incorrect password — please try again')
    // u already has avatar, bio, phone etc. from jp_users
    setUser({ ...u })
    localStorage.setItem('jp_current_user', JSON.stringify(u))
    return u
  }

  const register = async (name: string, email: string, password: string, role: 'user'|'agent' = 'user'): Promise<{ user: User; savedToDb: boolean }> => {
    initStore()
    if (!name.trim() || !email.trim() || !password.trim()) throw new Error('All fields are required')
    if (password.length < 6) throw new Error('Password must be at least 6 characters')
    const existing = getUserByEmail(email)
    if (existing) throw new Error('That email is already registered')
    let savedToDb = false
    if (dbStatus === 'connected') {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role }),
        })
        const data = await res.json()
        if (res.ok && data.success) { savedToDb = true; if (data.token) localStorage.setItem('jp_token', data.token) }
        else if (res.status === 409) throw new Error('That email is already registered in the database')
        else if (!data.dbError) throw new Error(data.message || 'Registration failed')
      } catch (e: any) {
        if (e.message?.includes('already registered')) throw e
        setDbStatus('disconnected')
      }
    }
    const newUser = createUser({ name, email, passwordHash: password, role })
    setUser({ ...newUser })
    localStorage.setItem('jp_current_user', JSON.stringify(newUser))
    return { user: newUser, savedToDb }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('jp_current_user')
    localStorage.removeItem('jp_token')
  }

  return (
    <AuthContext.Provider value={{ user, loading, dbStatus, login, register, logout, refreshUser, updateCurrentUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
