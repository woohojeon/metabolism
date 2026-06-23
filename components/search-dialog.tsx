'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { categories } from '@/lib/pathways'

type Result = {
  href: string
  title: string
  subtitle: string
  kind: 'Category' | 'Pathway'
}

// Flatten categories + pathways into a single searchable index.
const index: Result[] = categories.flatMap((cat) => [
  {
    href: `/${cat.slug}`,
    title: cat.name,
    subtitle: cat.tagline,
    kind: 'Category' as const,
  },
  ...cat.pathways.map((pw) => ({
    href: `/${cat.slug}/${pw.slug}`,
    title: pw.name,
    subtitle: `${cat.name}${pw.location ? ` · ${pw.location}` : ''}`,
    kind: 'Pathway' as const,
  })),
])

export function SearchDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return index
      .filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.subtitle.toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      // Focus the field once the dialog is mounted.
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    setActive(0)
  }, [query])

  const go = (href: string) => {
    onClose()
    router.push(href)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && results[active]) {
      go(results[active].href)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-ink/60"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onKeyDown={onKeyDown}
        className="relative w-full max-w-[560px] overflow-hidden rounded-lg bg-background text-foreground shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-neutral-200 px-4">
          <Search className="size-[18px] shrink-0 text-neutral-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pathways & topics…"
            className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-neutral-400"
          />
          <button
            type="button"
            aria-label="Close search"
            onClick={onClose}
            className="text-neutral-400 transition-colors hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {query.trim() && (
          <ul className="max-h-[50vh] overflow-y-auto py-2">
            {results.length === 0 && (
              <li className="px-4 py-6 text-center text-[13px] text-neutral-500">
                No results for &ldquo;{query}&rdquo;
              </li>
            )}
            {results.map((r, i) => (
              <li key={r.href}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r.href)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === active ? 'bg-neutral-100' : ''
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-semibold">
                      {r.title}
                    </span>
                    <span className="block truncate text-[12px] text-neutral-500">
                      {r.subtitle}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    {r.kind}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
