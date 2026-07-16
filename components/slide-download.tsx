'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, Lock, Maximize2, Trash2, Upload, X } from 'lucide-react'
import { useAuth } from './auth-provider'
import { LoginDialog } from './login-dialog'

// The lecture-slide card. Logged-in users can open the deck inline (as a PDF,
// no download needed), download the original .pptx, or upload their own PDF.
export function SlideViewer({
  pptx,
  pdf,
  filename,
  canEdit,
  onUploadPdf,
  onDelete,
}: {
  pptx?: string
  pdf?: string
  filename: string
  canEdit: boolean
  onUploadPdf?: (dataUrl: string) => void
  onDelete?: () => void
}) {
  const { user } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (e.target) e.target.value = ''
    if (!file || !onUploadPdf) return
    setBusy(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(r.result as string)
        r.onerror = () => reject(r.error)
        r.readAsDataURL(file)
      })
      onUploadPdf(dataUrl)
    } finally {
      setBusy(false)
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
            {pdf && (
              <button
                type="button"
                onClick={() => setViewerOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded bg-science-red px-4 py-2 text-[12px] font-bold text-white transition-opacity hover:opacity-90"
              >
                <Maximize2 className="size-[15px]" />
                슬라이드 열기
              </button>
            )}
            {pptx && (
              <a
                href={pptx}
                download={filename}
                className="inline-flex items-center justify-center gap-2 rounded border border-science-red px-4 py-2 text-[12px] font-bold text-science-red transition-colors hover:bg-science-red hover:text-white"
              >
                <Download className="size-[15px]" />
                .pptx 내려받기
              </a>
            )}
            {canEdit && onUploadPdf && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={onPick}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded border border-neutral-300 px-4 py-2 text-[12px] font-bold text-neutral-600 transition-colors hover:border-foreground disabled:opacity-50"
                >
                  <Upload className="size-[14px]" />
                  {busy ? '올리는 중…' : '슬라이드 업로드 (PDF)'}
                </button>
              </>
            )}
            {canEdit && onDelete && (pdf || pptx) && (
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
          {!pdf && !pptx && (
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
