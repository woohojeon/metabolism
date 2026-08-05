import { randomUUID } from 'node:crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ADMIN_COOKIE, isAdminSession } from '@/lib/admin-session'
import { sbDelete, sbSignedUpload, storagePathOf, supabaseReady } from '@/lib/supabase-rest'

// Hands an edit control somewhere to put one file, and the URL that file will
// be served from afterwards, so the caller can store that string instead of a
// data: URL. Administrator only, for the same reason as /api/content: an
// upload is visible to everyone.
//
// The file itself never comes through here — see sbSignedUpload for why. This
// route only ever carries a filename and a pair of URLs.

/** Keeps the stored name predictable regardless of what was uploaded. */
function extensionOf(name: string) {
  const dot = name.lastIndexOf('.')
  if (dot < 0) return ''
  const ext = name.slice(dot + 1).toLowerCase()
  return /^[a-z0-9]{1,8}$/.test(ext) ? `.${ext}` : ''
}

export async function POST(request: Request) {
  if (!supabaseReady) {
    return NextResponse.json({ error: 'Supabase 가 설정되지 않았습니다.' }, { status: 501 })
  }

  const jar = await cookies()
  if (!isAdminSession(jar.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  let filename: unknown
  try {
    filename = ((await request.json()) as { filename?: unknown })?.filename
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  if (typeof filename !== 'string' || !filename) {
    return NextResponse.json({ error: '파일 이름이 필요합니다.' }, { status: 400 })
  }

  // A fresh name every time, so an upload can never overwrite an earlier one
  // and no caller has to think about collisions.
  const path = `${randomUUID()}${extensionOf(filename)}`

  try {
    return NextResponse.json(await sbSignedUpload(path))
  } catch {
    return NextResponse.json({ error: '업로드를 준비하지 못했습니다.' }, { status: 502 })
  }
}

/**
 * DELETE /api/upload?url=… — drops a file this application uploaded, once the
 * page that pointed at it has been saved without it. Callers delete after the
 * new state is stored, never before: an orphaned file only costs storage,
 * while a file removed ahead of a save that then fails leaves every visitor
 * with a broken link.
 */
export async function DELETE(request: Request) {
  if (!supabaseReady) {
    return NextResponse.json({ error: 'Supabase 가 설정되지 않았습니다.' }, { status: 501 })
  }

  const jar = await cookies()
  if (!isAdminSession(jar.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  const url = new URL(request.url).searchParams.get('url')
  const path = url && storagePathOf(url)
  if (!path) {
    return NextResponse.json(
      { error: '이 사이트가 올린 파일이 아닙니다.' },
      { status: 400 },
    )
  }

  try {
    await sbDelete(path)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '파일을 지우지 못했습니다.' }, { status: 502 })
  }
}
