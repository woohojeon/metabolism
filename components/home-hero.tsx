'use client'

import Link from 'next/link'
import { ChevronDown, ChevronUp, Pencil, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CategoryLabel, MetaDate } from '@/components/article-bits'
import { useAuth } from '@/components/auth-provider'
import {
  clearHomeHero,
  loadHomeHero,
  saveHomeHero,
  type BoxSize,
  type HomeHero,
} from '@/lib/edits'
import { deleteUpload, uploadFile } from '@/lib/site-content'

// The home page's opening feature: the photograph, the headline over it and the
// paragraph beneath. The administrator edits all three in place, and what is
// saved is what every visitor loads (lib/site-content.ts).
export function HomeHero({ published }: { published: HomeHero }) {
  const { isAdmin } = useAuth()
  const [data, setData] = useState<HomeHero>(published)
  const [draft, setDraft] = useState<HomeHero>(published)
  const [editing, setEditing] = useState(false)
  const [hasEdits, setHasEdits] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prefer the saved edit over the published copy.
  useEffect(() => {
    let stale = false
    loadHomeHero().then((saved) => {
      if (stale || !saved) return
      setData({ ...published, ...saved })
      setHasEdits(true)
    })
    return () => {
      stale = true
    }
  }, [published])

  // Drop out of edit mode if the user logs out mid-edit.
  useEffect(() => {
    if (!isAdmin) setEditing(false)
  }, [isAdmin])

  function startEditing() {
    setDraft(data)
    setError(null)
    setEditing(true)
  }

  // Saving reaches the server, so it can fail. Stay in edit mode when it does,
  // rather than showing a change no other visitor would see.
  async function save() {
    const replaced = data.image
    try {
      await saveHomeHero(draft)
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장하지 못했습니다.')
      return
    }
    setData(draft)
    setHasEdits(true)
    setEditing(false)
    // Only once the new picture is stored, and only if it is a different one.
    if (replaced && replaced !== draft.image) void deleteUpload(replaced)
  }

  async function resetToOriginal() {
    if (!window.confirm('제목과 소개글, 배경 사진을 원래대로 되돌립니다.')) return
    const replaced = data.image
    try {
      await clearHomeHero()
    } catch (e) {
      setError(e instanceof Error ? e.message : '되돌리지 못했습니다.')
      return
    }
    setData(published)
    setDraft(published)
    setHasEdits(false)
    setEditing(false)
    // The uploaded picture is unreferenced now the shipped one is back.
    if (replaced && replaced !== published.image) void deleteUpload(replaced)
  }

  const shown = editing ? draft : data

  const banner = (
    // A 16:9 crop is barely 210px tall on a phone, and the headline and the
    // standfirst together need more than that — laid over it they would be
    // clipped off the top. Below `sm` the caption is a block the banner grows
    // to fit instead, with the photograph filling whatever height that comes to.
    <div className="relative w-full overflow-hidden bg-ink sm:aspect-[16/9]">
      {/* Plain <img>: the picture can be replaced with an upload, which is a
          remote or data: URL. Images are unoptimized site-wide anyway. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={shown.image}
        alt="대사 지도"
        className="absolute inset-0 size-full object-cover opacity-95 transition-transform duration-500 group-hover:scale-[1.02]"
      />
      <div className="relative bg-gradient-to-t from-black/95 via-black/60 to-transparent p-6 pt-40 sm:absolute sm:inset-x-0 sm:bottom-0 sm:p-10 sm:pt-24">
        <div className="flex items-center gap-2">
          <CategoryLabel>Feature</CategoryLabel>
          <span className="text-white/40">|</span>
          <MetaDate className="text-white/70">Metabolism Overview</MetaDate>
        </div>
        {/* `pre` rather than `nowrap`: the type scales with the viewport
            instead of wrapping on its own, but a line break typed by hand is
            kept. Once a width is chosen the headline wraps within it —
            choosing a width is choosing where the lines break.
            Below `sm` that trade is off: holding one line would shrink a
            Korean headline to about 12px, so the phone wraps it and keeps it
            readable instead. */}
        <InlineText
          as="h1"
          editing={editing}
          value={shown.title}
          onChange={(v) => setDraft((d) => ({ ...d, title: v }))}
          size={shown.titleBox}
          onResize={(box) => setDraft((d) => ({ ...d, titleBox: box }))}
          scale={shown.titleScale}
          onScale={(titleScale) => setDraft((d) => ({ ...d, titleScale }))}
          placeholder="제목"
          className={`mt-2 whitespace-pre-wrap text-[calc(clamp(1.25rem,5vw,1.75rem)*var(--type-scale,1))] font-extrabold leading-tight text-white sm:text-[calc(clamp(0.75rem,3.1vw,2.5rem)*var(--type-scale,1))] ${
            shown.titleBox?.width ? 'sm:whitespace-pre-wrap' : 'sm:whitespace-pre'
          }`}
        />
        <InlineText
          editing={editing}
          value={shown.standfirst}
          onChange={(v) => setDraft((d) => ({ ...d, standfirst: v }))}
          size={shown.bodyBox}
          onResize={(box) => setDraft((d) => ({ ...d, bodyBox: box }))}
          scale={shown.bodyScale}
          onScale={(bodyScale) => setDraft((d) => ({ ...d, bodyScale }))}
          placeholder="소개글"
          // Until a width is chosen the standfirst keeps its reading-width cap.
          boxClassName={shown.bodyBox?.width ? '' : 'max-w-2xl'}
          className="mt-3 whitespace-pre-wrap text-[calc(13px*var(--type-scale,1))] leading-snug text-white/85 sm:text-[calc(15px*var(--type-scale,1))]"
        />
      </div>
    </div>
  )

  return (
    <section id="map" className="relative mt-8 scroll-mt-20">
      {/* The banner links to the map; while editing it must not navigate. */}
      {editing ? (
        banner
      ) : (
        <Link href="/map" className="group block">
          {banner}
        </Link>
      )}

      {/* Controls sit outside the link so they never navigate to the map.
          They are bounded on the left as well as the right: with only a right
          edge the row sizes to its content and, once there are four buttons,
          runs off the left of a phone screen instead of wrapping. */}
      {isAdmin && (
        <div className="absolute left-3 right-3 top-3 flex flex-wrap items-center justify-end gap-2">
          {editing ? (
            <>
              <ImagePicker
                onPick={(url) => setDraft((d) => ({ ...d, image: url }))}
                onError={setError}
              />
              {/* A drag or a step that went wrong has to be undoable without
                  reloading. Both the boxes and the type go back at once. */}
              {(draft.titleBox || draft.bodyBox || draft.titleScale || draft.bodyScale) && (
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      titleBox: undefined,
                      bodyBox: undefined,
                      titleScale: undefined,
                      bodyScale: undefined,
                    }))
                  }
                  className="rounded border border-white/60 bg-black/40 px-2.5 py-1 text-[12px] font-bold text-white transition-colors hover:bg-black/60"
                >
                  크기 초기화
                </button>
              )}
              <button
                type="button"
                onClick={save}
                className="rounded bg-science-red px-3 py-1 text-[12px] font-bold text-white transition-opacity hover:opacity-90"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded border border-white/60 bg-black/40 px-3 py-1 text-[12px] font-bold text-white transition-colors hover:border-white"
              >
                취소
              </button>
            </>
          ) : (
            <>
              {hasEdits && (
                <button
                  type="button"
                  onClick={resetToOriginal}
                  className="rounded border border-white/40 bg-black/40 px-2.5 py-1 text-[12px] font-bold text-white/80 transition-colors hover:border-white hover:text-white"
                >
                  원본으로 되돌리기
                </button>
              )}
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex items-center gap-1 rounded border border-white/60 bg-black/40 px-2.5 py-1 text-[12px] font-bold text-white transition-colors hover:bg-black/60"
              >
                <Pencil className="size-[13px]" />
                편집
              </button>
            </>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-[12px] font-bold text-science-red">{error}</p>}
    </section>
  )
}

// Replace the background photograph. uploadFile stores the picked file and hands
// back the URL to keep, so other computers can load the picture too.
function ImagePicker({
  onPick,
  onError,
}: {
  onPick: (url: string) => void
  onError: (message: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (e.target) e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      onPick(await uploadFile(file))
    } catch (err) {
      onError(err instanceof Error ? err.message : '업로드에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" onChange={pick} className="hidden" />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-1 rounded border border-white/60 bg-black/40 px-2.5 py-1 text-[12px] font-bold text-white transition-colors hover:bg-black/60 disabled:opacity-50"
      >
        <Upload className="size-[13px]" />
        {busy ? '올리는 중…' : '배경 사진 변경'}
      </button>
    </>
  )
}

// The width a percentage is measured against: the overlay's box less its
// padding, which is what a child of `width: 100%` fills.
function contentWidth(el: HTMLElement) {
  const style = getComputedStyle(el)
  const inset = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
  return Math.max(1, el.clientWidth - inset)
}

/**
 * A field that keeps its published styling and becomes typable in place, with a
 * corner to drag it wider or taller.
 *
 * Both modes take their size from the same two numbers, and React owns them:
 * the drag reports a size, the size comes back as style, and nothing is written
 * to the node behind React's back. That is what makes the box being edited the
 * box that publishes — a browser-drawn resize corner writes inline width and
 * height of its own, which then linger over the published styling.
 *
 * The text is seeded into the DOM once when edit mode opens. Writing the value
 * back on every keystroke would rebuild the node and throw the caret to the
 * start.
 */
/** How far the type may be taken from the size the design chose for it. */
const SCALE_MIN = 0.5
const SCALE_MAX = 2.5
const SCALE_STEP = 0.1

function InlineText({
  value,
  onChange,
  editing,
  className,
  placeholder,
  size,
  onResize,
  scale = 1,
  onScale,
  boxClassName,
  as: Tag = 'p',
}: {
  value: string
  onChange: (v: string) => void
  editing: boolean
  className?: string
  placeholder?: string
  size?: BoxSize
  onResize?: (size: BoxSize) => void
  /** A multiplier on the type size, not a replacement for it. */
  scale?: number
  onScale?: (scale: number) => void
  /** Sizing rules — they belong to the box, so a drag starts from them. */
  boxClassName?: string
  as?: 'p' | 'h1'
}) {
  const ref = useRef<HTMLElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
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

  // A chosen width applies from `sm` up. Below it the banner is barely wider
  // than the text, so a column of 40% would leave a sliver to read.
  //
  // A chosen height is a floor, never a ceiling: copy taller than the box opens
  // it instead of spilling out.
  const sizing = {
    '--box-w': size?.width ? `${size.width}%` : '100%',
    // Multiplied into the type size by the classes above, so the design's own
    // response to the width of the screen is kept and only stretched.
    '--type-scale': scale,
    minHeight: size?.height ? `${size.height}px` : undefined,
  } as React.CSSProperties

  const step = (by: number) =>
    onScale?.(
      Math.round(Math.min(SCALE_MAX, Math.max(SCALE_MIN, scale + by)) * 100) / 100,
    )

  const box = `w-full sm:w-[var(--box-w)] ${boxClassName ?? ''}`

  if (!editing) {
    return (
      <Tag className={`${box} ${className ?? ''}`} style={sizing}>
        {value}
      </Tag>
    )
  }

  // Follow the pointer: each move reports a size, which comes back as the
  // width of this box on the next render.
  function startResize(e: React.PointerEvent) {
    e.preventDefault()
    const node = boxRef.current
    const overlay = node?.parentElement
    if (!node || !overlay) return

    const basis = contentWidth(overlay)
    const fromX = e.clientX
    const fromY = e.clientY
    const startWidth = node.offsetWidth
    const startHeight = node.offsetHeight

    const move = (ev: PointerEvent) => {
      const width = Math.min(basis, Math.max(80, startWidth + ev.clientX - fromX))
      const height = Math.max(32, startHeight + ev.clientY - fromY)
      onResize?.({
        width: Math.round((width / basis) * 1000) / 10,
        height: Math.round(height),
      })
    }
    const stop = () => window.removeEventListener('pointermove', move)

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop, { once: true })
    window.addEventListener('pointercancel', stop, { once: true })
  }

  return (
    <div ref={boxRef} className={`relative ${box}`} style={sizing}>
      <Tag
        ref={ref as never}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        // .inline-edit pads the box and pulls it back out with a negative
        // margin; the extra width hands that padding back, so the line breaks
        // where the published text breaks.
        className={`inline-edit block h-full w-[calc(100%+0.75rem)] ${className ?? ''}`}
        onInput={(e) => onChange((e.currentTarget as HTMLElement).innerText)}
        onPaste={(e) => {
          // Paste as plain text so pasted markup can't leak into the page.
          e.preventDefault()
          document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
        }}
      />
      <span
        role="presentation"
        onPointerDown={startResize}
        title="상자 크기 조절"
        className="absolute -bottom-1.5 -right-1.5 size-3.5 cursor-se-resize touch-none rounded-sm border border-white/70 bg-white/80 shadow-sm"
      />

      {/* The box is dragged from its corner; the type is stepped from here.
          They are separate things — a wider box rewraps the same words, a
          larger scale sets them in bigger type. */}
      {onScale && (
        <div className="absolute -top-3 left-0 z-10 flex items-center gap-0.5 rounded bg-black/70 px-1 py-0.5 shadow-sm">
          <ScaleButton onClick={() => step(-SCALE_STEP)} disabled={scale <= SCALE_MIN} title="글씨 작게">
            <span className="text-[10px]">A</span>
            <ChevronDown className="size-3" />
          </ScaleButton>
          <span className="min-w-[2.4rem] text-center text-[10px] font-bold tabular-nums text-white/80">
            {Math.round(scale * 100)}%
          </span>
          <ScaleButton onClick={() => step(SCALE_STEP)} disabled={scale >= SCALE_MAX} title="글씨 크게">
            <span className="text-[13px]">A</span>
            <ChevronUp className="size-3" />
          </ScaleButton>
        </div>
      )}
    </div>
  )
}

function ScaleButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  disabled: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      // Keep the caret in the text — a focus change would end the edit the
      // administrator is in the middle of.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex h-5 items-center gap-px rounded px-1 font-bold leading-none text-white transition-colors hover:bg-white/20 disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}
