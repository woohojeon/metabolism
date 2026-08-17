'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Check,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Lock,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useAuth } from './auth-provider'
import { CategoryLabel } from './article-bits'
import { LoginDialog } from './login-dialog'
import { readRosterFile, type RosterRow } from '@/lib/roster-file'
import {
  ADMIN_USERNAME,
  createStudent,
  createStudents,
  deleteStudent,
  deleteStudents,
  listStudents,
  updateStudent,
  type Student,
} from '@/lib/students'

const FIELD =
  'h-9 w-full rounded-md border border-neutral-300 bg-background px-2.5 text-[14px] outline-none transition-colors focus:border-foreground disabled:bg-panel disabled:text-neutral-400'

const LABEL = 'text-[11px] font-bold uppercase tracking-wider text-neutral-500'

type Draft = { name: string; username: string; password: string }

const EMPTY: Draft = { name: '', username: '', password: '' }

/** A roster that has been read but not yet written to the table. */
type Preview = {
  filename: string
  rows: RosterRow[]
  /** Rows the file held that had no usable 학번 or 성명. */
  skipped: number
  /** 학번 that appeared twice in the file itself. */
  duplicates: string[]
}

export function AdminStudents() {
  const { user, isAdmin, ready, logout } = useAuth()

  const [rows, setRows] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [reveal, setReveal] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [adding, setAdding] = useState(false)
  const [newDraft, setNewDraft] = useState<Draft>(EMPTY)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [preview, setPreview] = useState<Preview | null>(null)
  const [reading, setReading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [anchor, setAnchor] = useState<string | null>(null)
  const [confirmBulk, setConfirmBulk] = useState(false)
  const [dragging, setDragging] = useState(false)
  // Where the drag under way began, whether it is selecting or clearing, and
  // what was selected before it started. Held in a ref so that dragging over a
  // hundred rows does not re-render for the bookkeeping itself.
  const drag = useRef<{ index: number; mode: boolean; base: Set<string> } | null>(null)

  // `silent` re-reads the roster after an edit without flashing the skeleton
  // rows, so saving a single field does not blank the whole table.
  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      setRows(await listStudents())
    } catch (e) {
      setError(e instanceof Error ? e.message : '명단을 불러오지 못했습니다.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (ready && isAdmin) void refresh()
    else if (ready) setLoading(false)
  }, [ready, isAdmin, refresh])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.username.toLowerCase().includes(q),
    )
  }, [rows, query])

  const studentCount = rows.filter((r) => r.username !== ADMIN_USERNAME).length

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError('')
    // Cleared before the action, so an import's own summary still survives.
    setNotice('')
    try {
      await action()
      await refresh(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : '요청이 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const startEdit = (row: Student) => {
    setEditingId(row.id)
    setDraft({ name: row.name, username: row.username, password: row.password })
    setConfirmId(null)
    setError('')
  }

  const saveEdit = (row: Student) =>
    run(async () => {
      await updateStudent(row.id, draft)
      setEditingId(null)
    })

  const addRow = () =>
    run(async () => {
      await createStudent(newDraft)
      setNewDraft(EMPTY)
      setAdding(false)
    })

  // --------------------------------------------------------------- selection

  // The administrator cannot be deleted, so it is never part of a selection —
  // including a select-all, which would otherwise arm a button that then had
  // to refuse half of what it was asked to do.
  const selectable = useMemo(
    () => shown.filter((r) => r.username !== ADMIN_USERNAME),
    [shown],
  )

  const allSelected =
    selectable.length > 0 && selectable.every((r) => selected.has(r.id))

  // A row deleted elsewhere must not linger in the selection and re-arm the
  // delete button, so the set is pruned whenever the roster is re-read.
  useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) return prev
      const live = new Set(rows.map((r) => r.id))
      const next = new Set<string>()
      prev.forEach((id) => live.has(id) && next.add(id))
      return next.size === prev.size ? prev : next
    })
  }, [rows])

  // A drag can end anywhere — over another row, off the table, outside the
  // window — so the release is listened for on the window rather than a row.
  useEffect(() => {
    if (!dragging) return
    const stop = () => {
      drag.current = null
      setDragging(false)
    }
    window.addEventListener('mouseup', stop)
    return () => window.removeEventListener('mouseup', stop)
  }, [dragging])

  const setOne = useCallback((id: string, on: boolean) => {
    setSelected((prev) => {
      if (prev.has(id) === on) return prev
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  /** Shift-click: everything between the last row clicked and this one. */
  const setRange = (toId: string, on: boolean) => {
    const from = selectable.findIndex((r) => r.id === anchor)
    const to = selectable.findIndex((r) => r.id === toId)
    if (from < 0 || to < 0) return setOne(toId, on)

    const [lo, hi] = from < to ? [from, to] : [to, from]
    setSelected((prev) => {
      const next = new Set(prev)
      for (let i = lo; i <= hi; i++) {
        if (on) next.add(selectable[i].id)
        else next.delete(selectable[i].id)
      }
      return next
    })
  }

  function onRowMouseDown(e: React.MouseEvent, row: Student) {
    if (e.button !== 0 || row.username === ADMIN_USERNAME) return
    // Stops the browser from painting a text selection across the rows the
    // pointer is about to be dragged over.
    e.preventDefault()

    const on = !selected.has(row.id)
    if (e.shiftKey && anchor) {
      setRange(row.id, on)
    } else {
      setOne(row.id, on)
      setAnchor(row.id)
    }

    drag.current = {
      index: selectable.findIndex((r) => r.id === row.id),
      mode: on,
      base: new Set(selected),
    }
    setDragging(true)
    setConfirmBulk(false)
  }

  /**
   * Paints every row between where the drag began and the row now under the
   * pointer.
   *
   * Deliberately not "toggle the row we just entered": a pointer moved quickly
   * jumps several rows between two mouse events, and the rows it flew over
   * never report being entered. Filling the range from the start of the drag
   * covers them anyway, and lets a drag that doubles back shrink again, since
   * the selection is rebuilt each time from what was there before.
   */
  function onRowMouseEnter(row: Student) {
    const from = drag.current
    if (!dragging || !from || row.username === ADMIN_USERNAME) return

    const to = selectable.findIndex((r) => r.id === row.id)
    if (to < 0 || from.index < 0) return

    const [lo, hi] = from.index < to ? [from.index, to] : [to, from.index]
    const next = new Set(from.base)
    for (let i = lo; i <= hi; i++) {
      if (from.mode) next.add(selectable[i].id)
      else next.delete(selectable[i].id)
    }
    setSelected(next)
  }

  const toggleAll = () => {
    setConfirmBulk(false)
    setSelected((prev) => {
      const next = new Set(prev)
      // Only the rows currently in view are affected, so a search narrows what
      // select-all means rather than reaching rows the admin cannot see.
      selectable.forEach((r) => (allSelected ? next.delete(r.id) : next.add(r.id)))
      return next
    })
  }

  const deleteSelected = () =>
    run(async () => {
      const result = await deleteStudents([...selected])
      setSelected(new Set())
      setAnchor(null)
      setConfirmBulk(false)
      setNotice(
        `${result.deleted}명을 삭제했습니다.` +
          (result.keptAdmin ? ' 관리자 계정은 그대로 두었습니다.' : ''),
      )
    })

  // ------------------------------------------------------------ roster import

  const taken = useMemo(() => new Set(rows.map((r) => r.username)), [rows])

  // Only the students not already on the roster are written, so re-uploading a
  // revised list after add/drop adds the newcomers and touches nobody else.
  const incoming = useMemo(
    () => (preview ? preview.rows.filter((r) => !taken.has(r.studentId)) : []),
    [preview, taken],
  )

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Clear the input so choosing the same file twice still fires a change.
    e.target.value = ''
    if (!file) return

    setReading(true)
    setError('')
    setNotice('')
    setPreview(null)
    try {
      const parsed = await readRosterFile(file)
      setPreview({ filename: file.name, ...parsed })
      setAdding(false)
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '파일을 읽지 못했습니다.')
    } finally {
      setReading(false)
    }
  }

  const importRoster = () =>
    run(async () => {
      // 학번 is both the username and the password, as asked.
      const result = await createStudents(
        incoming.map((r) => ({
          name: r.name,
          username: r.studentId,
          password: r.studentId,
        })),
      )
      setPreview(null)
      setNotice(
        `${result.added}명을 등록했습니다.` +
          (result.skipped.length
            ? ` ${result.skipped.length}명은 이미 등록되어 있어 건너뛰었습니다.`
            : ''),
      )
    })

  // ------------------------------------------------------------------- gating

  if (!ready) {
    return <div className="h-64" />
  }

  if (!isAdmin) {
    return (
      <>
        <div className="mx-auto max-w-[520px] py-16 text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-panel">
            <Lock className="size-6 text-science-red" />
          </span>
          <h1 className="mt-5 text-3xl font-extrabold leading-tight">
            Administrator only
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
            이 페이지는 관리자 계정
            <code className="mx-1 rounded bg-panel px-1.5 py-0.5 font-mono text-[13px] text-foreground">
              {ADMIN_USERNAME}
            </code>
            으로 로그인해야 열 수 있습니다.
            {user && (
              <>
                {' '}
                현재
                <code className="mx-1 rounded bg-panel px-1.5 py-0.5 font-mono text-[13px] text-foreground">
                  {user}
                </code>
                (으)로 로그인되어 있습니다.
              </>
            )}
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            {user ? (
              <button
                type="button"
                onClick={logout}
                className="h-11 rounded-full bg-science-red px-6 text-[12px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
              >
                Switch account
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="h-11 rounded-full bg-science-red px-6 text-[12px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
              >
                Sign in
              </button>
            )}
            <Link
              href="/"
              className="h-11 rounded-full border border-neutral-300 px-6 text-[12px] font-bold uppercase leading-[2.75rem] tracking-wider text-neutral-600 transition-colors hover:border-foreground hover:text-foreground"
            >
              Back home
            </Link>
          </div>
        </div>
        <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
      </>
    )
  }

  // --------------------------------------------------------------------- page

  return (
    <>
      {/* Masthead */}
      <header className="border-b border-neutral-200 pb-7">
        <CategoryLabel>Administration</CategoryLabel>
        <h1 className="mt-1 text-4xl font-extrabold leading-tight sm:text-5xl">
          Student Accounts
        </h1>

        {/* Counts */}
        <dl className="mt-7 grid grid-cols-2 gap-px overflow-hidden bg-neutral-200 sm:grid-cols-3">
          {[
            { label: 'Total accounts', value: rows.length, mono: false },
            { label: 'Students', value: studentCount, mono: false },
            { label: 'Administrator', value: ADMIN_USERNAME, mono: true },
          ].map((s) => (
            <div key={s.label} className="bg-panel px-5 py-4">
              <dt className={LABEL}>{s.label}</dt>
              <dd
                className={`mt-1 text-2xl font-extrabold text-foreground ${s.mono ? 'font-mono text-xl' : ''}`}
              >
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      {/* Toolbar */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름 또는 아이디 검색"
            aria-label="Search accounts"
            className="h-11 w-full rounded-full border border-neutral-300 pl-10 pr-4 text-[15px] outline-none transition-colors focus:border-foreground"
          />
        </div>

        <button
          type="button"
          onClick={() => setReveal((v) => !v)}
          aria-pressed={reveal}
          className="flex h-11 items-center gap-2 rounded-full border border-neutral-300 px-4 text-[11px] font-bold uppercase tracking-wider text-neutral-600 transition-colors hover:border-foreground hover:text-foreground"
        >
          {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          {reveal ? 'Hide passwords' : 'Show passwords'}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          onChange={onPickFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={reading || busy}
          className="flex h-11 items-center gap-2 rounded-full border border-neutral-300 px-4 text-[11px] font-bold uppercase tracking-wider text-neutral-600 transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
        >
          <Upload className="size-4" />
          {reading ? '읽는 중…' : '엑셀 명단 업로드'}
        </button>

        <button
          type="button"
          onClick={() => {
            setAdding(true)
            setEditingId(null)
            setNewDraft(EMPTY)
          }}
          className="flex h-11 items-center gap-2 rounded-full bg-science-red px-5 text-[11px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          Add account
        </button>
      </div>

      {notice && (
        <div className="mt-5 border-l-4 border-foreground bg-panel px-4 py-3">
          <p className="text-[14px] font-medium text-foreground">{notice}</p>
        </div>
      )}

      {error && (
        <div className="mt-5 border-l-4 border-science-red bg-panel px-4 py-3">
          <p className="text-[14px] font-medium text-foreground">{error}</p>
          {error.includes('관리자 권한') && (
            <button
              type="button"
              onClick={logout}
              className="mt-1 text-[11px] font-bold uppercase tracking-wider text-science-red hover:text-foreground"
            >
              다시 로그인 →
            </button>
          )}
        </div>
      )}

      {/* What the uploaded file holds, before anything is written */}
      {preview && (
        <section className="mt-6 border border-neutral-300">
          <header className="flex items-start gap-3 border-b border-neutral-200 bg-panel/60 px-5 py-4">
            <FileSpreadsheet className="mt-0.5 size-5 shrink-0 text-science-red" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-foreground">
                {preview.filename}
              </p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-neutral-600">
                학번을 아이디와 비밀번호로, 성명을 이름으로 등록합니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPreview(null)}
              aria-label="가져오기 취소"
              className="shrink-0 text-neutral-400 transition-colors hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </header>

          <dl className="grid grid-cols-3 gap-px bg-neutral-200">
            {[
              { label: 'In file', value: preview.rows.length },
              { label: 'To add', value: incoming.length },
              { label: 'Already listed', value: preview.rows.length - incoming.length },
            ].map((s) => (
              <div key={s.label} className="bg-background px-5 py-3">
                <dt className={LABEL}>{s.label}</dt>
                <dd className="mt-0.5 text-xl font-extrabold text-foreground">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>

          {(preview.skipped > 0 || preview.duplicates.length > 0) && (
            <p className="border-t border-neutral-200 bg-panel px-5 py-2.5 text-[13px] text-neutral-600">
              {preview.skipped > 0 && `학번이나 이름이 빈 줄 ${preview.skipped}개는 건너뜁니다. `}
              {preview.duplicates.length > 0 &&
                `파일 안에서 중복된 학번 ${preview.duplicates.length}개는 한 번만 등록합니다.`}
            </p>
          )}

          <div className="max-h-[320px] overflow-y-auto border-t border-neutral-200">
            {incoming.length === 0 ? (
              <p className="px-5 py-10 text-center text-[14px] text-neutral-500">
                이 파일의 학생은 모두 이미 등록되어 있습니다.
              </p>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b border-neutral-200">
                    <th className={`w-12 px-5 py-2 ${LABEL}`}>#</th>
                    <th className={`py-2 pr-3 ${LABEL}`}>Name</th>
                    <th className={`py-2 pr-5 ${LABEL}`}>ID / Password</th>
                  </tr>
                </thead>
                <tbody>
                  {incoming.map((r, i) => (
                    <tr key={r.studentId} className="border-b border-neutral-100">
                      <td className="px-5 py-2 text-[13px] font-semibold text-neutral-400">
                        {i + 1}
                      </td>
                      <td className="py-2 pr-3 text-[14px] font-semibold text-foreground">
                        {r.name}
                      </td>
                      <td className="py-2 pr-5 font-mono text-[13px] text-neutral-700">
                        {r.studentId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <footer className="flex flex-wrap items-center gap-2 border-t border-neutral-200 bg-panel/60 px-5 py-4">
            <button
              type="button"
              onClick={importRoster}
              disabled={busy || incoming.length === 0}
              className="flex h-10 items-center gap-2 rounded-full bg-science-red px-5 text-[11px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Check className="size-4" />
              {busy ? '등록 중…' : `${incoming.length}명 등록`}
            </button>
            <button
              type="button"
              onClick={() => setPreview(null)}
              disabled={busy}
              className="flex h-10 items-center rounded-full border border-neutral-300 px-5 text-[11px] font-bold uppercase tracking-wider text-neutral-600 transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
            >
              취소
            </button>
          </footer>
        </section>
      )}

      {/* What is selected, and what can be done with it */}
      {selected.size > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-3 border-l-4 border-foreground bg-panel px-4 py-3">
          <p className="text-[14px] font-bold text-foreground">
            {selected.size}명 선택됨
          </p>
          <div className="ml-auto flex items-center gap-2">
            {confirmBulk ? (
              <>
                <RowButton onClick={deleteSelected} disabled={busy} tone="danger">
                  <Trash2 className="size-4" />
                  {busy ? '삭제 중…' : `${selected.size}명 삭제 확인`}
                </RowButton>
                <RowButton onClick={() => setConfirmBulk(false)} disabled={busy}>
                  <X className="size-4" />
                </RowButton>
              </>
            ) : (
              <>
                <RowButton onClick={() => setConfirmBulk(true)} disabled={busy}>
                  <Trash2 className="size-4" />
                  선택 삭제
                </RowButton>
                <RowButton
                  onClick={() => {
                    setSelected(new Set())
                    setAnchor(null)
                  }}
                  disabled={busy}
                >
                  선택 해제
                </RowButton>
              </>
            )}
          </div>
        </div>
      )}

      {/* Roster */}
      <div
        className={`mt-6 overflow-x-auto ${dragging ? 'select-none' : ''}`}
      >
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-foreground">
              <th className="w-9 pb-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  // Some but not all — shown as a dash rather than a tick, so
                  // the header does not claim the whole page is selected.
                  ref={(el) => {
                    if (el) {
                      el.indeterminate = !allSelected && selectable.some((r) => selected.has(r.id))
                    }
                  }}
                  onChange={toggleAll}
                  disabled={selectable.length === 0}
                  aria-label="전체 선택"
                  title="전체 선택"
                  className="size-4 cursor-pointer accent-science-red align-middle disabled:cursor-default disabled:opacity-40"
                />
              </th>
              <th className={`w-10 pb-2 pr-3 ${LABEL}`}>#</th>
              <th className={`pb-2 pr-3 ${LABEL}`}>Name</th>
              <th className={`pb-2 pr-3 ${LABEL}`}>ID</th>
              <th className={`pb-2 pr-3 ${LABEL}`}>Password</th>
              <th className={`w-[140px] pb-2 text-right ${LABEL}`}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {/* New account */}
            {adding && (
              <tr className="border-b border-neutral-200 bg-panel/60">
                <td />
                <td className="py-3 pr-3 text-[13px] font-bold text-science-red">
                  New
                </td>
                <td className="py-3 pr-3">
                  <input
                    autoFocus
                    value={newDraft.name}
                    onChange={(e) =>
                      setNewDraft({ ...newDraft, name: e.target.value })
                    }
                    placeholder="이름"
                    className={FIELD}
                  />
                </td>
                <td className="py-3 pr-3">
                  <input
                    value={newDraft.username}
                    onChange={(e) =>
                      setNewDraft({ ...newDraft, username: e.target.value })
                    }
                    placeholder="아이디"
                    className={`${FIELD} font-mono`}
                  />
                </td>
                <td className="py-3 pr-3">
                  <input
                    value={newDraft.password}
                    onChange={(e) =>
                      setNewDraft({ ...newDraft, password: e.target.value })
                    }
                    placeholder="비밀번호"
                    className={`${FIELD} font-mono`}
                  />
                </td>
                <td className="py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <RowButton onClick={addRow} disabled={busy} tone="primary">
                      <Check className="size-4" />
                      Save
                    </RowButton>
                    <RowButton
                      onClick={() => {
                        setAdding(false)
                        setNewDraft(EMPTY)
                      }}
                      disabled={busy}
                    >
                      <X className="size-4" />
                    </RowButton>
                  </div>
                </td>
              </tr>
            )}

            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-neutral-200">
                  <td colSpan={6} className="py-4">
                    <div className="h-4 w-full animate-pulse rounded bg-panel" />
                  </td>
                </tr>
              ))}

            {!loading &&
              shown.map((row, i) => {
                const isTheAdmin = row.username === ADMIN_USERNAME
                const editing = editingId === row.id

                const picked = selected.has(row.id)

                return (
                  <tr
                    key={row.id}
                    onMouseEnter={() => onRowMouseEnter(row)}
                    className={`border-b border-neutral-200 align-middle transition-colors ${
                      picked ? 'bg-panel' : 'hover:bg-panel/50'
                    }`}
                  >
                    <td
                      onMouseDown={(e) => onRowMouseDown(e, row)}
                      className={isTheAdmin ? '' : 'cursor-pointer'}
                    >
                      <input
                        type="checkbox"
                        checked={picked}
                        disabled={isTheAdmin}
                        aria-label={`${row.name} 선택`}
                        title={
                          isTheAdmin ? '관리자 계정은 삭제할 수 없습니다.' : undefined
                        }
                        // The row's own mousedown drives the box, so that a
                        // drag and a plain click cannot both toggle it. Only a
                        // keyboard press (which arrives with no click count)
                        // is handled here.
                        onChange={() => {}}
                        onClick={(e) => {
                          e.preventDefault()
                          if (e.detail === 0) setOne(row.id, !picked)
                        }}
                        className="size-4 cursor-pointer accent-science-red align-middle disabled:cursor-default disabled:opacity-30"
                      />
                    </td>

                    <td className="py-3 pr-3 text-[13px] font-semibold text-neutral-400">
                      {i + 1}
                    </td>

                    <td className="py-3 pr-3">
                      {editing ? (
                        <input
                          autoFocus
                          value={draft.name}
                          onChange={(e) =>
                            setDraft({ ...draft, name: e.target.value })
                          }
                          className={FIELD}
                        />
                      ) : (
                        <span className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
                          {row.name}
                          {isTheAdmin && (
                            <span className="rounded-full bg-science-red px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                              Admin
                            </span>
                          )}
                        </span>
                      )}
                    </td>

                    <td className="py-3 pr-3">
                      {editing ? (
                        <input
                          value={draft.username}
                          disabled={isTheAdmin}
                          title={
                            isTheAdmin
                              ? '관리자 아이디는 변경할 수 없습니다.'
                              : undefined
                          }
                          onChange={(e) =>
                            setDraft({ ...draft, username: e.target.value })
                          }
                          className={`${FIELD} font-mono`}
                        />
                      ) : (
                        <span className="font-mono text-[14px] text-neutral-700">
                          {row.username}
                        </span>
                      )}
                    </td>

                    <td className="py-3 pr-3">
                      {editing ? (
                        <input
                          value={draft.password}
                          onChange={(e) =>
                            setDraft({ ...draft, password: e.target.value })
                          }
                          className={`${FIELD} font-mono`}
                        />
                      ) : (
                        <span className="font-mono text-[14px] text-neutral-700">
                          {reveal ? row.password : '••••••••'}
                        </span>
                      )}
                    </td>

                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {editing ? (
                          <>
                            <RowButton
                              onClick={() => saveEdit(row)}
                              disabled={busy}
                              tone="primary"
                            >
                              <Check className="size-4" />
                              Save
                            </RowButton>
                            <RowButton
                              onClick={() => setEditingId(null)}
                              disabled={busy}
                            >
                              <X className="size-4" />
                            </RowButton>
                          </>
                        ) : confirmId === row.id ? (
                          <>
                            <RowButton
                              onClick={() =>
                                run(async () => {
                                  await deleteStudent(row.id)
                                  setConfirmId(null)
                                })
                              }
                              disabled={busy}
                              tone="danger"
                            >
                              삭제 확인
                            </RowButton>
                            <RowButton onClick={() => setConfirmId(null)}>
                              <X className="size-4" />
                            </RowButton>
                          </>
                        ) : (
                          <>
                            <RowButton onClick={() => startEdit(row)}>
                              <Pencil className="size-4" />
                              Edit
                            </RowButton>
                            {!isTheAdmin && (
                              <RowButton
                                onClick={() => setConfirmId(row.id)}
                                title="계정 삭제"
                              >
                                <Trash2 className="size-4" />
                              </RowButton>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

            {!loading && shown.length === 0 && (
              <tr>
                <td colSpan={6} className="py-14 text-center">
                  <p className="text-[15px] font-semibold text-foreground">
                    {rows.length === 0
                      ? '등록된 계정이 없습니다.'
                      : '검색 결과가 없습니다.'}
                  </p>
                  <p className="mt-1 text-[14px] text-neutral-500">
                    {rows.length === 0
                      ? '오른쪽 위 Add account 로 첫 계정을 만드세요.'
                      : '다른 이름이나 아이디로 검색해 보세요.'}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </>
  )
}

function RowButton({
  children,
  onClick,
  disabled,
  title,
  tone = 'default',
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  title?: string
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
      title={title}
      className={`flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 ${tones[tone]}`}
    >
      {children}
    </button>
  )
}
