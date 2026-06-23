'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type AuthContextValue = {
  user: string | null
  login: (username: string, password: string) => boolean
  logout: () => void
}

// Lightweight client-side gate for this educational site.
// Credentials are intentionally fixed per request.
const VALID_USER = 'jbnu'
const VALID_PASS = '1234'
const STORAGE_KEY = 'vbiochem-user'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setUser(saved)
    } catch {
      // ignore storage access errors
    }
  }, [])

  const login = (username: string, password: string) => {
    if (username === VALID_USER && password === VALID_PASS) {
      setUser(username)
      try {
        localStorage.setItem(STORAGE_KEY, username)
      } catch {
        // ignore
      }
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
