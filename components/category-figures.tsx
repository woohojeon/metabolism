'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { loadCategoryFigures, saveCategoryFigures } from '@/lib/edits'
import { uploadFile } from '@/lib/site-content'

// A supplementary image gallery shown on each category page. The published
// images come from the category data (extracted from 'Figures_upload.pptx');
// the administrator can add or remove images, and the result is what every
// visitor sees.
export function CategoryFigures({
  categorySlug,
  categoryName,
  published,
}: {
  categorySlug: string
  categoryName: string
  published: string[]
}) {
  const { isAdmin } = useAuth()
  const [figures, setFigures] = useState<string[]>(published)
  const [editing, setEditing] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Prefer the saved edits over the published defaults.
  useEffect(() => {
    let stale = false
    loadCategoryFigures(categorySlug).then((saved) => {
      if (!stale && saved) setFigures(saved)
    })
    return () => {
      stale = true
    }
  }, [categorySlug])

  // Leave edit mode if the user logs out mid-edit.
  useEffect(() => {
    if (!isAdmin) setEditing(false)
  }, [isAdmin])

  // Shows the previous list again if the save was rejected, so what is on
  // screen always matches what other visitors would load.
  async function persist(next: string[]) {
    const previous = figures
    setFigures(next)
    setError(null)
    try {
      await saveCategoryFigures(categorySlug, next)
    } catch (e) {
      setFigures(previous)
      setError(e instanceof Error ? e.message : '저장하지 못했습니다.')
    }
  }

  function addFigure(src: string) {
    void persist([...figures, src])
  }

  function removeFigure(i: number) {
    void persist(figures.filter((_, j) => j !== i))
  }

  // Nothing to show and no one to add anything: render nothing.
  if (figures.length === 0 && !isAdmin) return null

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between border-t-2 border-foreground pt-3">
        <h2 className="text-lg font-extrabold uppercase tracking-wide">Figures</h2>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            className="rounded border border-science-red/40 bg-science-red/5 px-3 py-1 text-[12px] font-bold text-science-red transition-colors hover:bg-science-red/10"
          >
            {editing ? '완료' : '편집'}
          </button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {figures.map((src, i) => (
          <figure
            key={i}
            className="group relative flex items-center justify-center overflow-hidden rounded border border-neutral-200 bg-white"
          >
            {/* Plain <img>: figures can be data: URLs from an upload, which
                next/image can't optimize. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${categoryName} figure ${i + 1}`}
              loading="lazy"
              className="h-auto w-full cursor-zoom-in"
              onClick={() => setLightbox(src)}
            />
            {editing && (
              <button
                type="button"
                onClick={() => removeFigure(i)}
                aria-label="이미지 삭제"
                className="absolute right-2 top-2 inline-flex items-center gap-1 rounded bg-white/90 px-2 py-1 text-[11px] font-bold text-neutral-600 shadow-sm transition-colors hover:text-science-red"
              >
                <X className="size-[13px]" />
                삭제
              </button>
            )}
          </figure>
        ))}
      </div>

      {editing && <FigureAdder onAdd={addFigure} onError={setError} />}

      {error && (
        <p className="mt-3 text-[12px] font-bold text-science-red">{error}</p>
      )}

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </section>
  )
}

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

// Add a figure by uploading an image file. uploadFile stores it and hands back
// the URL to keep, so the gallery document stays small and other computers can
// load the image too.
function FigureAdder({
  onAdd,
  onError,
}: {
  onAdd: (src: string) => void
  onError: (message: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (e.target) e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      onAdd(await uploadFile(file))
    } catch (err) {
      onError(err instanceof Error ? err.message : '업로드에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-4">
      <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-1 rounded border border-science-red/40 bg-science-red/5 px-3 py-1.5 text-[12px] font-bold text-science-red transition-colors hover:bg-science-red/10 disabled:opacity-50"
      >
        <Upload className="size-[13px]" />
        {busy ? '올리는 중…' : '이미지 파일 업로드'}
      </button>
    </div>
  )
}
