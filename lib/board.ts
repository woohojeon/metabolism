// The board: 공지사항, Q&A and 건의사항.
//
// Types shared with /api/board, plus the calls the page makes. Unlike the rest
// of the site there is no localStorage fallback: a Q&A that never leaves the
// browser it was typed in has not been asked of anyone, so with Supabase unset
// the board says so rather than pretending to have taken the message.

import { announceSessionExpired, usingSupabase } from './students'

export const BOARD_CATEGORIES = ['notice', 'qa', 'suggestion'] as const

export type BoardCategory = (typeof BOARD_CATEGORIES)[number]

export type BoardMeta = {
  slug: BoardCategory
  /** What the tab says. */
  name: string
  /**
   * The English name, used wherever the board sits among the site's own
   * furniture — the drawer's list of sections, the page's kicker — so that
   * navigation reads in one language rather than two.
   */
  english: string
  /** One line under the heading, saying who can see what is written here. */
  note: string
  /** The button that opens the compose form. */
  action: string
}

export const BOARDS: Record<BoardCategory, BoardMeta> = {
  notice: {
    slug: 'notice',
    name: '공지사항',
    english: 'Notices',
    note: '수업 공지입니다.',
    action: '공지 작성',
  },
  qa: {
    slug: 'qa',
    name: 'Q&A',
    english: 'Q&A',
    note: '수업 내용에 대해 질문하세요. 관리자와 본인만 볼 수 있으며, 다른 학생에게는 보이지 않습니다.',
    action: '질문하기',
  },
  suggestion: {
    slug: 'suggestion',
    name: '건의사항',
    english: 'Suggestions',
    note: '이 홈페이지 또는 수업에 바라는 점을 남겨 주세요. 관리자와 본인만 볼 수 있으며, 다른 학생에게는 보이지 않습니다.',
    action: '건의하기',
  },
}

export type BoardPost = {
  id: string
  category: BoardCategory
  title: string
  /** A small subset of HTML (bold/italic/underline, super/subscript), the same
   *  as an article Overview. Rendered through sanitizeRich, never raw. */
  body: string
  /** Attached image URLs, in the order they were added. */
  images: string[]
  /** Empty unless the reader is allowed to know who wrote it. */
  author: string
  /** Likewise — the administrator sees it, so a question can be traced. */
  authorUsername: string
  /** True when this reader is the author. */
  mine: boolean
  /** The administrator's answer, or null. */
  reply: string | null
  repliedAt: string | null
  createdAt: string
  updatedAt: string
}

/** Thrown when a board can only be read by someone who is signed in. */
export class NeedsSignInError extends Error {
  constructor(message = '로그인한 뒤에 이용할 수 있습니다.') {
    super(message)
  }
}

const UNCONFIGURED = '게시판이 아직 연결되지 않았습니다. (Supabase 설정 필요)'

async function fail(res: Response, fallback: string) {
  let message = fallback
  try {
    const body = await res.json()
    if (typeof body?.error === 'string') message = body.error
  } catch {
    // keep the fallback
  }

  if (res.status !== 401) return new Error(message)

  // The server does not know this browser. Say so everywhere at once, rather
  // than leaving the header showing a name it will not honour — and leaving
  // someone to type a question into a form that cannot post it.
  announceSessionExpired()
  return new NeedsSignInError(message)
}

export async function listPosts(category: BoardCategory): Promise<BoardPost[]> {
  if (!usingSupabase) throw new Error(UNCONFIGURED)

  const res = await fetch(`/api/board?category=${category}`, { cache: 'no-store' })
  if (!res.ok) throw await fail(res, '글을 불러오지 못했습니다.')
  return (await res.json()) as BoardPost[]
}

export async function createPost(input: {
  category: BoardCategory
  title: string
  body: string
  images?: string[]
}): Promise<BoardPost> {
  if (!usingSupabase) throw new Error(UNCONFIGURED)

  const res = await fetch('/api/board', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw await fail(res, '글을 등록하지 못했습니다.')
  return (await res.json()) as BoardPost
}

export async function updatePost(
  id: string,
  patch: { title?: string; body?: string; images?: string[]; reply?: string },
): Promise<BoardPost> {
  if (!usingSupabase) throw new Error(UNCONFIGURED)

  const res = await fetch('/api/board', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...patch }),
  })
  if (!res.ok) throw await fail(res, '저장하지 못했습니다.')
  return (await res.json()) as BoardPost
}

export async function deletePost(id: string): Promise<void> {
  if (!usingSupabase) throw new Error(UNCONFIGURED)

  const res = await fetch(`/api/board?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw await fail(res, '글을 삭제하지 못했습니다.')
}

/** `2026. 8. 21.` — the date a post was written, in the reader's locale. */
export function formatPostDate(iso: string) {
  const when = new Date(iso)
  if (Number.isNaN(when.getTime())) return ''
  return when.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
