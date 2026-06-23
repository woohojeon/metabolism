'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Search, BookOpen } from 'lucide-react'
import { Wordmark } from './wordmark'
import { categories } from '@/lib/pathways'

const navItems = [
  ...categories.map((c) => ({ label: c.name.toUpperCase(), href: `/${c.slug}` })),
  { label: 'INSTRUCTOR', href: '/instructor' },
]

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-ink text-white">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-4 lg:px-6">
        {/* Left: nav / hamburger */}
        <div className="flex items-center gap-6">
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center text-white/90 transition-colors hover:text-white lg:hidden"
          >
            {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>

          <nav className="hidden items-center gap-6 text-[11px] font-bold uppercase tracking-wider lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1 text-white/90 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Center: wordmark */}
        <Link
          href="/"
          aria-label="Veterinary Biochemistry home"
          className="absolute left-1/2 -translate-x-1/2"
        >
          <Wordmark className="whitespace-nowrap text-[15px] text-white sm:text-[20px]" />
        </Link>

        {/* Right: utilities */}
        <div className="flex items-center gap-4">
          <span className="hidden text-right text-[10px] leading-tight text-white/70 xl:block">
            brought to you by
            <br />
            <span className="text-white/90">Jeonbuk National University</span>
          </span>
          <div className="hidden h-6 w-px bg-white/20 xl:block" />
          <button
            type="button"
            aria-label="Search"
            className="text-white/90 transition-colors hover:text-white"
          >
            <Search className="size-[18px]" />
          </button>
          <Link
            href="/instructor"
            aria-label="Instructor"
            className="text-white/90 transition-colors hover:text-white"
          >
            <BookOpen className="size-[18px]" />
          </Link>
          <Link
            href="/instructor"
            className="hidden text-[11px] font-bold uppercase tracking-wider text-white/90 transition-colors hover:text-white sm:inline"
          >
            Course
          </Link>
          <Link
            href="/map"
            className="rounded-full bg-science-red px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90 sm:px-4"
          >
            The Metabolic Map
          </Link>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="border-t border-white/10 lg:hidden">
          <ul className="flex flex-col px-4 py-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between border-b border-white/10 py-3 text-sm font-bold uppercase tracking-wider text-white/90 transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
