'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from './auth-provider'

export function LoginDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const userRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setUsername('')
      setPassword('')
      setError(false)
      const t = setTimeout(() => userRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [open])

  if (!open) return null

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (login(username, password)) {
      onClose()
    } else {
      setError(true)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[14vh]">
      <div aria-hidden onClick={onClose} className="absolute inset-0 bg-ink/60" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sign in"
        className="relative w-full max-w-[380px] overflow-hidden rounded-lg bg-background text-foreground shadow-2xl"
      >
        <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-4">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
            Sign In
          </h2>
          <button
            type="button"
            aria-label="Close sign in"
            onClick={onClose}
            className="text-foreground transition-colors hover:text-science-red"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 px-5 py-6">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Username
            </span>
            <input
              ref={userRef}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setError(false)
              }}
              autoComplete="username"
              className="h-11 rounded-md border border-neutral-300 px-3 text-[15px] outline-none focus:border-foreground"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(false)
              }}
              autoComplete="current-password"
              className="h-11 rounded-md border border-neutral-300 px-3 text-[15px] outline-none focus:border-foreground"
            />
          </label>

          {error && (
            <p className="text-[13px] font-medium text-science-red">
              Incorrect username or password.
            </p>
          )}

          <button
            type="submit"
            className="mt-1 h-11 rounded-full bg-science-red text-[12px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
