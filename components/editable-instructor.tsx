'use client'

import Image from 'next/image'
import { Mail, MapPin, Pencil, Phone } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CategoryLabel } from '@/components/article-bits'
import { useAuth } from '@/components/auth-provider'
import {
  loadInstructorProfile,
  saveInstructorProfile,
  type InstructorProfile,
} from '@/lib/edits'

// The instructor page, edited in place: every line keeps its published styling
// and becomes typable where it sits, the way the pathway articles and the home
// hero are edited. What the administrator saves is what every visitor loads.
export function EditableInstructor({
  published,
  image,
}: {
  published: InstructorProfile
  image: string
}) {
  const { isAdmin } = useAuth()
  const [data, setData] = useState<InstructorProfile>(published)
  const [draft, setDraft] = useState<InstructorProfile>(published)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prefer the saved edit over the published copy.
  useEffect(() => {
    let stale = false
    loadInstructorProfile().then((saved) => {
      if (stale || !saved) return
      setData({ ...published, ...saved })
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

  // Saving reaches the server, so it can fail. Stay in edit mode when it does,
  // rather than showing a change no other visitor would see.
  async function save() {
    try {
      await saveInstructorProfile(draft)
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장하지 못했습니다.')
      return
    }
    setData(draft)
    setEditing(false)
  }

  const shown = editing ? draft : data
  const set = <K extends keyof InstructorProfile>(key: K, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }))

  return (
    <>
      {isAdmin && (
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          {editing ? (
            <>
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
                className="rounded border border-neutral-300 px-3 py-1 text-[12px] font-bold text-neutral-600 transition-colors hover:border-neutral-500"
              >
                취소
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex shrink-0 items-center gap-1 rounded border border-science-red/40 bg-science-red/5 px-2.5 py-1 text-[12px] font-bold text-science-red transition-colors hover:bg-science-red/10"
            >
              <Pencil className="size-[13px]" />
              편집
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-[12px] font-bold text-science-red">{error}</p>}

      <header
        className={`grid grid-cols-1 gap-8 pb-10 sm:grid-cols-[200px_1fr] ${
          isAdmin ? 'mt-4' : 'mt-6'
        }`}
      >
        <div className="mx-auto sm:mx-0">
          <div className="relative aspect-square w-[180px] overflow-hidden rounded-full border-4 border-panel shadow-md">
            <Image
              src={image}
              alt={shown.name}
              fill
              priority
              className="object-cover"
              sizes="180px"
            />
          </div>
        </div>

        <div>
          <CategoryLabel>Instructor</CategoryLabel>
          <h1 className="mt-1 text-4xl font-extrabold leading-tight text-foreground sm:text-5xl">
            <InlineText
              as="span"
              editing={editing}
              value={shown.name}
              onChange={(v) => set('name', v)}
              placeholder="이름"
              className="inline-block"
            />{' '}
            <InlineText
              as="span"
              editing={editing}
              value={shown.title}
              onChange={(v) => set('title', v)}
              placeholder="직위"
              className="inline-block text-2xl font-bold text-neutral-400 sm:text-3xl"
            />
          </h1>
          <InlineText
            editing={editing}
            value={shown.department}
            onChange={(v) => set('department', v)}
            placeholder="학과"
            className="mt-1 text-lg font-semibold text-neutral-600"
          />
          <InlineText
            editing={editing}
            value={shown.college}
            onChange={(v) => set('college', v)}
            placeholder="소속"
            className="mt-2 text-[15px] text-neutral-700"
          />
          <InlineText
            editing={editing}
            value={shown.degree}
            onChange={(v) => set('degree', v)}
            placeholder="학위"
            className="mt-3 text-[14px] text-neutral-600"
          />

          {/* Contact. While editing, the address is text to be corrected rather
              than a link that would open a mail client on the first click. */}
          <div className="mt-5 flex flex-col gap-2 text-[14px] text-neutral-700">
            <ContactRow icon={<Mail className="size-4 shrink-0 text-science-red" />}>
              {editing ? (
                <InlineText
                  editing
                  as="span"
                  value={shown.email}
                  onChange={(v) => set('email', v)}
                  placeholder="이메일"
                  className="block"
                />
              ) : (
                <a
                  href={`mailto:${shown.email}`}
                  className="transition-colors hover:text-science-red"
                >
                  {shown.email}
                </a>
              )}
            </ContactRow>

            <ContactRow icon={<Phone className="size-4 shrink-0 text-science-red" />}>
              <InlineText
                editing={editing}
                as="span"
                value={shown.phone}
                onChange={(v) => set('phone', v)}
                placeholder="전화번호"
                className="block"
              />
            </ContactRow>

            <ContactRow icon={<MapPin className="size-4 shrink-0 text-science-red" />}>
              <InlineText
                editing={editing}
                as="span"
                value={shown.office}
                onChange={(v) => set('office', v)}
                placeholder="연구실"
                className="block"
              />
            </ContactRow>
          </div>
        </div>
      </header>
    </>
  )
}

function ContactRow({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <span className="flex items-center gap-2">
      {icon}
      <span className="min-w-0">{children}</span>
    </span>
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
  as?: 'p' | 'span'
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
