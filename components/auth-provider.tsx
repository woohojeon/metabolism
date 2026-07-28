'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { ADMIN_USERNAME, endSession, verifyLogin } from '@/lib/students'

type AuthContextValue = {
  user: string | null
  /** True for the roster's administrator account. */
  isAdmin: boolean
  /** False until the stored session has been read, so pages can avoid a flash. */
  ready: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

// Sign-ins are checked against the roster in lib/students.ts — against Supabase
// through /api/login when it is configured, against the seeded local roster
// otherwise.
//
// What lives here is only the *display* side of the session. `isAdmin` decides
// what the page renders, not what the page may read: /api/students accepts the
// httpOnly cookie set by /api/login and nothing else, so editing a value in
// localStorage reveals an empty admin screen rather than anyone's password.
const STORAGE_KEY = 'vbiochem-user'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setUser(saved)
    } catch {
      // ignore storage access errors
    }
    setReady(true)
  }, [])

  const login = async (username: string, password: string) => {
    const id = username.trim()
    const { ok } = await verifyLogin(id, password)
    if (!ok) return false

    setUser(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      // ignore
    }
    return true
  }

  const logout = () => {
    setUser(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    void endSession()
  }

  return (
    <AuthContext.Provider
      value={{ user, isAdmin: user === ADMIN_USERNAME, ready, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
