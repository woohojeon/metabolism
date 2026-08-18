'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CategoryLabel } from '@/components/article-bits'
import { categories } from '@/lib/pathways'

// Available cover images. As categories scale beyond the number of images,
// these are cycled (rotated) so every slide still gets a cover.
const imagePool = Array.from(new Set(categories.map((c) => c.image)))

function coverImage(cat: (typeof categories)[number], i: number) {
  return cat.image || imagePool[i % imagePool.length]
}

function useVisibleCount() {
  const [visible, setVisible] = useState(4)

  useEffect(() => {
    const queries: [string, number][] = [
      ['(min-width: 1024px)', 4],
      ['(min-width: 640px)', 2],
    ]
    const mqls = queries.map(([q]) => window.matchMedia(q))

    const update = () => {
      const match = queries.find(([q]) => window.matchMedia(q).matches)
      setVisible(match ? match[1] : 1)
    }

    update()
    mqls.forEach((m) => m.addEventListener('change', update))
    return () => mqls.forEach((m) => m.removeEventListener('change', update))
  }, [])

  return visible
}

// Whether the reader has asked for less movement, in the OS settings.
function useReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])

  return reduced
}

export function MacromoleculeSlider() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  // On a touch screen there is no hover to pause on, and a strip that keeps
  // moving while a reader is part-way down one card's pathway list is a strip
  // that loses their place. The first deliberate touch hands over control.
  const [stopped, setStopped] = useState(false)
  const reducedMotion = useReducedMotion()
  const visible = useVisibleCount()
  const count = categories.length
  const maxIndex = Math.max(0, count - visible)

  // Keep index in range when the visible count changes (resize).
  useEffect(() => {
    setIndex((prev) => Math.min(prev, maxIndex))
  }, [maxIndex])

  // Auto-advance one slide at a time; loop back to the start at the end.
  // Pauses on hover, gives up for good once the reader takes over, and never
  // starts where motion is unwelcome or there is nothing to scroll.
  useEffect(() => {
    if (paused || stopped || reducedMotion || maxIndex === 0) return
    const id = setInterval(() => {
      setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
    }, 3000)
    return () => clearInterval(id)
  }, [paused, stopped, reducedMotion, maxIndex])

  const go = (dir: number) => {
    setStopped(true)
    setIndex((prev) => Math.min(Math.max(prev + dir, 0), maxIndex))
  }

  // Swipe to move the strip on a touch screen, where there is no arrow to
  // click under a thumb. The start point is remembered on touchstart and the
  // travel measured on touchend; a mostly-vertical drag is the page scrolling
  // past and is left alone, and a short nudge is ignored so a tap on a card
  // still opens it. Nothing is preventDefault-ed, so vertical scrolling through
  // the strip keeps working.
  const swipeStart = useRef<{ x: number; y: number } | null>(null)
  const SWIPE_MIN = 40

  const onSwipeStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    swipeStart.current = { x: t.clientX, y: t.clientY }
  }
  const onSwipeEnd = (e: React.TouchEvent) => {
    const start = swipeStart.current
    swipeStart.current = null
    if (!start) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) <= Math.abs(dy)) return
    go(dx < 0 ? 1 : -1) // drag left reveals the next slide, drag right the previous
  }

  const totalPathways = categories.reduce((sum, c) => sum + c.pathways.length, 0)
  const cardBasis = 100 / visible
  const canPrev = index > 0
  const canNext = index < maxIndex

  // Which covers are on screen, out of all of them. Counting positions instead
  // would stop the tally short of the total — six stops hold nine categories —
  // and would make the total shrink as the window widens.
  const first = index + 1
  const last = Math.min(index + visible, count)
  const pad = (n: number) => String(n).padStart(2, '0')
  const showing = first === last ? pad(first) : `${pad(first)}–${pad(last)}`

  return (
    <section
      className="mt-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setStopped(true)}
    >
      <div className="flex flex-wrap items-end justify-between gap-4 border-t-2 border-foreground pt-3">
        <div>
          <h2 className="text-lg font-extrabold uppercase tracking-wide">
            Browse by Macromolecule
          </h2>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-neutral-500">
            In This Issue <span className="mx-1 text-neutral-300">|</span> {totalPathways}{' '}
            Metabolic Pathways
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            <span className="text-foreground">{showing}</span> / {pad(count)}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={!canPrev}
              aria-label="Previous macromolecules"
              className="flex size-11 items-center justify-center border border-neutral-300 text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-neutral-300 disabled:hover:bg-transparent disabled:hover:text-foreground sm:size-9"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={!canNext}
              aria-label="Next macromolecules"
              className="flex size-11 items-center justify-center border border-neutral-300 text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-neutral-300 disabled:hover:bg-transparent disabled:hover:text-foreground sm:size-9"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        className="mt-6 overflow-hidden px-3"
        onTouchStart={onSwipeStart}
        onTouchEnd={onSwipeEnd}
      >
        <div
          className="-mx-3 flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * cardBasis}%)` }}
        >
          {categories.map((cat, ci) => (
            <div
              key={cat.slug}
              className="shrink-0 px-3"
              style={{ flexBasis: `${cardBasis}%`, maxWidth: `${cardBasis}%` }}
            >
              {/* Cover image with title overlay */}
              <Link href={`/${cat.slug}`} className="group block">
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
                  <Image
                    src={coverImage(cat, ci)}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <CategoryLabel className="text-white/80">{cat.tagline}</CategoryLabel>
                    <h3 className="mt-1 text-xl font-extrabold leading-tight text-white">
                      {cat.name}
                    </h3>
                  </div>
                </div>
              </Link>

              {/* Pathway list below the image */}
              <div className="mt-3 border-t-2 border-foreground pt-2">
                <p className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  <span>{cat.pathways.length} Pathways</span>
                  <Link
                    href={`/${cat.slug}`}
                    className="text-science-red transition-colors hover:text-foreground"
                  >
                    Explore →
                  </Link>
                </p>
                <ul className="mt-1">
                  {cat.pathways.map((p, i) => (
                    <li key={p.slug} className={i === 0 ? '' : 'border-t border-neutral-200'}>
                      <Link href={`/${cat.slug}/${p.slug}`} className="group block pt-2.5 pb-1">
                        <h4 className="text-[14px] font-bold leading-snug text-foreground transition-colors group-hover:text-science-red">
                          {p.name}
                        </h4>
                      </Link>
                      {p.children.length > 0 && (
                        <ul className="mb-2 ml-2 flex flex-col pl-2.5">
                          {p.children.map((ch) => (
                            <li key={ch.slug}>
                              <Link
                                href={`/${cat.slug}/${p.slug}/${ch.slug}`}
                                className="block py-0.5 text-[11px] leading-snug text-neutral-500 transition-colors hover:text-science-red"
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
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress indicators (one per slide position) */}
      <div className="mt-4 flex items-center gap-2">
        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setStopped(true)
              setIndex(i)
            }}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            // A 4px-tall bar is impossible to hit with a thumb, so the target is
            // padded out to a finger's height while the mark itself stays thin.
            className="group flex-1 py-2.5"
          >
            <span
              className={`block h-1 transition-colors ${
                i === index ? 'bg-foreground' : 'bg-neutral-200 group-hover:bg-neutral-400'
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  )
}
