import { randomUUID } from 'node:crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ADMIN_COOKIE, isAdminSession } from '@/lib/admin-session'
import { sbUpload, supabaseReady } from '@/lib/supabase-rest'

// Accepts one file from an edit control and returns the URL it now lives at,
// so the caller can store that string instead of a data: URL. Administrator
// only, for the same reason as /api/content: an upload is visible to everyone.

/** Comfortably under Supabase's default per-file ceiling. */
const MAX_BYTES = 25 * 1024 * 1024

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

  let file: File | null
  try {
    file = (await request.formData()).get('file') as File | null
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  if (!file || typeof file.arrayBuffer !== 'function') {
    return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `파일이 너무 큽니다. ${MAX_BYTES / 1024 / 1024}MB 이하만 올릴 수 있습니다.` },
      { status: 413 },
    )
  }

  try {
    const url = await sbUpload(
      `${randomUUID()}${extensionOf(file.name)}`,
      await file.arrayBuffer(),
      file.type || 'application/octet-stream',
    )
    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ error: '업로드에 실패했습니다.' }, { status: 502 })
  }
}
