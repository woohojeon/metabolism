'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Bold,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Italic,
  Lock,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  Subscript,
  Superscript,
  Trash2,
  Underline,
  X,
} from 'lucide-react'
import { useAuth } from './auth-provider'
import { CategoryLabel } from './article-bits'
import { LoginDialog } from './login-dialog'
import { sanitizeRich } from '@/lib/rich-text'
import { deleteUpload, uploadFile } from '@/lib/site-content'
import {
  BOARDS,
  BOARD_CATEGORIES,
  NeedsSignInError,
  createPost,
  deletePost,
  formatPostDate,
  listPosts,
  updatePost,
  type BoardCategory,
  type BoardPost,
} from '@/lib/board'

const FIELD =
  'w-full rounded-md border border-neutral-300 bg-background px-3 py-2 text-[15px] outline-none transition-colors focus:border-foreground'

const LABEL = 'text-[11px] font-bold uppercase tracking-wider text-neutral-500'

/** At most this many images per post — mirrors the server's own limit. */
const MAX_IMAGES = 8

/** Posts shown per page. */
const PAGE_SIZE = 10

type Draft = { title: string; body: string; images: string[] }

const EMPTY: Draft = { title: '', body: '', images: [] }

function isCategory(value: string | null): value is BoardCategory {
  return value !== null && (BOARD_CATEGORIES as readonly string[]).includes(value)
}

/**
 * The contentEditable body as a single sanitised HTML string. Enter yields a
 * <div>/<p> block in the browser; those become <br> so the line breaks survive
 * a round-trip through sanitizeRich, which keeps only bold/italic/underline and
 * super/subscript. Leading and trailing breaks are trimmed off.
 */
function toStoredHtml(rawHtml: string): string {
  const withBreaks = rawHtml
    .replace(/<\/(?:div|p)>/gi, '')
    .replace(/<(?:div|p)[^>]*>/gi, '<br>')
  return sanitizeRich(withBreaks)
    .replace(/^(?:\s|<br\s*\/?>)+/i, '')
    .replace(/(?:\s|<br\s*\/?>)+$/i, '')
}

/** True when a rich body carries no text and no images — nothing to post. */
function htmlIsBlank(html: string): boolean {
  return html.replace(/<[^>]*>/g, '').replace(/[\s ]|&nbsp;/g, '').length === 0
}

export function Board() {
  const { user, isAdmin, ready } = useAuth()
  const router = useRouter()
  const params = useSearchParams()

  const wanted = params.get('tab')
  const tab: BoardCategory = isCategory(wanted) ? wanted : 'notice'
  const board = BOARDS[tab]

  const [posts, setPosts] = useState<BoardPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [needsSignIn, setNeedsSignIn] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

  const [composing, setComposing] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [busy, setBusy] = useState(false)

  const [openId, setOpenId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY)
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [replyImages, setReplyImages] = useState<string[]>([])
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  // Who may write here. Notices are the administrator's; the private boards
  // are for anyone signed in, including the administrator.
  const mayWrite = tab === 'notice' ? isAdmin : Boolean(user)
  const isPrivate = tab !== 'notice'

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    setNeedsSignIn(false)
    try {
      setPosts(await listPosts(tab))
    } catch (e) {
      setPosts([])
      if (e instanceof NeedsSignInError) setNeedsSignIn(true)
      else setError(e instanceof Error ? e.message : '글을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [tab])

  // Re-read on every change of board or of who is reading it: signing in is
  // what turns an empty private board into that person's own posts.
  useEffect(() => {
    if (!ready) return
    setOpenId(null)
    setComposing(false)
    setEditingId(null)
    setReplyingId(null)
    setReplyImages([])
    setPage(1)
    void refresh()
  }, [ready, user, isAdmin, refresh])

  const goTo = (next: BoardCategory) => {
    router.replace(next === 'notice' ? '/board' : `/board?tab=${next}`, {
      scroll: false,
    })
  }

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError('')
    try {
      await action()
    } catch (e) {
      if (e instanceof NeedsSignInError) setNeedsSignIn(true)
      setError(e instanceof Error ? e.message : '요청이 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const submitPost = () =>
    run(async () => {
      const post = await createPost({ category: tab, ...draft })
      setPosts((prev) => [post, ...prev])
      setDraft(EMPTY)
      setComposing(false)
      setOpenId(post.id)
    })

  const saveEdit = (id: string) =>
    run(async () => {
      // Images taken out of the post during this edit, dropped from storage
      // only after the save lands — so a failed save leaves nothing pointing
      // at a file that is already gone.
      const before = posts.find((p) => p.id === id)?.images ?? []
      const post = await updatePost(id, editDraft)
      setPosts((prev) => prev.map((p) => (p.id === id ? post : p)))
      setEditingId(null)
      before
        .filter((src) => !editDraft.images.includes(src))
        .forEach((src) => void deleteUpload(src))
    })

  const saveReply = (id: string) =>
    run(async () => {
      const before = posts.find((p) => p.id === id)?.replyImages ?? []
      const reply = htmlIsBlank(replyDraft) ? '' : replyDraft
      // A cleared answer takes its images with it.
      const nextImages = reply ? replyImages : []
      const post = await updatePost(id, { reply, replyImages: nextImages })
      setPosts((prev) => prev.map((p) => (p.id === id ? post : p)))
      setReplyingId(null)
      before
        .filter((src) => !nextImages.includes(src))
        .forEach((src) => void deleteUpload(src))
    })

  const remove = (id: string) =>
    run(async () => {
      const target = posts.find((p) => p.id === id)
      const gone = [...(target?.images ?? []), ...(target?.replyImages ?? [])]
      await deletePost(id)
      setPosts((prev) => prev.filter((p) => p.id !== id))
      gone.forEach((src) => void deleteUpload(src))
    })

  // A single red button that asks before it acts, rather than swapping the row
  // into a confirm/cancel pair. Matches the slide-delete flow elsewhere.
  const confirmRemove = (id: string) => {
    if (window.confirm('이 글을 정말 삭제하시겠습니까?\n삭제한 글은 되돌릴 수 없습니다.')) {
      void remove(id)
    }
  }

  const unanswered = useMemo(
    () => posts.filter((p) => !p.reply).length,
    [posts],
  )

  const pageCount = Math.max(1, Math.ceil(posts.length / PAGE_SIZE))
  const visible = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Deleting the last post on the last page pulls the page count down under
  // the current page; step back onto one that still has posts.
  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  // Turning a page starts from the top of a fresh list — no post left expanded
  // or mid-edit from the page just left.
  const goToPage = (next: number) => {
    setOpenId(null)
    setEditingId(null)
    setReplyingId(null)
    setPage(next)
  }

  if (!ready) return <div className="h-64" />

  return (
    <>
      {/* Masthead */}
      <header className="border-b border-neutral-200 pb-6">
        <CategoryLabel>{board.english}</CategoryLabel>
        <h1 className="mt-1 text-4xl font-extrabold leading-tight sm:text-5xl">
          게시판
        </h1>
        <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-neutral-600">
          {board.note}
        </p>
      </header>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-4">
        {BOARD_CATEGORIES.map((slug) => {
          const on = slug === tab
          return (
            <button
              key={slug}
              type="button"
              onClick={() => goTo(slug)}
              aria-current={on ? 'page' : undefined}
              className={`flex h-10 items-center gap-1.5 rounded-md border px-4 text-[12px] font-bold uppercase tracking-wider transition-colors ${
                on
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-neutral-300 text-neutral-600 hover:border-foreground hover:text-foreground'
              }`}
            >
              {BOARDS[slug].name}
              {slug !== 'notice' && (
                <Lock className="size-3.5 opacity-70" aria-label="비공개" />
              )}
            </button>
          )
        })}

        {mayWrite && !composing && (
          <button
            type="button"
            onClick={() => {
              setComposing(true)
              setDraft(EMPTY)
              setError('')
            }}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-science-red px-5 text-[11px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90 sm:ml-auto sm:w-auto"
          >
            <Plus className="size-4" />
            {board.action}
          </button>
        )}
      </div>

      {/* What the administrator is looking at, when it is a private board */}
      {isAdmin && isPrivate && !loading && posts.length > 0 && (
        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-neutral-200 bg-neutral-200">
          {[
            { label: 'Posts', value: posts.length },
            { label: 'Awaiting reply', value: unanswered },
          ].map((s) => (
            <div key={s.label} className="bg-panel px-5 py-4">
              <dt className={LABEL}>{s.label}</dt>
              <dd className="mt-1 text-2xl font-extrabold text-foreground">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {error && (
        <div className="mt-6 border-l-4 border-science-red bg-panel px-4 py-3">
          <p className="text-[14px] font-medium text-foreground">{error}</p>
        </div>
      )}

      {/* Compose */}
      {composing && (
        <section className="mt-6 overflow-hidden rounded-md border border-neutral-300">
          <header className="border-b border-neutral-200 bg-panel/60 px-5 py-3">
            <h2 className={LABEL}>{board.action}</h2>
          </header>
          <div className="flex flex-col gap-4 px-5 py-5">
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>제목</span>
              <input
                autoFocus
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                maxLength={200}
                className={FIELD}
              />
            </label>
            <div className="flex flex-col gap-1.5">
              <span className={LABEL}>내용</span>
              <RichField
                html={draft.body}
                onChange={(body) => setDraft((d) => ({ ...d, body }))}
                placeholder="내용을 입력하세요"
              />
            </div>
            <ImageAttach
              images={draft.images}
              onChange={(images) => setDraft((d) => ({ ...d, images }))}
              disabled={busy}
            />
            {isPrivate && (
              <p className="text-[13px] leading-relaxed text-neutral-500">
                작성한 글은 관리자와 본인에게만 보입니다.
              </p>
            )}
          </div>
          <footer className="flex flex-wrap items-center gap-2 border-t border-neutral-200 bg-panel/60 px-5 py-4">
            <PillButton
              onClick={submitPost}
              disabled={busy || !draft.title.trim() || htmlIsBlank(draft.body)}
              tone="danger"
            >
              <Check className="size-4" />
              {busy ? '등록 중…' : '등록'}
            </PillButton>
            <PillButton onClick={() => setComposing(false)} disabled={busy}>
              취소
            </PillButton>
          </footer>
        </section>
      )}

      {/* A private board, to someone who has not signed in */}
      {needsSignIn ? (
        <div className="mx-auto flex min-h-[60vh] max-w-[520px] flex-col justify-center py-16 text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-panel">
            <Lock className="size-6 text-science-red" />
          </span>
          <h2 className="mt-5 text-2xl font-extrabold leading-tight">
            로그인이 필요합니다
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
            {isPrivate
              ? `${board.name}은(는) 관리자와 글쓴이 본인만 볼 수 있습니다. 로그인하면 직접 남긴 글과 답변을 확인할 수 있습니다.`
              : `${board.name}은(는) 로그인한 뒤에 볼 수 있습니다. 로그인하면 수업 공지를 확인할 수 있습니다.`}
          </p>
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="mt-7 h-11 rounded-md bg-science-red px-6 text-[12px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
          >
            Sign in
          </button>
        </div>
      ) : loading ? (
        <ul className="mt-2 min-h-[60vh]">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="border-b border-neutral-200 px-3 py-5">
              <div className="h-4 w-2/3 animate-pulse rounded bg-panel" />
              <div className="mt-2.5 h-3 w-1/3 animate-pulse rounded bg-panel" />
            </li>
          ))}
        </ul>
      ) : posts.length === 0 ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-panel">
            <MessageSquare className="size-6 text-neutral-400" />
          </span>
          <p className="mt-5 text-[15px] font-semibold text-foreground">
            {tab === 'notice' ? '등록된 공지가 없습니다.' : '아직 남긴 글이 없습니다.'}
          </p>
          <p className="mt-1 text-[14px] text-neutral-500">
            {mayWrite
              ? `위의 ${board.action} 버튼으로 첫 글을 남겨 보세요.`
              : '새 공지가 올라오면 이곳에 표시됩니다.'}
          </p>
        </div>
      ) : (
        <>
        <ul className="mt-2 min-h-[60vh]">
          {visible.map((post) => {
            const open = openId === post.id
            const editing = editingId === post.id
            const replying = replyingId === post.id

            return (
              <li
                key={post.id}
                className={`border-b border-neutral-200 ${open ? 'bg-panel/20' : ''}`}
              >
                {/* The row itself */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(open ? null : post.id)
                    setEditingId(null)
                    setReplyingId(null)
                  }}
                  aria-expanded={open}
                  className="group flex w-full items-start gap-3 px-3 py-5 text-left transition-colors hover:bg-panel/40"
                >
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 break-words text-[16px] font-bold leading-snug text-foreground transition-colors group-hover:text-science-red sm:text-[17px]">
                      {post.title}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {isPrivate && <StatusBadge answered={Boolean(post.reply)} />}
                      <span className={LABEL}>{formatPostDate(post.createdAt)}</span>
                      {post.author && (
                        <span className="text-[11px] font-semibold text-neutral-500">
                          {post.author}
                          {isAdmin && post.authorUsername && isPrivate && (
                            <span className="ml-1.5 font-mono text-[11px] text-neutral-400">
                              {post.authorUsername}
                            </span>
                          )}
                        </span>
                      )}
                      {post.images.length > 0 && (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-400"
                          aria-label={`이미지 ${post.images.length}장`}
                        >
                          <Paperclip className="size-3.5" aria-hidden />
                          {post.images.length}
                        </span>
                      )}
                    </span>
                  </span>
                  <ChevronDown
                    className={`mt-0.5 size-5 shrink-0 text-neutral-400 transition-transform group-hover:text-science-red ${
                      open ? 'rotate-180' : ''
                    }`}
                    aria-hidden
                  />
                </button>

                {/* Its body */}
                {open && (
                  <div className="px-3 pb-6">
                    {editing ? (
                      <div className="flex flex-col gap-3 rounded-md border border-l-4 border-neutral-200 border-l-foreground bg-panel/40 px-4 py-4">
                        <input
                          value={editDraft.title}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, title: e.target.value })
                          }
                          maxLength={200}
                          className={FIELD}
                        />
                        <RichField
                          html={editDraft.body}
                          onChange={(body) => setEditDraft((d) => ({ ...d, body }))}
                          placeholder="내용을 입력하세요"
                        />
                        <ImageAttach
                          images={editDraft.images}
                          onChange={(images) => setEditDraft((d) => ({ ...d, images }))}
                          disabled={busy}
                        />
                        <div className="flex items-center gap-2">
                          <PillButton
                            onClick={() => saveEdit(post.id)}
                            disabled={
                              busy || !editDraft.title.trim() || htmlIsBlank(editDraft.body)
                            }
                            tone="primary"
                          >
                            <Check className="size-4" />
                            저장
                          </PillButton>
                          <PillButton onClick={() => setEditingId(null)} disabled={busy}>
                            <X className="size-4" />
                          </PillButton>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-md border border-neutral-200 bg-background px-5 py-5">
                        <RichView html={post.body} />
                        <AttachmentGallery
                          images={post.images}
                          onOpen={(src) => setLightbox(src)}
                        />
                      </div>
                    )}

                    {/* The administrator's answer */}
                    {post.reply && !replying && (
                      <div className="mt-4 rounded-md border border-l-4 border-neutral-200 border-l-science-red bg-panel px-4 py-4">
                        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-science-red">
                          <MessageSquare className="size-3.5" />
                          관리자 답변
                          {post.repliedAt && (
                            <span className="font-semibold normal-case text-neutral-400">
                              · {formatPostDate(post.repliedAt)}
                            </span>
                          )}
                        </p>
                        <RichView
                          html={post.reply}
                          className="mt-2 text-foreground"
                        />
                        <AttachmentGallery
                          images={post.replyImages}
                          onOpen={(src) => setLightbox(src)}
                        />
                      </div>
                    )}

                    {replying && (
                      <div className="mt-4 flex flex-col gap-3 rounded-md border border-l-4 border-neutral-200 border-l-science-red bg-panel px-4 py-4">
                        <span className={LABEL}>관리자 답변</span>
                        <RichField
                          html={replyDraft}
                          onChange={setReplyDraft}
                          placeholder="답변을 입력하세요"
                        />
                        <ImageAttach
                          images={replyImages}
                          onChange={setReplyImages}
                          disabled={busy}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <PillButton
                            onClick={() => saveReply(post.id)}
                            disabled={busy}
                            tone="primary"
                          >
                            <Check className="size-4" />
                            {busy ? '저장 중…' : '답변 저장'}
                          </PillButton>
                          <PillButton onClick={() => setReplyingId(null)} disabled={busy}>
                            <X className="size-4" />
                          </PillButton>
                          {post.reply && (
                            <span className="text-[12px] text-neutral-500">
                              비우고 저장하면 답변이 삭제됩니다.
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* What this reader may do with the post */}
                    {!editing && (
                      <div className="mt-5 flex flex-wrap items-center gap-2">
                        {isAdmin && isPrivate && !replying && (
                          <PillButton
                            onClick={() => {
                              setReplyingId(post.id)
                              setReplyDraft(post.reply ?? '')
                              setReplyImages(post.replyImages)
                            }}
                          >
                            <MessageSquare className="size-4" />
                            {post.reply ? '답변 수정' : '답변하기'}
                          </PillButton>
                        )}
                        {post.mine && (
                          <PillButton
                            onClick={() => {
                              setEditingId(post.id)
                              setEditDraft({
                                title: post.title,
                                body: post.body,
                                images: post.images,
                              })
                            }}
                          >
                            <Pencil className="size-4" />
                            수정
                          </PillButton>
                        )}
                        {(post.mine || isAdmin) && (
                          <PillButton
                            onClick={() => confirmRemove(post.id)}
                            disabled={busy}
                            tone="danger"
                          >
                            <Trash2 className="size-4" />
                            {busy ? '삭제 중…' : '삭제'}
                          </PillButton>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
        <Pager page={page} pageCount={pageCount} onChange={goToPage} />
        </>
      )}

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}

function PillButton({
  children,
  onClick,
  disabled,
  tone = 'default',
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  tone?: 'default' | 'primary' | 'danger'
}) {
  const tones = {
    default:
      'border-neutral-300 text-neutral-600 hover:border-foreground hover:text-foreground',
    primary: 'border-foreground bg-foreground text-background hover:opacity-90',
    danger: 'border-science-red bg-science-red text-white hover:opacity-90',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 items-center gap-1.5 rounded-md border px-4 text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 ${tones[tone]}`}
    >
      {children}
    </button>
  )
}

// Page controls under the list. Hidden when everything fits one page. Every
// page number is shown — a class board runs to a handful of pages, not the
// hundreds that would need an ellipsis.
function Pager({
  page,
  pageCount,
  onChange,
}: {
  page: number
  pageCount: number
  onChange: (page: number) => void
}) {
  if (pageCount <= 1) return null

  const arrow =
    'flex size-9 items-center justify-center rounded-md border border-neutral-300 text-neutral-600 transition-colors hover:border-foreground hover:text-foreground disabled:opacity-40 disabled:hover:border-neutral-300 disabled:hover:text-neutral-600'

  return (
    <nav
      aria-label="페이지"
      className="mt-8 flex flex-wrap items-center justify-center gap-1.5"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="이전 페이지"
        className={arrow}
      >
        <ChevronLeft className="size-4" />
      </button>
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => {
        const on = n === page
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-current={on ? 'page' : undefined}
            className={`size-9 rounded-md text-[13px] font-bold transition-colors ${
              on
                ? 'bg-foreground text-background'
                : 'border border-neutral-300 text-neutral-600 hover:border-foreground hover:text-foreground'
            }`}
          >
            {n}
          </button>
        )
      })}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === pageCount}
        aria-label="다음 페이지"
        className={arrow}
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  )
}

// A post's reply state, shown on private-board rows: a filled chip once the
// administrator has answered, an outlined one with a live dot while it waits.
function StatusBadge({ answered }: { answered: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        answered
          ? 'bg-foreground text-background'
          : 'border border-neutral-300 text-neutral-500'
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${answered ? 'bg-background' : 'bg-science-red'}`}
      />
      {answered ? '답변 완료' : '답변 대기'}
    </span>
  )
}

// ---------------------------------------------------------------------------
// The formatting the body editor offers, matching an article Overview: bold,
// italic, underline, and super/subscript for ions and formulae (Na⁺, CO₂).
const TOOLS = [
  { cmd: 'bold', title: '굵게', icon: Bold },
  { cmd: 'italic', title: '기울임', icon: Italic },
  { cmd: 'underline', title: '밑줄', icon: Underline },
  { cmd: 'superscript', title: '위 첨자', icon: Superscript },
  { cmd: 'subscript', title: '아래 첨자', icon: Subscript },
] as const

// A rich-text body field. The DOM is seeded once, when the field mounts; after
// that keystrokes flow one way (DOM → draft), the same as the Overview editor.
// Writing the value back on every keystroke would reset the node and throw the
// caret to the start.
function RichField({
  html,
  onChange,
  placeholder,
}: {
  html: string
  onChange: (html: string) => void
  placeholder?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const seeded = useRef(false)

  useEffect(() => {
    if (ref.current && !seeded.current) {
      ref.current.innerHTML = sanitizeRich(html || '')
      seeded.current = true
    }
  }, [html])

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-1">
        {TOOLS.map(({ cmd, title, icon: Icon }) => (
          <button
            key={cmd}
            type="button"
            title={title}
            aria-label={title}
            // Keep the caret in the body — a focus change would collapse the
            // selection before execCommand runs.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => document.execCommand(cmd, false)}
            className="flex size-8 items-center justify-center rounded border border-neutral-300 bg-background text-neutral-600 transition-colors hover:border-foreground hover:text-foreground"
          >
            <Icon className="size-[14px]" />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={(e) => onChange(toStoredHtml(e.currentTarget.innerHTML))}
        onPaste={(e) => {
          // Paste as plain text so pasted markup can't leak into the post.
          e.preventDefault()
          document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
        }}
        className={`${FIELD} min-h-[8rem] cursor-text break-words leading-relaxed [&_sub]:align-sub [&_sup]:align-super empty:before:text-neutral-400 empty:before:content-[attr(data-placeholder)]`}
      />
    </div>
  )
}

// Renders a stored body/reply. Always through sanitizeRich, never raw, so a
// row that somehow held more than the editor allows still cannot inject markup.
function RichView({ html, className = '' }: { html: string; className?: string }) {
  return (
    <div
      className={`break-words text-[15px] leading-relaxed text-neutral-700 [&_sub]:align-sub [&_sup]:align-super ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeRich(html) }}
    />
  )
}

// ---------------------------------------------------------------------------
// Attach images to a post. Each pick is uploaded once, straight to storage, and
// only its URL travels with the post — the same flow the figure gallery uses.
function ImageAttach({
  images,
  onChange,
  disabled,
}: {
  images: string[]
  onChange: (images: string[]) => void
  disabled?: boolean
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const full = images.length >= MAX_IMAGES

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (e.target) e.target.value = ''
    if (!files.length) return
    setError('')
    setBusy(true)
    try {
      const room = MAX_IMAGES - images.length
      const added: string[] = []
      for (const file of files.slice(0, room)) {
        added.push(await uploadFile(file))
      }
      onChange([...images, ...added])
      if (files.length > room) {
        setError(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className={LABEL}>이미지 첨부</span>
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((src, i) => (
            <div
              key={src}
              className="group relative aspect-square overflow-hidden rounded border border-neutral-200 bg-panel"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`첨부 ${i + 1}`} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(images.filter((_, j) => j !== i))}
                aria-label="이미지 삭제"
                className="absolute right-1 top-1 inline-flex size-6 items-center justify-center rounded-full bg-background/90 text-neutral-600 shadow-sm transition-colors hover:text-science-red"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onPick}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={disabled || busy || full}
        className="inline-flex w-fit items-center gap-1.5 rounded-md border border-neutral-300 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-600 transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
      >
        <ImagePlus className="size-4" />
        {busy ? '올리는 중…' : full ? `최대 ${MAX_IMAGES}장` : '이미지 추가'}
      </button>
      {error && <p className="text-[13px] text-science-red">{error}</p>}
    </div>
  )
}

// A post's attached images, shown under its body. A tap opens one full size.
function AttachmentGallery({
  images,
  onOpen,
}: {
  images: string[]
  onOpen: (src: string) => void
}) {
  if (!images?.length) return null
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={`첨부 이미지 ${i + 1}`}
          onClick={() => onOpen(src)}
          className="h-40 w-full cursor-zoom-in rounded border border-neutral-200 bg-panel object-contain p-1 transition-transform duration-300 hover:scale-[1.02]"
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Full-screen image zoom, closed by the backdrop, the button, or Escape.
function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-4 top-4 inline-flex items-center gap-1 rounded bg-white/90 px-3 py-1.5 text-[12px] font-bold text-foreground transition-colors hover:bg-white"
      >
        <X className="size-[15px]" />
        닫기 (Esc)
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="확대 이미지"
        className="max-h-full max-w-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
