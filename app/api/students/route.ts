import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ADMIN_COOKIE, isAdminSession } from '@/lib/admin-session'
import { ADMIN_USERNAME, type Student } from '@/lib/students'
import { DuplicateUsernameError, sb, supabaseReady } from '@/lib/supabase-rest'

// CRUD for the sign-in roster, reachable only with a valid administrator
// session cookie. Everything here runs with the service-role key, so the guard
// below is the only thing standing between the public and a table of cleartext
// passwords — keep it first in every handler.

const COLUMNS = 'id,name,username,password'

async function denyUnlessAdmin() {
  if (!supabaseReady) {
    return NextResponse.json(
      { error: 'Supabase 가 설정되지 않았습니다.' },
      { status: 501 },
    )
  }
  const jar = await cookies()
  if (!isAdminSession(jar.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }
  return null
}

function oops(error: unknown) {
  if (error instanceof DuplicateUsernameError) {
    return NextResponse.json({ error: error.message }, { status: 409 })
  }
  return NextResponse.json({ error: '데이터베이스 요청이 실패했습니다.' }, { status: 502 })
}

/** Reads one row, so handlers can tell whether they are touching the admin. */
async function usernameOf(id: string) {
  const rows = (await sb(
    `students?id=eq.${encodeURIComponent(id)}&select=username&limit=1`,
  )) as { username: string }[]
  return rows?.[0]?.username
}

export async function GET() {
  const denied = await denyUnlessAdmin()
  if (denied) return denied

  try {
    const rows = (await sb(`students?select=${COLUMNS}&order=created_at.asc`)) as Student[]
    return NextResponse.json(rows)
  } catch (e) {
    return oops(e)
  }
}

/** How many accounts go in one insert, so a large class does not build one
 *  enormous request body. */
const BATCH = 500

export async function POST(request: Request) {
  const denied = await denyUnlessAdmin()
  if (denied) return denied

  let body: Partial<Student> & { students?: Partial<Student>[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  // A `students` array is the roster import; a bare object is the Add account
  // row. Both land here so there is one place that writes to the table.
  if (Array.isArray(body.students)) return addMany(body.students)

  const name = body.name?.trim()
  const username = body.username?.trim()
  const password = body.password

  if (!name || !username || !password) {
    return NextResponse.json(
      { error: '이름, 아이디, 비밀번호를 모두 입력하세요.' },
      { status: 400 },
    )
  }

  try {
    const rows = (await sb(`students?select=${COLUMNS}`, {
      method: 'POST',
      body: JSON.stringify({ name, username, password }),
    })) as Student[]
    return NextResponse.json(rows[0])
  } catch (e) {
    return oops(e)
  }
}

/**
 * Creates a whole roster at once, leaving accounts that already exist alone.
 *
 * An import is run more than once in practice — the registrar sends a revised
 * list after add/drop — so a username already in the table is the ordinary
 * case, not a failure. Postgres is told to skip those rather than abort the
 * insert, and returns only the rows it actually wrote, which is also what
 * makes a re-import safe when two administrators upload the same file at once.
 */
async function addMany(input: Partial<Student>[]) {
  if (input.length === 0) {
    return NextResponse.json({ error: '추가할 계정이 없습니다.' }, { status: 400 })
  }

  const wanted: { name: string; username: string; password: string }[] = []
  const seen = new Set<string>()
  for (const row of input) {
    const name = row.name?.trim()
    const username = row.username?.trim()
    const password = row.password
    if (!name || !username || !password) {
      return NextResponse.json(
        { error: '이름, 아이디, 비밀번호가 없는 줄이 있습니다.' },
        { status: 400 },
      )
    }
    // The administrator is never replaced by a row in a spreadsheet.
    if (username === ADMIN_USERNAME || seen.has(username)) continue
    seen.add(username)
    wanted.push({ name, username, password })
  }

  try {
    const added: Student[] = []
    for (let i = 0; i < wanted.length; i += BATCH) {
      const rows = (await sb(`students?on_conflict=username&select=${COLUMNS}`, {
        method: 'POST',
        headers: { Prefer: 'return=representation,resolution=ignore-duplicates' },
        body: JSON.stringify(wanted.slice(i, i + BATCH)),
      })) as Student[]
      added.push(...(rows ?? []))
    }

    const written = new Set(added.map((r) => r.username))
    return NextResponse.json({
      added,
      skipped: wanted.filter((r) => !written.has(r.username)).map((r) => r.username),
    })
  } catch (e) {
    return oops(e)
  }
}

export async function PATCH(request: Request) {
  const denied = await denyUnlessAdmin()
  if (denied) return denied

  let body: Partial<Student> & { id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const { id } = body
  if (!id) return NextResponse.json({ error: 'id 가 필요합니다.' }, { status: 400 })

  const patch: Record<string, string> = {}
  if (body.name !== undefined) patch.name = body.name.trim()
  if (body.username !== undefined) patch.username = body.username.trim()
  if (body.password !== undefined) patch.password = body.password

  if (Object.values(patch).some((v) => !v)) {
    return NextResponse.json(
      { error: '이름, 아이디, 비밀번호는 비워둘 수 없습니다.' },
      { status: 400 },
    )
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: '변경할 내용이 없습니다.' }, { status: 400 })
  }

  try {
    // Renaming the administrator would lock everyone out of this page, since
    // access is decided by the username. The password may still be changed.
    if (patch.username && patch.username !== ADMIN_USERNAME) {
      if ((await usernameOf(id)) === ADMIN_USERNAME) {
        return NextResponse.json(
          { error: `관리자 아이디(${ADMIN_USERNAME})는 변경할 수 없습니다.` },
          { status: 400 },
        )
      }
    }

    await sb(`students?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return oops(e)
  }
}

export async function DELETE(request: Request) {
  const denied = await denyUnlessAdmin()
  if (denied) return denied

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id 가 필요합니다.' }, { status: 400 })

  try {
    if ((await usernameOf(id)) === ADMIN_USERNAME) {
      return NextResponse.json(
        { error: '관리자 계정은 삭제할 수 없습니다.' },
        { status: 400 },
      )
    }

    await sb(`students?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return oops(e)
  }
}
