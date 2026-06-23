'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Search, BookOpen, User, LogOut } from 'lucide-react'
import { Wordmark } from './wordmark'
import { categories } from '@/lib/pathways'
import { useAuth } from './auth-provider'
import { SearchDialog } from './search-dialog'
import { LoginDialog } from './login-dialog'

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const { user, logout } = useAuth()

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
            onClick={() => setSearchOpen(true)}
            className="flex size-9 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Search className="size-[18px]" />
          </button>
          <Link
            href="/instructor"
            aria-label="Instructor"
            className="hidden size-9 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10 hover:text-white sm:flex"
          >
            <BookOpen className="size-[18px]" />
          </Link>

          {user ? (
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/90 transition-colors hover:bg-white/10 hover:text-white"
            >
              <span className="hidden sm:inline">{user}</span>
              <LogOut className="size-[16px]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/90 transition-colors hover:bg-white/10 hover:text-white"
            >
              <User className="size-[16px]" />
              <span className="hidden sm:inline">Login</span>
            </button>
          )}

          <Link
            href="/map"
            className="hidden rounded-full bg-science-red px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90 sm:inline-block sm:px-4"
          >
            The Metabolic Map
          </Link>
          <div className="h-6 w-px bg-white/20" />
          <button
            type="button"
            aria-label={menuOpen ? 'Close structure menu' : 'Open structure menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex size-9 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10 hover:text-white"
          >
            {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Backdrop */}
      <div
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-40 bg-ink/50 transition-opacity duration-300 ${
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Right-side structure drawer */}
      <aside
        aria-hidden={!menuOpen}
        className={`fixed right-0 top-0 z-50 flex h-dvh w-[88vw] max-w-[420px] flex-col bg-background text-foreground shadow-2xl transition-transform duration-300 ease-out ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-4">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
            Structure
          </h2>
          <button
            type="button"
            aria-label="Close structure menu"
            onClick={() => setMenuOpen(false)}
            className="text-foreground transition-colors hover:text-science-red"
          >
            <X className="size-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-5 py-6">
          <ul className="flex flex-col gap-7">
            {categories.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/${cat.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="group flex items-baseline gap-2 border-b border-neutral-200 pb-2"
                >
                  <h3 className="text-[14px] font-extrabold uppercase tracking-wide text-foreground transition-colors group-hover:text-science-red">
                    {cat.name}
                  </h3>
                  <span className="text-[11px] text-neutral-400">{cat.korean}</span>
                </Link>
                <ul className="mt-2 flex flex-col">
                  {cat.pathways.map((pw) => (
                    <li key={pw.slug}>
                      <Link
                        href={`/${cat.slug}/${pw.slug}`}
                        onClick={() => setMenuOpen(false)}
                        className="block py-1.5 text-[13px] leading-snug text-neutral-600 transition-colors hover:text-science-red"
                      >
                        {pw.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-1 border-t-2 border-foreground pt-4">
            <Link
              href="/instructor"
              onClick={() => setMenuOpen(false)}
              className="block py-1.5 text-[14px] font-extrabold uppercase tracking-wide text-foreground transition-colors hover:text-science-red"
            >
              Instructor
            </Link>
            <Link
              href="/map"
              onClick={() => setMenuOpen(false)}
              className="block py-1.5 text-[14px] font-extrabold uppercase tracking-wide text-foreground transition-colors hover:text-science-red"
            >
              The Metabolic Map
            </Link>
          </div>
        </nav>
      </aside>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  )
}
