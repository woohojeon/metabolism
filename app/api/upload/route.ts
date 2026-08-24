import { randomUUID } from 'node:crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  ADMIN_COOKIE,
  USER_COOKIE,
  isAdminSession,
  readUserSession,
} from '@/lib/admin-session'
import { sbDelete, sbSignedUpload, storagePathOf, supabaseReady } from '@/lib/supabase-rest'

// Hands an edit control somewhere to put one file, and the URL that file will
// be served from afterwards, so the caller can store that string instead of a
// data: URL.
//
// Signing in is enough to upload, because a student attaching a photograph to
// a question — the screen they are stuck on, the page of the textbook — is the
// board working as intended. What signing in does not buy is a free hand with
// the bucket: a student may put up an image and nothing else, while the
// administrator, who also replaces slides and hands out 한글 and PDF files,
// may put up anything. A visitor who is signed in to nothing may put up
// nothing at all.
//
// The file itself never comes through here — see sbSignedUpload for why. This
// route only ever carries a filename and a pair of URLs.

/**
 * What a signed-in student may upload. The bucket is public and served from
 * the course's own address, so the one thing the board asks of them — a
 * picture — is the one thing this list holds.
 */
// accept="image/*" in the picker is wider than this on purpose: it is the
// list the server will stand behind, so it holds everything a phone or a
// screenshot produces. .svg is left out — it is a document that can carry
// script, not a picture.
const IMAGE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.jfif',
  '.pjp',
  '.gif',
  '.bmp',
  '.tif',
  '.tiff',
  '.webp',
  '.avif',
  '.apng',
  '.heic',
  '.heif',
]

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
  const isAdmin = isAdminSession(jar.get(ADMIN_COOKIE)?.value)
  const user = readUserSession(jar.get(USER_COOKIE)?.value)
  if (!isAdmin && !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
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

  const extension = extensionOf(filename)
  if (!isAdmin && !IMAGE_EXTENSIONS.includes(extension)) {
    return NextResponse.json({ error: '이미지 파일만 올릴 수 있습니다.' }, { status: 403 })
  }

  // A fresh name every time, so an upload can never overwrite an earlier one
  // and no caller has to think about collisions.
  const path = `${randomUUID()}${extension}`

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
