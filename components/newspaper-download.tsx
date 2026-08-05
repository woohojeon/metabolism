'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, Lock, Newspaper, Pencil, Trash2, Upload } from 'lucide-react'
import { useAuth } from './auth-provider'
import { LoginDialog } from './login-dialog'
import {
  clearHomeNewspaper,
  loadHomeNewspaper,
  saveHomeNewspaper,
  type HomeNewspaper,
} from '@/lib/edits'
import { downloadUrl } from '@/lib/download-url'
import { deleteUpload, uploadFile } from '@/lib/site-content'

// The veterinary-biochemistry newspaper download card. The PDF is served from
// /public (or from an upload once replaced), but only logged-in users are shown
// the download link; everyone else is prompted to sign in first.
//
// The administrator (jbnu) edits the title in place and uploads a replacement
// PDF, and what is saved is what every visitor downloads (lib/edits.ts).
export function NewspaperDownload({ published }: { published: HomeNewspaper }) {
  const { user, isAdmin } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)

  const [data, setData] = useState<HomeNewspaper>(published)
  const [draft, setDraft] = useState<HomeNewspaper>(published)
  const [editing, setEditing] = useState(false)
  const [hasEdits, setHasEdits] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Prefer the saved edit over the published defaults.
  useEffect(() => {
    let stale = false
    loadHomeNewspaper().then((saved) => {
      if (stale || !saved) return
      setData({ ...published, ...saved })
      setHasEdits(true)
    })
    return () => {
      stale = true
    }
  }, [published])

  // Drop out of edit mode if the administrator logs out mid-edit.
  useEffect(() => {
    if (!isAdmin) setEditing(false)
  }, [isAdmin])

  function startEditing() {
    setDraft(data)
    setError(null)
    setEditing(true)
  }

  async function onPickPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (e.target) e.target.value = ''
    if (!file) return
    if (!/\.pdf$/i.test(file.name)) {
      setError('.pdf 파일을 선택하세요.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const pdf = await uploadFile(file)
      setDraft((d) => ({ ...d, pdf }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  // Saving reaches the server, so it can fail. Stay in edit mode when it does,
  // rather than showing a change no other visitor would see.
  async function save() {
    const replaced = data.pdf
    try {
      await saveHomeNewspaper(draft)
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장하지 못했습니다.')
      return
    }
    setData(draft)
    setHasEdits(true)
    setEditing(false)
    // Only now that the new state is stored: had the save failed, the PDF just
    // deleted would still be the one every visitor downloads.
    if (replaced && replaced !== draft.pdf) void deleteUpload(replaced)
  }

  async function resetToOriginal() {
    if (!window.confirm('신문 제목과 PDF를 원래대로 되돌립니다.')) return
    const replaced = data.pdf
    try {
      await clearHomeNewspaper()
    } catch (e) {
      setError(e instanceof Error ? e.message : '되돌리지 못했습니다.')
      return
    }
    setData(published)
    setDraft(published)
    setHasEdits(false)
    setEditing(false)
    // The uploaded PDF is unreferenced now the shipped one is back.
    if (replaced && replaced !== published.pdf) void deleteUpload(replaced)
  }

  const shown = editing ? draft : data
  const downloadName = `${shown.title.trim() || 'newspaper'}.pdf`
  // A PDF picked but not yet saved. Uploading is silent otherwise — the file
  // goes up and nothing on screen changes, which reads as a failure.
  const staged = editing && draft.pdf !== data.pdf

  // Once the newspaper is deleted there is nothing here for a reader. The
  // administrator still sees the card, to put a new one up.
  if (!shown.pdf && !isAdmin) return null

  return (
    <section
      // The editor's controls wrap onto a second row on a phone, so the space
      // held clear for them is taller there than on a wide screen.
      className={`relative mt-8 border-l-4 border-science-red bg-panel px-5 py-8 sm:px-10 ${
        isAdmin ? 'pt-24 sm:pt-14' : ''
      }`}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-science-red">
            <Newspaper className="size-[15px]" />
            Newspaper
          </h2>
          {editing ? (
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="신문 제목"
              className="mt-2 w-full max-w-md rounded border border-neutral-300 px-3 py-1.5 text-xl font-extrabold text-foreground outline-none focus:border-foreground"
            />
          ) : (
            <p className="mt-2 text-xl font-extrabold leading-tight text-foreground">
              {shown.title}
            </p>
          )}
        </div>

        {/* Full width where the card is a single column, so the tap target is
            the whole row rather than a small button at the left margin. */}
        <div className="flex shrink-0 items-center gap-2">
          {!shown.pdf ? (
            <p className="text-[13px] leading-snug text-neutral-500">
              등록된 신문이 없습니다.
              {isAdmin && ' 편집을 눌러 PDF를 올리세요.'}
            </p>
          ) : user ? (
            <a
              href={downloadUrl(shown.pdf, downloadName)}
              download={downloadName}
              className="inline-flex w-full items-center justify-center gap-2 rounded bg-science-red px-5 py-3 text-[13px] font-bold text-white transition-opacity hover:opacity-90 sm:w-auto sm:py-2.5 sm:text-[12px]"
            >
              <Download className="size-[15px]" />
              PDF 내려받기
            </a>
          ) : (
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded border border-science-red px-5 py-3 text-[13px] font-bold text-science-red transition-colors hover:bg-science-red hover:text-white sm:w-auto sm:py-2.5 sm:text-[12px]"
            >
              <Lock className="size-[14px]" />
              로그인 후 내려받기
            </button>
          )}
        </div>
      </div>

      {/* Administrator controls, tucked into the top-right corner like the
          hero's, styled like every other in-place editor. */}
      {isAdmin && (
        <div className="absolute left-3 right-3 top-3 flex flex-wrap items-center justify-end gap-2">
          {editing ? (
            <>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={onPickPdf}
                className="hidden"
              />
              {/* Delete and upload rather than one "replace": taking the old
                  newspaper down and putting a new one up are separate
                  decisions, and the first does not have to wait on the second.
                  Neither reaches the server until 저장. */}
              {draft.pdf ? (
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, pdf: '' }))}
                  disabled={busy}
                  className="inline-flex items-center gap-1 rounded border border-neutral-300 px-3 py-1.5 text-[12px] font-bold text-neutral-600 transition-colors hover:border-science-red hover:text-science-red disabled:opacity-50"
                >
                  <Trash2 className="size-[13px]" />
                  PDF 삭제
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                  className="inline-flex items-center gap-1 rounded border border-science-red/40 bg-science-red/5 px-3 py-1.5 text-[12px] font-bold text-science-red transition-colors hover:bg-science-red/10 disabled:opacity-50"
                >
                  <Upload className="size-[13px]" />
                  {busy ? '올리는 중…' : 'PDF 업로드 (.pdf)'}
                </button>
              )}
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="rounded bg-science-red px-3 py-1 text-[12px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded border border-neutral-300 px-3 py-1 text-[12px] font-bold text-neutral-600 transition-colors hover:border-neutral-500"
              >
                취소
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex shrink-0 items-center gap-1 rounded border border-science-red/40 bg-science-red/5 px-2.5 py-1 text-[12px] font-bold text-science-red transition-colors hover:bg-science-red/10"
              >
                <Pencil className="size-[13px]" />
                편집
              </button>
              {hasEdits && (
                <button
                  type="button"
                  onClick={resetToOriginal}
                  className="text-[12px] font-bold text-neutral-400 transition-colors hover:text-science-red"
                >
                  원본으로 되돌리기
                </button>
              )}
            </>
          )}
        </div>
      )}

      {staged && !error && (
        <p className="mt-3 text-[12px] font-bold text-science-red">
          {draft.pdf ? '새 PDF를 올렸습니다.' : 'PDF를 삭제했습니다.'} 저장을 눌러야 반영됩니다.
        </p>
      )}

      {error && <p className="mt-3 text-[12px] font-bold text-science-red">{error}</p>}

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </section>
  )
}
