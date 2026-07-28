'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, Lock, Maximize2, Trash2, Upload, X } from 'lucide-react'
import { useAuth } from './auth-provider'
import { LoginDialog } from './login-dialog'
import { convertPptxToPdf, toStorableUrl } from '@/lib/pptx-to-pdf'

function readDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}

// The lecture-slide card. Logged-in users can open the deck inline (as a PDF,
// no download needed), download the original .pptx, or upload a new deck.
//
// Upload takes the .pptx — that is the file students download. A .pptx cannot be
// rendered in a browser, so it is converted to PDF via CloudConvert on the way
// in, and the viewer opens that PDF. Uploading a .pdf directly still works.
export function SlideViewer({
  pptx,
  pdf,
  filename,
  canEdit,
  onUpload,
  onDelete,
}: {
  pptx?: string
  pdf?: string
  filename: string
  canEdit: boolean
  onUpload?: (picked: { pptx?: string; pdf?: string }) => void
  onDelete?: () => void
}) {
  const { user } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (e.target) e.target.value = ''
    if (!files.length || !onUpload) return

    // A .pptx and a ready-made .pdf export can be picked together; the pptx is
    // only converted when no pdf came with it.
    const deck = files.find((f) => /\.pptx$/i.test(f.name))
    const pdfFile = files.find((f) => /\.pdf$/i.test(f.name))
    if (!deck && !pdfFile) {
      window.alert('.pptx 또는 .pdf 파일을 선택하세요.')
      return
    }

    setBusy('올리는 중…')
    const picked: { pptx?: string; pdf?: string } = {}
    try {
      if (deck) picked.pptx = await readDataUrl(deck)
      if (pdfFile) picked.pdf = await readDataUrl(pdfFile)

      if (deck && !pdfFile) {
        const url = await convertPptxToPdf(deck, (stage) =>
          setBusy(stage === 'uploading' ? '올리는 중…' : 'PDF로 변환 중…'),
        )
        picked.pdf = await toStorableUrl(url)
      }
    } catch (err) {
      // Keep whatever made it through — a failed conversion still leaves the
      // .pptx downloadable, and a PDF can be added by hand afterwards.
      window.alert(
        err instanceof Error ? err.message : '슬라이드를 처리하지 못했습니다.',
      )
    } finally {
      setBusy(null)
      if (picked.pptx || picked.pdf) onUpload(picked)
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
            {canEdit && onUpload && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation,.pdf,application/pdf"
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
                  {busy ?? '슬라이드 업로드 (.pptx)'}
                </button>
                {pptx && !pdf && !busy && (
                  <p className="text-[11px] leading-snug text-neutral-500">
                    PDF 변환본이 없습니다. .pptx 를 다시 올리거나, PowerPoint에서 내보낸
                    PDF를 직접 올리면 &lsquo;슬라이드 열기&rsquo;가 켜집니다.
                  </p>
                )}
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
              {canEdit && ' .pptx를 업로드해 추가하세요.'}
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
