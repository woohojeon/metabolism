'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  ADMIN_USERNAME,
  SESSION_EXPIRED_EVENT,
  endSession,
  sessionState,
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

    if (!saved) {
      setReady(true)
      return
    }

    // What the server obeys is an httpOnly cookie that expires, while this key
    // never does. Restored without asking, it puts controls back on a page
    // whose every write the server will refuse — the admin's edit buttons, a
    // student's Q&A form. So the sign-in is only restored once the server says
    // it still knows this browser, and by that name.
    let stale = false
    sessionState().then((state) => {
      if (stale) return
      // `null` is "could not ask", not "nobody" — keep what was stored.
      if (state === null || state.user === saved) setUser(saved)
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
    window.addEventListener(SESSION_EXPIRED_EVENT, forget)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, forget)
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
