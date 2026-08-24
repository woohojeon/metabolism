import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  ADMIN_COOKIE,
  USER_COOKIE,
  isAdminSession,
  readUserSession,
} from '@/lib/admin-session'
import {
  BOARD_CATEGORIES,
  MAX_FILES,
  MAX_FILE_BYTES,
  hasAllowedExtension,
  type BoardAttachment,
  type BoardCategory,
  type BoardPost,
} from '@/lib/board'
import { sb, sbDelete, storagePathOf, supabaseReady } from '@/lib/supabase-rest'

// The three boards. What separates them is not their shape but who may read
// them, and that is decided here — never in the browser, and never by a
// row-level policy the anon key could talk to directly.
//
//   notice     공지사항  — the administrator writes; everyone reads.
//   qa         Q&A      — anyone signed in writes; only the administrator and
//   suggestion 건의사항           the author read. Nobody else learns that the
//                                post exists, let alone who wrote it.
//
// The author is taken from the signed session cookie, so a post cannot be
// filed under someone else's name by editing a request body.

const COLUMNS =
  'id,category,title,body,images,files,author_username,author_name,reply,reply_images,replied_at,created_at,updated_at'

/** How much of a post the table will accept, so one request cannot fill it. */
const MAX_TITLE = 200
const MAX_BODY = 20_000
/** Separators and line ends, which a download filename must not carry. */
const FILENAME_HOSTILE = /[\\/\r\n]/g

/** At most this many images per post, each URL no longer than this. */
const MAX_IMAGES = 8
const MAX_IMAGE_URL = 2000

type Row = {
  id: string
  category: BoardCategory
  title: string
  body: string
  images: string[] | null
  files: BoardAttachment[] | null
  author_username: string
  author_name: string
  reply: string | null
  reply_images: string[] | null
  replied_at: string | null
  created_at: string
  updated_at: string
}

/**
 * The attachment list a request may store. Only URLs this site would itself
 * produce are kept — a Storage link, a same-origin path, or the data: URL used
 * when Supabase is unset — so a request body cannot smuggle in a `javascript:`
 * or off-site reference for the gallery to render. Returns null when the value
 * is present but malformed, so the caller can reject the whole request.
 */
function cleanImages(value: unknown): string[] | null {
  if (value === undefined) return []
  if (!Array.isArray(value)) return null
  const out: string[] = []
  for (const item of value) {
    if (typeof item !== 'string') return null
    const s = item.trim()
    if (!s) continue
    if (s.length > MAX_IMAGE_URL) return null
    if (!/^https?:\/\//i.test(s) && !s.startsWith('/') && !/^data:image\//i.test(s)) {
      return null
    }
    out.push(s)
  }
  return out.length > MAX_IMAGES ? null : out
}

/**
 * The document list a request may store.
 *
 * Stricter than cleanImages, because a document is handed straight back out as
 * a download: every URL has to be one this site's own /api/upload signed, which
 * is what `storagePathOf` answers, so a post cannot be turned into a link to
 * somewhere else under the course's name. The extension is checked again here —
 * the browser's file picker is a convenience, not a rule — and the name is kept
 * only for the download, so the parts of a path and the newline that would end
 * a header are taken out of it.
 *
 * Returns null when the value is present but malformed, as cleanImages does.
 */
function cleanFiles(value: unknown): BoardAttachment[] | null {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > MAX_FILES) return null

  const out: BoardAttachment[] = []
  for (const item of value) {
    const name = typeof item?.name === 'string' ? item.name.trim() : ''
    const url = typeof item?.url === 'string' ? item.url : ''
    const size = typeof item?.size === 'number' ? item.size : 0

    if (!name || !hasAllowedExtension(name)) return null
    if (!storagePathOf(url)) return null
    if (size < 0 || size > MAX_FILE_BYTES) return null

    out.push({ name: name.replace(FILENAME_HOSTILE, '_').slice(0, 200), url, size })
  }
  return out
}

/** Every upload a post points at — pictures, documents, and the answer's. */
function filesOf(row: Row): string[] {
  return [
    ...(row.images ?? []),
    ...(row.reply_images ?? []),
    ...(row.files ?? []).map((f) => f.url),
  ]
}

/**
 * Drops uploads a post no longer points at.
 *
 * Here rather than in the browser, because deleting is the one thing the
 * uploads bucket cannot let a student ask for by URL: signing in would then be
 * enough to remove the slides, the newspaper, or somebody else's picture. This
 * route has already worked out that the caller owns the post, so it is the one
 * place that can say which files are theirs to lose.
 *
 * Best effort, and always after the row is written: a file left behind costs a
 * little storage, while one removed ahead of a save that then fails leaves a
 * post pointing at nothing.
 */
async function dropUploads(urls: string[]) {
  for (const url of urls) {
    const path = storagePathOf(url)
    if (!path) continue
    try {
      await sbDelete(path)
    } catch {
      // Already gone, or storage is unhappy. Neither changes what the caller
      // asked for, which was to change the post.
    }
  }
}

/**
 * What the browser is given.
 *
 * `mine` rather than a raw username: the author of a post is not something a
 * page needs to be told in order to show a delete button, and the less of the
 * roster that leaves this route the less there is to leak. The administrator
 * does get the name, because reading who asked what is the point of the board.
 */
function present(row: Row, viewer: string | null, isAdmin: boolean): BoardPost {
  const mine = row.author_username === viewer
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    body: row.body,
    images: row.images ?? [],
    files: row.files ?? [],
    author: isAdmin || row.category === 'notice' ? row.author_name : mine ? '나' : '',
    authorUsername: isAdmin ? row.author_username : mine ? row.author_username : '',
    mine,
    reply: row.reply,
    replyImages: row.reply_images ?? [],
    repliedAt: row.replied_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function unconfigured() {
  return NextResponse.json({ error: 'Supabase 가 설정되지 않았습니다.' }, { status: 501 })
}

function oops() {
  return NextResponse.json({ error: '데이터베이스 요청이 실패했습니다.' }, { status: 502 })
}

/** Who is asking. Both answers come from cookies the page cannot write. */
async function whoIsAsking() {
  const jar = await cookies()
  return {
    user: readUserSession(jar.get(USER_COOKIE)?.value),
    isAdmin: isAdminSession(jar.get(ADMIN_COOKIE)?.value),
  }
}

function isCategory(value: unknown): value is BoardCategory {
  return typeof value === 'string' && (BOARD_CATEGORIES as readonly string[]).includes(value)
}

/** Reads one post, so a write can be checked against who owns it. */
async function postById(id: string) {
  const rows = (await sb(
    `board_posts?id=eq.${encodeURIComponent(id)}&select=${COLUMNS}&limit=1`,
  )) as Row[]
  return rows?.[0] ?? null
}

// ----------------------------------------------------------------------- read

/** GET /api/board?category=… — the posts this caller is allowed to see. */
export async function GET(request: Request) {
  if (!supabaseReady) return unconfigured()

  const category = new URL(request.url).searchParams.get('category')
  if (!isCategory(category)) {
    return NextResponse.json({ error: '알 수 없는 게시판입니다.' }, { status: 400 })
  }

  const { user, isAdmin } = await whoIsAsking()

  // Every board — notices included — is for signed-in readers only; to a
  // visitor who is not signed in it does not exist at all.
  if (!user && !isAdmin) {
    return NextResponse.json(
      { error: '로그인한 뒤에 이용할 수 있습니다.' },
      { status: 401 },
    )
  }

  // A private board additionally shows a signed-in student their own posts and
  // nothing else. Notices stay readable by any signed-in reader.
  let filter = ''
  if (category !== 'notice' && !isAdmin && user) {
    filter = `&author_username=eq.${encodeURIComponent(user)}`
  }

  try {
    const rows = (await sb(
      `board_posts?category=eq.${category}${filter}&select=${COLUMNS}&order=created_at.desc`,
    )) as Row[]
    return NextResponse.json((rows ?? []).map((r) => present(r, user, isAdmin)))
  } catch {
    return oops()
  }
}

// ---------------------------------------------------------------------- write

export async function POST(request: Request) {
  if (!supabaseReady) return unconfigured()

  let body: {
    category?: unknown
    title?: unknown
    body?: unknown
    images?: unknown
    files?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  if (!isCategory(body.category)) {
    return NextResponse.json({ error: '알 수 없는 게시판입니다.' }, { status: 400 })
  }
  const category = body.category
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const text = typeof body.body === 'string' ? body.body.trim() : ''
  const images = cleanImages(body.images)
  const files = cleanFiles(body.files)

  if (images === null) {
    return NextResponse.json({ error: '첨부 이미지가 올바르지 않습니다.' }, { status: 400 })
  }
  if (files === null) {
    return NextResponse.json({ error: '첨부파일이 올바르지 않습니다.' }, { status: 400 })
  }
  if (!title || !text) {
    return NextResponse.json({ error: '제목과 내용을 모두 입력하세요.' }, { status: 400 })
  }
  if (title.length > MAX_TITLE || text.length > MAX_BODY) {
    return NextResponse.json({ error: '내용이 너무 깁니다.' }, { status: 400 })
  }

  const { user, isAdmin } = await whoIsAsking()

  if (category === 'notice' && !isAdmin) {
    return NextResponse.json(
      { error: '공지사항은 관리자만 작성할 수 있습니다.' },
      { status: 403 },
    )
  }
  if (!user) {
    return NextResponse.json(
      { error: '로그인한 뒤에 작성할 수 있습니다.' },
      { status: 401 },
    )
  }

  try {
    // The display name comes from the roster rather than the request, for the
    // same reason the username does.
    const found = (await sb(
      `students?username=eq.${encodeURIComponent(user)}&select=name&limit=1`,
    )) as { name: string }[]

    const rows = (await sb(`board_posts?select=${COLUMNS}`, {
      method: 'POST',
      body: JSON.stringify({
        category,
        title,
        body: text,
        images,
        files,
        author_username: user,
        author_name: found?.[0]?.name ?? user,
      }),
    })) as Row[]

    return NextResponse.json(present(rows[0], user, isAdmin))
  } catch {
    return oops()
  }
}

/**
 * PATCH /api/board — body { id, title?, body?, reply? }.
 *
 * An author may correct their own post; the administrator may answer one. The
 * administrator deliberately cannot rewrite a student's question: being able
 * to edit what someone asked is not part of running a board.
 */
export async function PATCH(request: Request) {
  if (!supabaseReady) return unconfigured()

  let body: {
    id?: unknown
    title?: unknown
    body?: unknown
    images?: unknown
    files?: unknown
    reply?: unknown
    replyImages?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) return NextResponse.json({ error: 'id 가 필요합니다.' }, { status: 400 })

  const { user, isAdmin } = await whoIsAsking()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }
  // Checked before the post is read: whether someone may answer at all does not
  // depend on which post they picked, so refusing here says so plainly instead
  // of reporting whatever the lookup happened to do.
  if (body.reply !== undefined && !isAdmin) {
    return NextResponse.json(
      { error: '답변은 관리자만 작성할 수 있습니다.' },
      { status: 403 },
    )
  }

  try {
    const row = await postById(id)
    if (!row) {
      return NextResponse.json({ error: '글을 찾을 수 없습니다.' }, { status: 404 })
    }
    // A post nobody but its author and the administrator may read is also one
    // whose existence a stranger should not be able to confirm by editing it.
    if (row.author_username !== user && !isAdmin) {
      return NextResponse.json({ error: '글을 찾을 수 없습니다.' }, { status: 404 })
    }

    // `unknown` in the value: images map to a text[] column and files to jsonb,
    // and PostgREST takes both as the arrays they already are.
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.reply !== undefined) {
      const reply = typeof body.reply === 'string' ? body.reply.trim() : ''
      if (reply.length > MAX_BODY) {
        return NextResponse.json({ error: '답변이 너무 깁니다.' }, { status: 400 })
      }
      const replyImages = cleanImages(body.replyImages)
      if (replyImages === null) {
        return NextResponse.json(
          { error: '첨부 이미지가 올바르지 않습니다.' },
          { status: 400 },
        )
      }
      // An emptied box removes the answer rather than storing a blank one; its
      // images go with it, so a cleared reply never leaves orphaned pictures.
      patch.reply = reply || null
      patch.reply_images = reply ? replyImages : []
      patch.replied_at = reply ? new Date().toISOString() : null
    }

    if (
      body.title !== undefined ||
      body.body !== undefined ||
      body.images !== undefined ||
      body.files !== undefined
    ) {
      if (row.author_username !== user) {
        return NextResponse.json(
          { error: '남의 글은 수정할 수 없습니다.' },
          { status: 403 },
        )
      }
      const title = typeof body.title === 'string' ? body.title.trim() : row.title
      const text = typeof body.body === 'string' ? body.body.trim() : row.body
      if (!title || !text) {
        return NextResponse.json(
          { error: '제목과 내용을 모두 입력하세요.' },
          { status: 400 },
        )
      }
      if (title.length > MAX_TITLE || text.length > MAX_BODY) {
        return NextResponse.json({ error: '내용이 너무 깁니다.' }, { status: 400 })
      }
      patch.title = title
      patch.body = text
      if (body.images !== undefined) {
        const images = cleanImages(body.images)
        if (images === null) {
          return NextResponse.json(
            { error: '첨부 이미지가 올바르지 않습니다.' },
            { status: 400 },
          )
        }
        // PostgREST maps a JSON array to the text[] column directly.
        patch.images = images
      }
      if (body.files !== undefined) {
        const files = cleanFiles(body.files)
        if (files === null) {
          return NextResponse.json(
            { error: '첨부파일이 올바르지 않습니다.' },
            { status: 400 },
          )
        }
        patch.files = files
      }
    }

    if (Object.keys(patch).length === 1) {
      return NextResponse.json({ error: '변경할 내용이 없습니다.' }, { status: 400 })
    }

    const rows = (await sb(`board_posts?id=eq.${encodeURIComponent(id)}&select=${COLUMNS}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })) as Row[]

    // Only now that the post no longer points at them.
    const kept = new Set(filesOf(rows[0]))
    await dropUploads(filesOf(row).filter((url) => !kept.has(url)))

    return NextResponse.json(present(rows[0], user, isAdmin))
  } catch {
    return oops()
  }
}

/** DELETE /api/board?id=… — the administrator, or the post's own author. */
export async function DELETE(request: Request) {
  if (!supabaseReady) return unconfigured()

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id 가 필요합니다.' }, { status: 400 })

  const { user, isAdmin } = await whoIsAsking()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  try {
    const row = await postById(id)
    if (!row) {
      return NextResponse.json({ error: '글을 찾을 수 없습니다.' }, { status: 404 })
    }
    if (row.author_username !== user && !isAdmin) {
      return NextResponse.json({ error: '글을 찾을 수 없습니다.' }, { status: 404 })
    }

    await sb(`board_posts?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' })
    await dropUploads(filesOf(row))
    return NextResponse.json({ ok: true })
  } catch {
    return oops()
  }
}
