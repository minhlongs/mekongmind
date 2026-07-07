'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface User {
  id: string
  email: string
  fullName?: string
  emailVerified?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

async function fetchSession(): Promise<User | null> {
  try {
    const res = await fetch('/api/auth/session', { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.user) return null
    return {
      id: data.user.id,
      email: data.user.email,
      fullName: data.user.name ?? data.user.fullName ?? undefined,
      emailVerified: data.user.emailVerified,
    }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    const sessionUser = await fetchSession()
    setUser(sessionUser)
  }, [])

  useEffect(() => {
    refreshSession().finally(() => setLoading(false))
  }, [refreshSession])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/signin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) return { error: data.message ?? 'Sign-in failed' }
      await refreshSession()
      return { error: null }
    } catch {
      return { error: 'Network error' }
    }
  }, [refreshSession])

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      const res = await fetch('/api/auth/signup/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: fullName }),
      })
      const data = await res.json()
      if (!res.ok) return { error: data.message ?? 'Sign-up failed' }
      await refreshSession()
      return { error: null }
    } catch {
      return { error: 'Network error' }
    }
  }, [refreshSession])

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
    } finally {
      setUser(null)
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) return { error: data.message ?? 'Reset failed' }
      return { error: null }
    } catch {
      return { error: 'Network error' }
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
