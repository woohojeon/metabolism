'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { loadCategoryFigures, saveCategoryFigures } from '@/lib/edits'

// A supplementary image gallery shown on each category page. The published
// images come from the category data (extracted from 'Figures_upload.pptx');
// a logged-in user can add or remove images, persisted per browser.
export function CategoryFigures({
  categorySlug,
  categoryName,
  published,
}: {
  categorySlug: string
  categoryName: string
  published: string[]
}) {
  const { user } = useAuth()
  const [figures, setFigures] = useState<string[]>(published)
  const [editing, setEditing] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)

  // Prefer this browser's saved edits over the published defaults.
  useEffect(() => {
    const saved = loadCategoryFigures(categorySlug)
    if (saved) setFigures(saved)
  }, [categorySlug])

  // Leave edit mode if the user logs out mid-edit.
  useEffect(() => {
    if (!user) setEditing(false)
  }, [user])

  function persist(next: string[]) {
    setFigures(next)
    saveCategoryFigures(categorySlug, next)
  }

  function addFigure(src: string) {
    persist([...figures, src])
  }

  function removeFigure(i: number) {
    persist(figures.filter((_, j) => j !== i))
  }

  // Nothing to show and no one to add anything: render nothing.
  if (figures.length === 0 && !user) return null

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between border-t-2 border-foreground pt-3">
        <h2 className="text-lg font-extrabold uppercase tracking-wide">Figures</h2>
        {user && (
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

      {editing && <FigureAdder onAdd={addFigure} />}

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

// Add a figure by uploading an image file (kept as a data: URL in localStorage).
function FigureAdder({ onAdd }: { onAdd: (src: string) => void }) {
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (e.target) e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(r.result as string)
        r.onerror = () => reject(r.error)
        r.readAsDataURL(file)
      })
      onAdd(dataUrl)
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
