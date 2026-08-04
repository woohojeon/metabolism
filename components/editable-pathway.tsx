'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Bold, Pencil, Subscript, Superscript, Underline, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CategoryLabel } from '@/components/article-bits'
import { SlideViewer } from '@/components/slide-download'
import {
  KeyStepCanvas,
  KeyStepZoom,
  emptyCanvas,
  hasCanvas,
} from '@/components/key-step-canvas'
import { sanitizeRich } from '@/lib/rich-text'
import type { Category, Pathway, Video } from '@/lib/pathways'
import { clearPathwayEdit, loadPathwayEdit, savePathwayEdit } from '@/lib/edits'
import { uploadFile } from '@/lib/site-content'
import { useAuth } from '@/components/auth-provider'

// Only the sections the article actually publishes are editable, and only one
// at a time — editing happens in place, never in a separate form.
type Section = 'overview' | 'keystep' | 'videos' | 'figures'

// Classification / formatting glyphs offered in the Overview editor toolbar.
const SYMBOLS = ['•', '◦', '▪', '▸', '·']

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

// Accepts a full watch/share/embed URL or a bare id, and yields the id.
function youTubeId(input: string) {
  const s = input.trim()
  const m = s.match(/(?:v=|youtu\.be\/|\/embed\/|\/shorts\/)([\w-]{11})/)
  return m ? m[1] : s
}

export function EditablePathway({
  category,
  pathway,
}: {
  category: Category
  pathway: Pathway
}) {
  const [data, setData] = useState<Pathway>(pathway)
  const [draft, setDraft] = useState<Pathway>(pathway)
  const [editing, setEditing] = useState<Section | null>(null)
  const [hasEdits, setHasEdits] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [zoomOpen, setZoomOpen] = useState(false)
  const { isAdmin } = useAuth()

  useEffect(() => {
    let stale = false
    loadPathwayEdit(category.slug, pathway.slug).then((saved) => {
      if (stale || !saved) return
      setData({ ...pathway, ...saved })
      setHasEdits(true)
    })
    return () => {
      stale = true
    }
  }, [category.slug, pathway.slug, pathway])

  // Drop out of edit mode if the user logs out mid-edit.
  useEffect(() => {
    if (!isAdmin) setEditing(null)
  }, [isAdmin])

  function startEditing(section: Section) {
    setDraft(clone(data))
    setEditing(section)
  }

  // Saving reaches the server, so it can fail. Stay in edit mode when it does,
  // rather than showing changes that no other visitor would see.
  async function save() {
    try {
      await savePathwayEdit(category.slug, pathway.slug, draft)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '저장하지 못했습니다.')
      return
    }
    setData(draft)
    setHasEdits(true)
    setEditing(null)
  }

  async function resetToOriginal() {
    if (!window.confirm('이 페이지의 모든 수정을 취소하고 원본으로 되돌립니다.')) return
    try {
      await clearPathwayEdit(category.slug, pathway.slug)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '되돌리지 못했습니다.')
      return
    }
    setData(pathway)
    setHasEdits(false)
    setEditing(null)
  }

  // The section being edited reads from `draft`; every other section from `data`.
  const shown = (section: Section) => (editing === section ? draft : data)

  function setField<K extends keyof Pathway>(key: K, value: Pathway[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }
  function setStep(i: number, field: 'title' | 'detail', value: string) {
    setDraft((d) => ({
      ...d,
      steps: d.steps.map((s, j) => (j === i ? { ...s, [field]: value } : s)),
    }))
  }
  function setVideo(i: number, field: keyof Video, value: string) {
    setDraft((d) => ({
      ...d,
      videos: (d.videos ?? []).map((v, j) =>
        j === i ? { ...v, [field]: field === 'id' ? youTubeId(value) : value } : v,
      ),
    }))
  }
  function addVideo() {
    setDraft((d) => ({ ...d, videos: [...(d.videos ?? []), { id: '', title: '' }] }))
  }
  function removeVideo(i: number) {
    setDraft((d) => ({ ...d, videos: (d.videos ?? []).filter((_, j) => j !== i) }))
  }
  function addFigure(src: string) {
    const s = src.trim()
    if (!s) return
    setDraft((d) => ({ ...d, figures: [...(d.figures ?? []), s] }))
  }
  function removeFigure(i: number) {
    setDraft((d) => ({ ...d, figures: (d.figures ?? []).filter((_, j) => j !== i) }))
  }

  // Persist an uploaded lecture-slide file straight away — it lives outside the
  // one-section-at-a-time edit flow, so it saves on its own like the map edits.
  // The .pptx is what students download; the .pdf is what the inline viewer opens.
  async function setSlides(pdf: string) {
    const updated = { ...data, slidesPdf: pdf }
    setData(updated)
    try {
      await savePathwayEdit(category.slug, pathway.slug, updated)
      setHasEdits(true)
    } catch (e) {
      window.alert(
        e instanceof Error
          ? e.message
          : '슬라이드를 저장하지 못했습니다. 이번 세션에서만 보입니다.',
      )
    }
  }

  // Remove the lecture slides. Empty strings (not undefined) so the cleared
  // value survives JSON and overrides the injected default on reload.
  async function deleteSlides() {
    if (!window.confirm('강의 슬라이드를 삭제할까요?')) return
    const updated = { ...data, slidesPdf: '' }
    try {
      await savePathwayEdit(category.slug, pathway.slug, updated)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '삭제하지 못했습니다.')
      return
    }
    setData(updated)
    setHasEdits(true)
  }

  const overview = shown('overview')
  const keystep = shown('keystep')
  const videos = shown('videos')
  const figures = shown('figures')

  // A published section always shows. The administrator additionally sees the
  // editable sections even when empty, so content can be *added*, not only
  // changed. (Key Step keeps its own diagram/editor flow.)
  const hasOverview = data.overview.length > 0 || isAdmin
  const hasKeyStep =
    Boolean(data.keyStepSvg) || data.steps.length > 0 || hasCanvas(data.keyStepCanvas)
  const hasVideos = Boolean(data.videos?.length) || isAdmin
  const hasFigures = Boolean(data.figures?.length) || isAdmin

  const sectionProps = (section: Section) => ({
    canEdit: isAdmin && editing === null,
    editing: editing === section,
    onEdit: () => startEditing(section),
    onSave: save,
    onCancel: () => setEditing(null),
  })

  return (
    <>
      {isAdmin && hasEdits && (
        <div className="mt-6 flex items-center justify-end">
          <button
            type="button"
            onClick={resetToOriginal}
            className="text-[12px] font-bold text-neutral-400 transition-colors hover:text-science-red"
          >
            원본으로 되돌리기
          </button>
        </div>
      )}

      {/* Title block */}
      <header className="mt-6 border-b border-neutral-200 pb-8">
        <div className="flex flex-wrap items-center gap-x-2">
          <CategoryLabel>{category.name}</CategoryLabel>
          {data.location && (
            <>
              <span className="text-neutral-300">|</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                {data.location}
              </span>
            </>
          )}
          {hasEdits && (
            <span className="rounded-full bg-science-red/10 px-2 py-0.5 text-[10px] font-bold text-science-red">
              Edited
            </span>
          )}
        </div>
        <h1 className="mt-2 max-w-4xl text-balance text-4xl font-extrabold leading-tight text-foreground sm:text-5xl">
          {data.name}
        </h1>
        {data.equation && (
          <p className="mt-4 max-w-3xl rounded-sm bg-panel px-4 py-3 font-mono text-[13px] leading-relaxed text-neutral-700">
            {data.equation}
          </p>
        )}
        {data.summary && (
          <p className="mt-4 max-w-3xl text-[18px] leading-relaxed text-foreground">
            {data.summary}
          </p>
        )}
      </header>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Main column */}
        <article className="lg:col-span-8">
          {hasOverview && (
            <section>
              <SectionHeading title="Overview" {...sectionProps('overview')} />
              {editing === 'overview' ? (
                // The whole body is edited as one block, Enter starting a new paragraph.
                <RichBody
                  paragraphs={overview.overview}
                  onChange={(paras) => setField('overview', paras)}
                />
              ) : (
                <div className="mt-4 space-y-4">
                  {overview.overview.map((para, i) => (
                    <p
                      key={i}
                      className="text-[16px] leading-relaxed text-neutral-700"
                      dangerouslySetInnerHTML={{ __html: sanitizeRich(para) }}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {hasKeyStep && (
            <section className="mt-10">
              <SectionHeading title="Key Step" {...sectionProps('keystep')} />

              {/* A diagram laid out on the page wins over the imported image. */}
              {keystep.keyStepCanvas ? (
                editing === 'keystep' ? (
                  <KeyStepCanvas
                    canvas={keystep.keyStepCanvas}
                    editing
                    onChange={(canvas) => setField('keyStepCanvas', canvas)}
                  />
                ) : (
                  // Tap to open it full size, as the figures do. Only outside
                  // edit mode: there a click on the board picks up a text box
                  // to drag, and the two gestures would be the same one.
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="다이어그램 확대"
                    onClick={() => setZoomOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setZoomOpen(true)
                      }
                    }}
                    className="cursor-zoom-in"
                  >
                    <KeyStepCanvas
                      canvas={keystep.keyStepCanvas}
                      editing={false}
                      onChange={() => {}}
                    />
                  </div>
                )
              ) : keystep.keyStepSvg ? (
                <div className="mt-4 overflow-x-auto rounded border border-neutral-200 bg-white p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={keystep.keyStepSvg}
                    alt={`${keystep.name} key-step reaction diagram`}
                    className="h-auto w-full min-w-[640px] cursor-zoom-in"
                    onClick={() => setLightbox(keystep.keyStepSvg!)}
                  />
                </div>
              ) : (
                <ol className="mt-4">
                  {keystep.steps.map((step, i) => (
                    <li
                      key={i}
                      className={`grid grid-cols-[3.25rem_1fr] gap-4 py-4 ${i === 0 ? '' : 'border-t border-neutral-200'}`}
                    >
                      <span className="font-serif text-2xl leading-none text-science-red">
                        · {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="space-y-1">
                        <InlineText
                          as="h3"
                          editing={editing === 'keystep'}
                          value={step.title}
                          onChange={(v) => setStep(i, 'title', v)}
                          placeholder="단계 제목"
                          className="text-[15px] font-bold text-foreground"
                        />
                        <InlineText
                          editing={editing === 'keystep'}
                          value={step.detail}
                          onChange={(v) => setStep(i, 'detail', v)}
                          placeholder="단계 설명"
                          className="text-[14px] leading-snug text-neutral-700"
                        />
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              {/* A pathway with no diagram yet starts one from an empty canvas. */}
              {editing === 'keystep' && !keystep.keyStepCanvas && (
                <button
                  type="button"
                  onClick={() => setField('keyStepCanvas', emptyCanvas())}
                  className="mt-4 rounded border border-science-red/40 bg-science-red/5 px-3 py-1.5 text-[12px] font-bold text-science-red transition-colors hover:bg-science-red/10"
                >
                  다이어그램 직접 그리기
                </button>
              )}
            </section>
          )}

          {hasFigures && (
            <section className="mt-10">
              <SectionHeading title="Figures" {...sectionProps('figures')} />
              {/* Thumbnails at a fixed height rather than each figure's own, so
                  a tall diagram cannot outweigh the article it belongs to.
                  `contain` keeps every figure whole; a tap opens it full size. */}
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {(figures.figures ?? []).map((src, i) => (
                  <figure
                    key={i}
                    className="group relative overflow-hidden rounded border border-neutral-200 bg-white"
                  >
                    {/* Plain <img>: figures can be remote or data: URLs from an
                        upload, which next/image can't optimize. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`${data.name} figure ${i + 1}`}
                      className="h-32 w-full cursor-zoom-in object-contain p-2 transition-transform duration-300 group-hover:scale-[1.04] sm:h-40"
                      onClick={() => setLightbox(src)}
                    />
                    {editing === 'figures' && (
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
              {editing === 'figures' && <FigureAdder onAdd={addFigure} />}
            </section>
          )}

          {hasVideos && (
            <section className="mt-10">
              <SectionHeading title="Videos" {...sectionProps('videos')} />
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {(videos.videos ?? []).map((v, i) => (
                  <figure key={i}>
                    <div className="aspect-video w-full overflow-hidden rounded border border-neutral-200 bg-black">
                      {v.id ? (
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${v.id}`}
                          title={v.title}
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="size-full"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-[12px] font-bold text-neutral-400">
                          유튜브 링크를 붙여넣으세요
                        </div>
                      )}
                    </div>

                    {editing === 'videos' ? (
                      <div className="mt-2 space-y-2">
                        <InlineText
                          editing
                          value={v.title}
                          onChange={(val) => setVideo(i, 'title', val)}
                          placeholder="영상 제목"
                          className="text-[13px] font-semibold leading-snug text-neutral-700"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="url"
                            defaultValue={v.id ? `https://www.youtube.com/watch?v=${v.id}` : ''}
                            onChange={(e) => setVideo(i, 'id', e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full rounded border border-neutral-300 px-2 py-1 font-mono text-[11px] text-neutral-600 focus:border-science-red focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => removeVideo(i)}
                            className="shrink-0 rounded border border-neutral-300 px-2 py-1 text-[11px] font-bold text-neutral-400 transition-colors hover:border-science-red hover:text-science-red"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ) : (
                      <figcaption className="mt-2 text-[13px] font-semibold leading-snug text-neutral-700">
                        <a
                          href={`https://www.youtube.com/watch?v=${v.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="transition-colors hover:text-science-red"
                        >
                          {v.title}
                        </a>
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
              {editing === 'videos' && (
                <button
                  type="button"
                  onClick={addVideo}
                  className="mt-4 text-[12px] font-bold text-science-red hover:underline"
                >
                  + 영상 추가
                </button>
              )}
            </section>
          )}
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-4">
          <div className="sticky top-20 space-y-6">
            {(data.slidesPdf || isAdmin) && (
              <SlideViewer
                pdf={data.slidesPdf}
                filename={`${data.slug}.pdf`}
                canEdit={isAdmin}
                onUpload={setSlides}
                onDelete={deleteSlides}
              />
            )}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 400px, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <Link href={`/${category.slug}`}>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                    {category.name}
                  </span>
                </Link>
              </div>
            </div>

            {(data.location || data.energetics) && (
              <div className="bg-panel p-5">
                {data.location && (
                  <>
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      Location
                    </h3>
                    <p className="mt-1 text-[14px] font-semibold text-foreground">
                      {data.location}
                    </p>
                  </>
                )}
                {data.energetics && (
                  <>
                    <h3 className="mt-4 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      Energetics
                    </h3>
                    <p className="mt-1 text-[14px] leading-snug text-neutral-700">
                      {data.energetics}
                    </p>
                  </>
                )}
              </div>
            )}

            {data.vetNote && (
              <div className="border-l-4 border-science-red bg-panel p-5">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-science-red">
                  Veterinary Note
                </h3>
                <p className="mt-2 text-[14px] leading-snug text-neutral-700">{data.vetNote}</p>
              </div>
            )}

            <div>
              <h3 className="border-b-2 border-foreground pb-2 text-[11px] font-bold uppercase tracking-wider text-foreground">
                More in {category.name}
              </h3>
              <ul className="mt-2">
                {category.pathways
                  .filter((p) => p.slug !== pathway.slug)
                  .map((p) => (
                    <li key={p.slug} className="border-b border-neutral-200">
                      <Link
                        href={`/${category.slug}/${p.slug}`}
                        className="group block py-2.5 text-[14px] font-semibold text-foreground transition-colors hover:text-science-red"
                      >
                        {p.name}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>

      {zoomOpen && data.keyStepCanvas && (
        <KeyStepZoom canvas={data.keyStepCanvas} onClose={() => setZoomOpen(false)} />
      )}
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </>
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

// ---------------------------------------------------------------------------
// Add a figure to the gallery by uploading an image file. The upload is stored
// once and only its URL travels with the pathway edit.
function FigureAdder({ onAdd }: { onAdd: (src: string) => void }) {
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
      window.alert(err instanceof Error ? err.message : '업로드에 실패했습니다.')
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

// ---------------------------------------------------------------------------
// The article body, edited as one block: the paragraphs keep their published
// styling, Enter starts a new one, and bold/underline apply to the selection.
function RichBody({
  paragraphs,
  onChange,
}: {
  paragraphs: string[]
  onChange: (paragraphs: string[]) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const seeded = useRef(false)

  // Seed the DOM once. Writing the value back on every keystroke would rebuild
  // the nodes and throw the caret to the start.
  useEffect(() => {
    if (ref.current && !seeded.current) {
      ref.current.innerHTML = paragraphs.map((p) => `<p>${sanitizeRich(p)}</p>`).join('')
      seeded.current = true
    }
  }, [paragraphs])

  function read(el: HTMLElement) {
    // Enter yields <p> in some browsers and <div> in others; either is a paragraph.
    const blocks = Array.from(el.children).filter((c) => ['P', 'DIV'].includes(c.tagName))
    const paras = blocks.length
      ? blocks.map((b) => sanitizeRich(b.innerHTML))
      : [sanitizeRich(el.innerHTML)]
    onChange(paras.map((p) => p.trim()).filter(Boolean))
  }

  return (
    <div className="mt-4">
      <div className="mb-2 flex flex-wrap items-center gap-1">
        {[
          { cmd: 'bold', label: <Bold className="size-[13px]" />, title: '굵게' },
          { cmd: 'underline', label: <Underline className="size-[13px]" />, title: '밑줄' },
          // Superscript / subscript for ions and formulae (H⁺, CO₂).
          { cmd: 'superscript', label: <Superscript className="size-[13px]" />, title: '위 첨자' },
          { cmd: 'subscript', label: <Subscript className="size-[13px]" />, title: '아래 첨자' },
        ].map((b) => (
          <button
            key={b.cmd}
            type="button"
            title={b.title}
            // Keep the caret in the body — a focus change would collapse the
            // selection before execCommand runs.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => document.execCommand(b.cmd, false)}
            className="flex size-7 items-center justify-center rounded border border-neutral-300 bg-white text-neutral-600 transition-colors hover:border-science-red hover:text-science-red"
          >
            {b.label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-neutral-200" />
        {/* Classification / formatting glyphs, inserted at the caret. */}
        {SYMBOLS.map((sym) => (
          <button
            key={sym}
            type="button"
            title={`${sym} 삽입`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => document.execCommand('insertText', false, sym)}
            className="flex size-7 items-center justify-center rounded border border-neutral-300 bg-white text-[13px] text-neutral-600 transition-colors hover:border-science-red hover:text-science-red"
          >
            {sym}
          </button>
        ))}
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        className="inline-edit min-h-40 text-[16px] leading-relaxed text-neutral-700 [&>div]:mb-4 [&>p]:mb-4"
        onInput={(e) => read(e.currentTarget)}
        onPaste={(e) => {
          e.preventDefault()
          document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// A field that keeps its published styling and becomes typable in place.
//
// The DOM is seeded only when edit mode opens; keystrokes after that flow one
// way (DOM -> draft). Writing the value back on every keystroke would reset the
// node and throw the caret to the start.
function InlineText({
  value,
  onChange,
  editing,
  className,
  placeholder,
  as: Tag = 'p',
}: {
  value: string
  onChange: (v: string) => void
  editing: boolean
  className?: string
  placeholder?: string
  as?: 'p' | 'h3'
}) {
  const ref = useRef<HTMLElement>(null)
  const seeded = useRef(false)

  useEffect(() => {
    if (!editing) {
      seeded.current = false
      return
    }
    if (ref.current && !seeded.current) {
      ref.current.innerText = value
      seeded.current = true
    }
  }, [editing, value])

  if (!editing) return <Tag className={className}>{value}</Tag>

  return (
    <Tag
      ref={ref as never}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      data-placeholder={placeholder}
      className={`inline-edit ${className ?? ''}`}
      onInput={(e) => onChange((e.currentTarget as HTMLElement).innerText)}
      onPaste={(e) => {
        // Paste as plain text so pasted markup can't leak into the article.
        e.preventDefault()
        const text = e.clipboardData.getData('text/plain')
        document.execCommand('insertText', false, text)
      }}
    />
  )
}

function SectionHeading({
  title,
  canEdit,
  editing,
  onEdit,
  onSave,
  onCancel,
}: {
  title: string
  canEdit: boolean
  editing: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t-2 border-foreground pt-3">
      <h2 className="text-lg font-extrabold uppercase tracking-wide">{title}</h2>
      {editing ? (
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            className="rounded bg-science-red px-3 py-1 text-[12px] font-bold text-white transition-opacity hover:opacity-90"
          >
            저장
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-neutral-300 px-3 py-1 text-[12px] font-bold text-neutral-600 transition-colors hover:border-neutral-500"
          >
            취소
          </button>
        </div>
      ) : (
        canEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex shrink-0 items-center gap-1 rounded border border-science-red/40 bg-science-red/5 px-2.5 py-1 text-[12px] font-bold text-science-red transition-colors hover:bg-science-red/10"
          >
            <Pencil className="size-[13px]" />
            편집
          </button>
        )
      )}
    </div>
  )
}
