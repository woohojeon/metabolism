import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
  isAdminSession,
  signAdminSession,
} from '@/lib/admin-session'
import { ADMIN_USERNAME } from '@/lib/students'
import { sb, supabaseReady } from '@/lib/supabase-rest'

// Checks a sign-in against the students table. The comparison happens here, on
// the server, so the roster and its passwords are never sent to the browser.
// Signing in as the administrator also sets the /admin session cookie.

type Row = { username: string; password: string }

/**
 * GET /api/login — whether this browser still holds a valid admin session.
 *
 * The browser cannot read the cookie that decides this, so without asking it
 * has no way to know its own session has lapsed, and goes on showing edit
 * controls that every save refuses. A live session is renewed here, so a
 * working day of use does not end mid-edit.
 */
export async function GET() {
  const jar = await cookies()
  const alive = isAdminSession(jar.get(ADMIN_COOKIE)?.value)
  const res = NextResponse.json({ isAdmin: alive })

  if (alive) {
    res.cookies.set(ADMIN_COOKIE, signAdminSession(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: ADMIN_COOKIE_MAX_AGE,
    })
  }

  return res
}

export async function POST(request: Request) {
  if (!supabaseReady) {
    return NextResponse.json(
      { error: 'Supabase 가 설정되지 않았습니다.' },
      { status: 501 },
    )
  }

  let body: { username?: unknown; password?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const { username, password } = body
  if (typeof username !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  let rows: Row[]
  try {
    rows = (await sb(
      `students?username=eq.${encodeURIComponent(username.trim())}&select=username,password&limit=1`,
    )) as Row[]
  } catch {
    return NextResponse.json(
      { error: '로그인 서버에 연결하지 못했습니다.' },
      { status: 502 },
    )
  }

  const row = rows?.[0]
  if (!row || row.password !== password) {
    return NextResponse.json({ ok: false, isAdmin: false }, { status: 401 })
  }

  const isAdmin = row.username === ADMIN_USERNAME
  const res = NextResponse.json({ ok: true, isAdmin })

  if (isAdmin) {
    res.cookies.set(ADMIN_COOKIE, signAdminSession(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: ADMIN_COOKIE_MAX_AGE,
    })
  }

  return res
}
