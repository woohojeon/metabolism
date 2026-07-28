import { NextResponse } from 'next/server'
import { ADMIN_COOKIE } from '@/lib/admin-session'

// Clears the administrator session cookie. Because the cookie is httpOnly the
// browser cannot delete it itself, so signing out has to come through here.
export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
