import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ADMIN_COOKIE, isAdminSession } from '@/lib/admin-session'
import { sb, supabaseReady } from '@/lib/supabase-rest'

// Read and write the shared site content documents in public.site_content.
//
// Reading is open to everyone: this is the published course material, and the
// pages that show it are public. Writing is restricted to the administrator
// cookie set by /api/login — the edit affects every visitor, so a signed-in
// student must not be able to make one.

type Row = { value: unknown }

function unconfigured() {
  return NextResponse.json({ error: 'Supabase 가 설정되지 않았습니다.' }, { status: 501 })
}

async function denyUnlessAdmin() {
  const jar = await cookies()
  if (!isAdminSession(jar.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }
  return null
}

function oops() {
  return NextResponse.json({ error: '데이터베이스 요청이 실패했습니다.' }, { status: 502 })
}

/** GET /api/content?key=… → the stored value, or null if nothing is saved. */
export async function GET(request: Request) {
  if (!supabaseReady) return unconfigured()

  const key = new URL(request.url).searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'key 가 필요합니다.' }, { status: 400 })

  try {
    const rows = (await sb(
      `site_content?key=eq.${encodeURIComponent(key)}&select=value&limit=1`,
    )) as Row[]
    return NextResponse.json({ value: rows?.[0]?.value ?? null })
  } catch {
    return oops()
  }
}

/** PUT /api/content — body { key, value }. Inserts or replaces one document. */
export async function PUT(request: Request) {
  if (!supabaseReady) return unconfigured()
  const denied = await denyUnlessAdmin()
  if (denied) return denied

  let body: { key?: unknown; value?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const { key, value } = body
  if (typeof key !== 'string' || !key || value === undefined) {
    return NextResponse.json({ error: 'key 와 value 가 필요합니다.' }, { status: 400 })
  }

  try {
    await sb('site_content', {
      method: 'POST',
      body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }),
      // Upsert: saving is a repeated overwrite of the same key, not an insert.
      headers: { Prefer: 'resolution=merge-duplicates' },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return oops()
  }
}

/** DELETE /api/content?key=… — used by the "revert to original" buttons. */
export async function DELETE(request: Request) {
  if (!supabaseReady) return unconfigured()
  const denied = await denyUnlessAdmin()
  if (denied) return denied

  const key = new URL(request.url).searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'key 가 필요합니다.' }, { status: 400 })

  try {
    await sb(`site_content?key=eq.${encodeURIComponent(key)}`, { method: 'DELETE' })
    return NextResponse.json({ ok: true })
  } catch {
    return oops()
  }
}
