'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Search, BookOpen } from 'lucide-react'
import { Wordmark } from './wordmark'
import { categories } from '@/lib/pathways'

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-ink text-white">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-4 lg:px-6">
        {/* Left: brand attribution */}
        <div className="flex items-center gap-4">
          <span className="hidden text-[10px] leading-tight text-white/70 sm:block">
            brought to you by
            <br />
            <span className="text-white/90">Jeonbuk National University</span>
          </span>
        </div>

        {/* Center: wordmark */}
        <Link
          href="/"
          aria-label="Veterinary Biochemistry home"
          className="absolute left-1/2 -translate-x-1/2"
        >
          <Wordmark className="whitespace-nowrap text-[15px] text-white sm:text-[20px]" />
        </Link>

        {/* Right: utilities + hamburger */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            aria-label="Search"
            className="hidden text-white/90 transition-colors hover:text-white sm:inline"
          >
            <Search className="size-[18px]" />
          </button>
          <Link
            href="/instructor"
            aria-label="Instructor"
            className="hidden text-white/90 transition-colors hover:text-white sm:inline"
          >
            <BookOpen className="size-[18px]" />
          </Link>
          <Link
            href="/map"
            className="rounded-full bg-science-red px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90 sm:px-4"
          >
            The Metabolic Map
          </Link>
          <div className="h-6 w-px bg-white/20" />
          <button
            type="button"
            aria-label={menuOpen ? 'Close structure menu' : 'Open structure menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center text-white/90 transition-colors hover:text-white"
          >
            {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Full structure panel */}
      {menuOpen && (
        <div className="border-t border-white/10 bg-ink">
          <div className="mx-auto max-h-[calc(100vh-3.5rem)] max-w-[1280px] overflow-y-auto px-4 py-6 lg:px-6">
            <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
                Structure
              </h2>
              <Link
                href="/map"
                onClick={() => setMenuOpen(false)}
                className="text-[11px] font-bold uppercase tracking-wider text-science-red transition-colors hover:text-white"
              >
                The Metabolic Map
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => (
                <div key={cat.slug}>
                  <Link
                    href={`/${cat.slug}`}
                    onClick={() => setMenuOpen(false)}
                    className="group flex items-baseline gap-2 border-b border-white/15 pb-2"
                  >
                    <h3 className="text-[14px] font-extrabold uppercase tracking-wide text-white transition-colors group-hover:text-science-red">
                      {cat.name}
                    </h3>
                    <span className="text-[11px] text-white/40">{cat.korean}</span>
                  </Link>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {cat.pathways.map((p) => (
                      <li key={p.slug}>
                        <Link
                          href={`/${cat.slug}/${p.slug}`}
                          onClick={() => setMenuOpen(false)}
                          className="block text-[13px] leading-snug text-white/75 transition-colors hover:text-white"
                        >
                          {p.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div>
                <div className="border-b border-white/15 pb-2">
                  <h3 className="text-[14px] font-extrabold uppercase tracking-wide text-white">
                    More
                  </h3>
                </div>
                <ul className="mt-2 flex flex-col gap-1.5">
                  <li>
                    <Link
                      href="/instructor"
                      onClick={() => setMenuOpen(false)}
                      className="block text-[13px] leading-snug text-white/75 transition-colors hover:text-white"
                    >
                      Instructor
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/map"
                      onClick={() => setMenuOpen(false)}
                      className="block text-[13px] leading-snug text-white/75 transition-colors hover:text-white"
                    >
                      The Metabolic Map
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
