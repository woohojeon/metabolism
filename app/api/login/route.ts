import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
  USER_COOKIE,
  USER_COOKIE_MAX_AGE,
  isAdminSession,
  readUserSession,
  signAdminSession,
  signUserSession,
} from '@/lib/admin-session'
import { ADMIN_USERNAME } from '@/lib/students'
import { sb, supabaseReady } from '@/lib/supabase-rest'

// Checks a sign-in against the students table. The comparison happens here, on
// the server, so the roster and its passwords are never sent to the browser.
// A successful sign-in sets the session cookie that says who this browser is;
// signing in as the administrator also sets the one that says what it may do.

type Row = { username: string; password: string }

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
} as const

/**
 * GET /api/login — who the server still takes this browser to be.
 *
 * The browser cannot read the cookies that decide this, so without asking it
 * has no way to know its own session has lapsed, and goes on showing controls —
 * edit buttons, a Q&A form — that every write refuses. Live sessions are
 * renewed here, so a working day of use does not end mid-edit.
 */
export async function GET() {
  const jar = await cookies()
  const alive = isAdminSession(jar.get(ADMIN_COOKIE)?.value)
  const user = readUserSession(jar.get(USER_COOKIE)?.value)
  const res = NextResponse.json({ isAdmin: alive, user })

  if (alive) {
    res.cookies.set(ADMIN_COOKIE, signAdminSession(), {
      ...COOKIE_OPTIONS,
      maxAge: ADMIN_COOKIE_MAX_AGE,
    })
  }
  if (user) {
    res.cookies.set(USER_COOKIE, signUserSession(user), {
      ...COOKIE_OPTIONS,
      maxAge: USER_COOKIE_MAX_AGE,
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

  // Everyone who signs in gets the identity cookie — it is what lets the board
  // show a student their own questions and nobody else's.
  res.cookies.set(USER_COOKIE, signUserSession(row.username), {
    ...COOKIE_OPTIONS,
    maxAge: USER_COOKIE_MAX_AGE,
  })

  if (isAdmin) {
    res.cookies.set(ADMIN_COOKIE, signAdminSession(), {
      ...COOKIE_OPTIONS,
      maxAge: ADMIN_COOKIE_MAX_AGE,
    })
  }

  return res
}
