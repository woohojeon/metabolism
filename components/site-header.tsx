'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X, Search, User, LogOut, Users } from 'lucide-react'
import { Wordmark } from './wordmark'
import { categories } from '@/lib/pathways'
import { BOARDS, BOARD_CATEGORIES } from '@/lib/board'
import { useAuth } from './auth-provider'
import { SearchDialog } from './search-dialog'
import { LoginDialog } from './login-dialog'

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const { user, isAdmin, logout } = useAuth()

  // Hold the page still behind the open drawer. On a phone the drawer covers
  // most of the screen, and a scroll that lands on the backdrop would otherwise
  // move the article underneath it instead of the menu.
  useEffect(() => {
    if (!menuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-50 bg-ink text-white">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-4 lg:px-6">
        {/* Left: brand mark */}
        <Link
          href="/"
          aria-label="Metabolism home"
          className="flex items-center gap-2 text-white"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <path
              d="M26 16 21 24.66 11 24.66 6 16 11 7.34 21 7.34Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <line x1="16" y1="16" x2="21" y2="7.34" stroke="currentColor" strokeWidth="1.1" />
            <line x1="16" y1="16" x2="6" y2="16" stroke="currentColor" strokeWidth="1.1" />
            <line x1="16" y1="16" x2="21" y2="24.66" stroke="currentColor" strokeWidth="1.1" />
            <circle cx="16" cy="16" r="2.5" fill="currentColor" />
            <circle cx="21" cy="7.34" r="2.2" fill="currentColor" />
            <circle cx="6" cy="16" r="2.2" className="fill-science-red" />
            <circle cx="21" cy="24.66" r="2.2" fill="currentColor" />
          </svg>
          <span className="font-serif text-[17px] leading-none tracking-wide sm:text-[19px]">
            Metabolism
          </span>
        </Link>

        {/* Center: wordmark. It is absolutely positioned, so it cannot push the
            brand and the utilities apart — below `lg` there is no room between
            them and it would simply sit on top of both. Every page carries the
            title elsewhere (the masthead, the breadcrumb), so it is dropped
            rather than shrunk. */}
        <Link
          href="/"
          aria-label="Veterinary Biochemistry home"
          className="absolute left-1/2 hidden -translate-x-1/2 lg:block"
        >
          <Wordmark className="whitespace-nowrap text-[20px] text-white" />
        </Link>

        {/* Right: utilities + hamburger */}
        <div className="flex items-center gap-1 sm:gap-3 lg:gap-4">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="flex size-11 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10 hover:text-white sm:size-9"
          >
            <Search className="size-[18px]" />
          </button>
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/90 transition-colors hover:bg-white/10 hover:text-white sm:flex"
            >
              <Users className="size-[16px]" />
              Accounts
            </Link>
          )}

          {user ? (
            <button
              type="button"
              onClick={logout}
              className="flex h-11 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-bold uppercase tracking-wider text-white/90 transition-colors hover:bg-white/10 hover:text-white sm:h-auto sm:py-1.5"
            >
              <span className="hidden sm:inline">Logout</span>
              <LogOut className="size-[16px]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="flex h-11 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-bold uppercase tracking-wider text-white/90 transition-colors hover:bg-white/10 hover:text-white sm:h-auto sm:py-1.5"
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
            className="flex size-11 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10 hover:text-white sm:size-9"
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

        <nav className="flex-1 overflow-y-auto overscroll-contain px-5 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <ul className="flex flex-col gap-7">
            {/* The board comes before the course structure: it is where the
                notices are, so it is what someone opening this menu mid-term
                is most often after. */}
            <li>
              <Link
                href="/board"
                onClick={() => setMenuOpen(false)}
                className="group flex items-baseline gap-2 border-b border-neutral-200 pb-2"
              >
                <h3 className="text-[14px] font-extrabold uppercase tracking-wide text-foreground transition-colors group-hover:text-science-red">
                  Board
                </h3>
              </Link>
              <ul className="mt-2 flex flex-col">
                {BOARD_CATEGORIES.map((slug) => (
                  <li key={slug}>
                    <Link
                      href={slug === 'notice' ? '/board' : `/board?tab=${slug}`}
                      onClick={() => setMenuOpen(false)}
                      className="block py-2.5 text-[13px] leading-snug text-neutral-600 transition-colors hover:text-science-red sm:py-1.5"
                    >
                      {BOARDS[slug].english}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

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
                </Link>
                <ul className="mt-2 flex flex-col">
                  {cat.pathways.map((pw) => (
                    <li key={pw.slug}>
                      <Link
                        href={`/${cat.slug}/${pw.slug}`}
                        onClick={() => setMenuOpen(false)}
                        className="block py-2.5 text-[13px] leading-snug text-neutral-600 transition-colors hover:text-science-red sm:py-1.5"
                      >
                        {pw.name}
                      </Link>
                      {pw.children.length > 0 && (
                        <ul className="mb-1 ml-3 flex flex-col pl-3">
                          {pw.children.map((ch) => (
                            <li key={ch.slug}>
                              <Link
                                href={`/${cat.slug}/${pw.slug}/${ch.slug}`}
                                onClick={() => setMenuOpen(false)}
                                className="block py-2 text-[12px] leading-snug text-neutral-500 transition-colors hover:text-science-red sm:py-1"
                              >
                                {ch.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
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
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="block py-1.5 text-[14px] font-extrabold uppercase tracking-wide text-science-red transition-colors hover:text-foreground"
              >
                Student Accounts
              </Link>
            )}
          </div>
        </nav>
      </aside>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  )
}
