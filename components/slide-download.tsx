'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, Lock, Maximize2, Trash2, Upload, X } from 'lucide-react'
import { useAuth } from './auth-provider'
import { LoginDialog } from './login-dialog'
import { uploadFile } from '@/lib/site-content'

// Safari on iOS renders a PDF in an iframe as a single, unscrollable first
// page, so the inline viewer is a dead end on a phone or an iPad. There the
// slides open in a tab of their own, where the system PDF reader takes over.
//
// Touch is not asked about through the pointer query alone: an iPad driven
// from a trackpad, or asked for the desktop version of a site, answers
// `pointer: fine` while still being the browser that cannot scroll the
// iframe. Every iPad and iPhone reports touch points, so that settles it.
// Erring towards a new tab costs a desktop with a touchscreen nothing — the
// PDF opens in the browser's own reader either way.
function useOpensInOwnTab() {
  const [ownTab, setOwnTab] = useState(false)

  useEffect(() => {
    setOwnTab(
      window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0,
    )
  }, [])

  return ownTab
}

// The lecture-slide card. Slides are PDFs: logged-in users open one inline or
// download it, and the administrator uploads a replacement.
export function SlideViewer({
  pdf,
  filename,
  canEdit,
  onUpload,
  onDelete,
}: {
  pdf?: string
  filename: string
  canEdit: boolean
  onUpload?: (pdf: string) => void
  onDelete?: () => void
}) {
  const { user } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const ownTab = useOpensInOwnTab()

  const openClass =
    'inline-flex items-center justify-center gap-2 rounded bg-science-red px-4 py-2 text-[12px] font-bold text-white transition-opacity hover:opacity-90'

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (e.target) e.target.value = ''
    if (!file || !onUpload) return

    if (!/\.pdf$/i.test(file.name)) {
      window.alert('.pdf 파일을 선택하세요.')
      return
    }

    setBusy('올리는 중…')
    try {
      onUpload(await uploadFile(file))
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : '슬라이드를 올리지 못했습니다.',
      )
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="border-l-4 border-science-red bg-panel p-5">
      <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-science-red">
        <Download className="size-[14px]" />
        Lecture Slides
      </h3>

      {user ? (
        <>
          <div className="mt-3 flex flex-col gap-2">
            {pdf &&
              (ownTab ? (
                <a href={pdf} target="_blank" rel="noopener noreferrer" className={openClass}>
                  <Maximize2 className="size-[15px]" />
                  슬라이드 열기
                </a>
              ) : (
                <button type="button" onClick={() => setViewerOpen(true)} className={openClass}>
                  <Maximize2 className="size-[15px]" />
                  슬라이드 열기
                </button>
              ))}
            {pdf && (
              <a
                href={pdf}
                download={filename}
                className="inline-flex items-center justify-center gap-2 rounded border border-science-red px-4 py-2 text-[12px] font-bold text-science-red transition-colors hover:bg-science-red hover:text-white"
              >
                <Download className="size-[15px]" />
                PDF 내려받기
              </a>
            )}
            {canEdit && onUpload && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={onPick}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={busy !== null}
                  className="inline-flex items-center justify-center gap-2 rounded border border-neutral-300 px-4 py-2 text-[12px] font-bold text-neutral-600 transition-colors hover:border-foreground disabled:opacity-50"
                >
                  <Upload className="size-[14px]" />
                  {busy ?? '슬라이드 업로드 (.pdf)'}
                </button>
              </>
            )}
            {canEdit && onDelete && pdf && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center justify-center gap-2 rounded border border-neutral-300 px-4 py-2 text-[12px] font-bold text-neutral-500 transition-colors hover:border-science-red hover:text-science-red"
              >
                <Trash2 className="size-[14px]" />
                슬라이드 삭제
              </button>
            )}
          </div>
          {!pdf && (
            <p className="mt-2 text-[12px] leading-snug text-neutral-500">
              아직 등록된 강의 슬라이드가 없습니다.
              {canEdit && ' PDF를 업로드해 추가하세요.'}
            </p>
          )}
        </>
      ) : (
        <>
          <p className="mt-2 flex items-start gap-1.5 text-[13px] leading-snug text-neutral-700">
            <Lock className="mt-0.5 size-[13px] shrink-0 text-neutral-400" />
            로그인한 사용자만 강의 슬라이드를 볼 수 있습니다.
          </p>
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="mt-3 inline-flex items-center gap-2 rounded border border-science-red px-4 py-2 text-[12px] font-bold text-science-red transition-colors hover:bg-science-red hover:text-white"
          >
            <Lock className="size-[14px]" />
            로그인 후 보기
          </button>
        </>
      )}

      {viewerOpen && pdf && <PdfModal src={pdf} onClose={() => setViewerOpen(false)} />}
      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  )
}

function PdfModal({ src, onClose }: { src: string; onClose: () => void }) {
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
      className="fixed inset-0 z-50 flex flex-col bg-black/80 p-2 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="inline-flex items-center gap-1 rounded bg-white/90 px-3 py-1.5 text-[12px] font-bold text-foreground transition-colors hover:bg-white"
        >
          <X className="size-[15px]" />
          닫기 (Esc)
        </button>
      </div>
      <iframe
        src={src}
        title="Lecture slides"
        className="min-h-0 w-full flex-1 rounded bg-white"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
