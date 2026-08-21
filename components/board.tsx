'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Check,
  Lock,
  MessageSquare,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { useAuth } from './auth-provider'
import { CategoryLabel } from './article-bits'
import { LoginDialog } from './login-dialog'
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

type Draft = { title: string; body: string }

const EMPTY: Draft = { title: '', body: '' }

function isCategory(value: string | null): value is BoardCategory {
  return value !== null && (BOARD_CATEGORIES as readonly string[]).includes(value)
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
  const [confirmId, setConfirmId] = useState<string | null>(null)

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
    setConfirmId(null)
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
      const post = await updatePost(id, editDraft)
      setPosts((prev) => prev.map((p) => (p.id === id ? post : p)))
      setEditingId(null)
    })

  const saveReply = (id: string) =>
    run(async () => {
      const post = await updatePost(id, { reply: replyDraft })
      setPosts((prev) => prev.map((p) => (p.id === id ? post : p)))
      setReplyingId(null)
    })

  const remove = (id: string) =>
    run(async () => {
      await deletePost(id)
      setPosts((prev) => prev.filter((p) => p.id !== id))
      setConfirmId(null)
    })

  const unanswered = useMemo(
    () => posts.filter((p) => !p.reply).length,
    [posts],
  )

  if (!ready) return <div className="h-64" />

  return (
    <>
      {/* Masthead */}
      <header className="border-b border-neutral-200 pb-6">
        <CategoryLabel>{board.kicker}</CategoryLabel>
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
              className={`flex h-10 items-center gap-1.5 rounded-full border px-4 text-[12px] font-bold uppercase tracking-wider transition-colors ${
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
            className="ml-auto flex h-10 items-center gap-2 rounded-full bg-science-red px-5 text-[11px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            {board.action}
          </button>
        )}
      </div>

      {/* What the administrator is looking at, when it is a private board */}
      {isAdmin && isPrivate && !loading && posts.length > 0 && (
        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden bg-neutral-200">
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
        <section className="mt-6 border border-neutral-300">
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
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>내용</span>
              <textarea
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                rows={8}
                className={`${FIELD} resize-y leading-relaxed`}
              />
            </label>
            {isPrivate && (
              <p className="text-[13px] leading-relaxed text-neutral-500">
                작성한 글은 관리자와 본인에게만 보입니다.
              </p>
            )}
          </div>
          <footer className="flex flex-wrap items-center gap-2 border-t border-neutral-200 bg-panel/60 px-5 py-4">
            <PillButton
              onClick={submitPost}
              disabled={busy || !draft.title.trim() || !draft.body.trim()}
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
        <div className="mx-auto max-w-[520px] py-16 text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-panel">
            <Lock className="size-6 text-science-red" />
          </span>
          <h2 className="mt-5 text-2xl font-extrabold leading-tight">
            로그인이 필요합니다
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
            {board.name}은(는) 관리자와 글쓴이 본인만 볼 수 있습니다. 로그인하면
            직접 남긴 글과 답변을 확인할 수 있습니다.
          </p>
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="mt-7 h-11 rounded-full bg-science-red px-6 text-[12px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
          >
            Sign in
          </button>
        </div>
      ) : loading ? (
        <div className="mt-6 flex flex-col gap-px bg-neutral-200">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-background px-1 py-5">
              <div className="h-4 w-2/3 animate-pulse rounded bg-panel" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[15px] font-semibold text-foreground">
            {tab === 'notice' ? '등록된 공지가 없습니다.' : '아직 남긴 글이 없습니다.'}
          </p>
          <p className="mt-1 text-[14px] text-neutral-500">
            {mayWrite
              ? `위의 ${board.action} 버튼으로 첫 글을 남겨 보세요.`
              : '새 공지가 올라오면 이곳에 표시됩니다.'}
          </p>
        </div>
      ) : (
        <ul className="mt-2">
          {posts.map((post) => {
            const open = openId === post.id
            const editing = editingId === post.id
            const replying = replyingId === post.id

            return (
              <li key={post.id} className="border-b border-neutral-200">
                {/* The row itself */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(open ? null : post.id)
                    setEditingId(null)
                    setReplyingId(null)
                    setConfirmId(null)
                  }}
                  aria-expanded={open}
                  className="flex w-full items-baseline gap-3 py-4 text-left transition-colors hover:text-science-red"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-bold leading-snug text-foreground transition-colors hover:text-science-red">
                      {post.title}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
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
                      {isPrivate && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            post.reply
                              ? 'bg-foreground text-background'
                              : 'bg-panel text-neutral-500'
                          }`}
                        >
                          {post.reply ? '답변 완료' : '답변 대기'}
                        </span>
                      )}
                    </span>
                  </span>
                </button>

                {/* Its body */}
                {open && (
                  <div className="pb-6">
                    {editing ? (
                      <div className="flex flex-col gap-3 border-l-4 border-foreground bg-panel/40 px-4 py-4">
                        <input
                          value={editDraft.title}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, title: e.target.value })
                          }
                          maxLength={200}
                          className={FIELD}
                        />
                        <textarea
                          value={editDraft.body}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, body: e.target.value })
                          }
                          rows={7}
                          className={`${FIELD} resize-y leading-relaxed`}
                        />
                        <div className="flex items-center gap-2">
                          <PillButton
                            onClick={() => saveEdit(post.id)}
                            disabled={
                              busy || !editDraft.title.trim() || !editDraft.body.trim()
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
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-700">
                        {post.body}
                      </p>
                    )}

                    {/* The administrator's answer */}
                    {post.reply && !replying && (
                      <div className="mt-5 border-l-4 border-science-red bg-panel px-4 py-4">
                        <p className={LABEL}>
                          관리자 답변
                          {post.repliedAt && ` · ${formatPostDate(post.repliedAt)}`}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
                          {post.reply}
                        </p>
                      </div>
                    )}

                    {replying && (
                      <div className="mt-5 flex flex-col gap-3 border-l-4 border-science-red bg-panel px-4 py-4">
                        <span className={LABEL}>관리자 답변</span>
                        <textarea
                          autoFocus
                          value={replyDraft}
                          onChange={(e) => setReplyDraft(e.target.value)}
                          rows={5}
                          className={`${FIELD} resize-y leading-relaxed`}
                        />
                        <div className="flex items-center gap-2">
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
                              setEditDraft({ title: post.title, body: post.body })
                            }}
                          >
                            <Pencil className="size-4" />
                            수정
                          </PillButton>
                        )}
                        {(post.mine || isAdmin) &&
                          (confirmId === post.id ? (
                            <>
                              <PillButton
                                onClick={() => remove(post.id)}
                                disabled={busy}
                                tone="danger"
                              >
                                <Trash2 className="size-4" />
                                {busy ? '삭제 중…' : '삭제 확인'}
                              </PillButton>
                              <PillButton
                                onClick={() => setConfirmId(null)}
                                disabled={busy}
                              >
                                <X className="size-4" />
                              </PillButton>
                            </>
                          ) : (
                            <PillButton onClick={() => setConfirmId(post.id)}>
                              <Trash2 className="size-4" />
                              삭제
                            </PillButton>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

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
      className={`flex h-9 items-center gap-1.5 rounded-full border px-4 text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 ${tones[tone]}`}
    >
      {children}
    </button>
  )
}
