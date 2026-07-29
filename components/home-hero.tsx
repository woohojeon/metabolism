'use client'

import Link from 'next/link'
import { Pencil, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CategoryLabel, MetaDate } from '@/components/article-bits'
import { useAuth } from '@/components/auth-provider'
import { clearHomeHero, loadHomeHero, saveHomeHero, type HomeHero } from '@/lib/edits'
import { uploadFile } from '@/lib/site-content'

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
    try {
      await saveHomeHero(draft)
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장하지 못했습니다.')
      return
    }
    setData(draft)
    setHasEdits(true)
    setEditing(false)
  }

  async function resetToOriginal() {
    if (!window.confirm('제목과 소개글, 배경 사진을 원래대로 되돌립니다.')) return
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
  }

  const shown = editing ? draft : data

  const banner = (
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-ink">
      {/* Plain <img>: the picture can be replaced with an upload, which is a
          remote or data: URL. Images are unoptimized site-wide anyway. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={shown.image}
        alt="대사 지도"
        className="absolute inset-0 size-full object-cover opacity-95 transition-transform duration-500 group-hover:scale-[1.02]"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-6 pt-24 sm:p-10">
        <div className="flex items-center gap-2">
          <CategoryLabel>Feature</CategoryLabel>
          <span className="text-white/40">|</span>
          <MetaDate className="text-white/70">Metabolism Overview</MetaDate>
        </div>
        {/* One line at every width: the type scales with the viewport instead
            of wrapping. While editing it may wrap, so a long draft stays
            readable rather than running off the banner. */}
        <InlineText
          as="h1"
          editing={editing}
          value={shown.title}
          onChange={(v) => setDraft((d) => ({ ...d, title: v }))}
          placeholder="제목"
          className={`mt-2 text-[clamp(0.75rem,3.1vw,2.5rem)] font-extrabold leading-tight text-white ${
            editing ? '' : 'whitespace-nowrap'
          }`}
        />
        <InlineText
          editing={editing}
          value={shown.standfirst}
          onChange={(v) => setDraft((d) => ({ ...d, standfirst: v }))}
          placeholder="소개글"
          className="mt-3 max-w-2xl text-[13px] leading-snug text-white/85 sm:text-[15px]"
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

      {/* Controls sit outside the link so they never navigate to the map. */}
      {isAdmin && (
        <div className="absolute right-3 top-3 flex flex-wrap items-center justify-end gap-2">
          {editing ? (
            <>
              <ImagePicker
                onPick={(url) => setDraft((d) => ({ ...d, image: url }))}
                onError={setError}
              />
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

// A field that keeps its published styling and becomes typable in place. The
// DOM is seeded once when edit mode opens; writing the value back on every
// keystroke would rebuild the node and throw the caret to the start.
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
  as?: 'p' | 'h1'
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
        // Paste as plain text so pasted markup can't leak into the page.
        e.preventDefault()
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
      }}
    />
  )
}
