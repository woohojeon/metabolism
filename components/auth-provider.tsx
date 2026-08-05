'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  ADMIN_EXPIRED_EVENT,
  ADMIN_USERNAME,
  adminSessionAlive,
  endSession,
  verifyLogin,
} from '@/lib/students'

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

  const forget = useCallback(() => {
    setUser(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore storage access errors
    }
  }, [])

  useEffect(() => {
    let saved: string | null = null
    try {
      saved = localStorage.getItem(STORAGE_KEY)
    } catch {
      // ignore storage access errors
    }

    // A student's sign-in only decides what this browser shows them, so the key
    // is the whole of it.
    if (saved !== ADMIN_USERNAME) {
      setUser(saved)
      setReady(true)
      return
    }

    // The administrator's is different: what the server obeys is an httpOnly
    // cookie that expires, while this key never does. Restored without asking,
    // it puts edit controls back on a page whose every save the server will
    // refuse. So the sign-in is only restored once the server confirms it.
    let stale = false
    adminSessionAlive().then((alive) => {
      if (stale) return
      if (alive) setUser(saved)
      else forget()
      setReady(true)
    })
    return () => {
      stale = true
    }
  }, [forget])

  // The session can also lapse with the page still open. The first refused
  // write says so, and the controls go away rather than staying to fail again.
  useEffect(() => {
    window.addEventListener(ADMIN_EXPIRED_EVENT, forget)
    return () => window.removeEventListener(ADMIN_EXPIRED_EVENT, forget)
  }, [forget])

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
    forget()
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
