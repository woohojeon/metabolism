import { NextResponse } from 'next/server'
import { ADMIN_COOKIE, USER_COOKIE } from '@/lib/admin-session'

// Clears the session cookies. Because they are httpOnly the browser cannot
// delete them itself, so signing out has to come through here.
export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, '', { path: '/', maxAge: 0 })
  res.cookies.set(USER_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
