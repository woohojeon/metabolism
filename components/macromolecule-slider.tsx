'use client'

import { useEffect, useState } from 'react'
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

export function MacromoleculeSlider() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const visible = useVisibleCount()
  const count = categories.length
  const maxIndex = Math.max(0, count - visible)

  // Keep index in range when the visible count changes (resize).
  useEffect(() => {
    setIndex((prev) => Math.min(prev, maxIndex))
  }, [maxIndex])

  // Auto-advance one slide at a time; loop back to the start at the end.
  // Pauses on hover/focus and when there is nothing to scroll.
  useEffect(() => {
    if (paused || maxIndex === 0) return
    const id = setInterval(() => {
      setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
    }, 3000)
    return () => clearInterval(id)
  }, [paused, maxIndex])

  const go = (dir: number) => {
    setIndex((prev) => Math.min(Math.max(prev + dir, 0), maxIndex))
  }

  const totalPathways = categories.reduce((sum, c) => sum + c.pathways.length, 0)
  const cardBasis = 100 / visible
  const canPrev = index > 0
  const canNext = index < maxIndex

  return (
    <section
      className="mt-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
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
            <span className="text-foreground">{String(index + 1).padStart(2, '0')}</span> /{' '}
            {String(count).padStart(2, '0')}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={!canPrev}
              aria-label="Previous macromolecules"
              className="flex size-9 items-center justify-center border border-neutral-300 text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-neutral-300 disabled:hover:bg-transparent disabled:hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={!canNext}
              aria-label="Next macromolecules"
              className="flex size-9 items-center justify-center border border-neutral-300 text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-neutral-300 disabled:hover:bg-transparent disabled:hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * cardBasis}%)` }}
        >
          {categories.map((cat, ci) => (
            <div
              key={cat.slug}
              className="shrink-0 px-3 first:pl-0"
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
                    <CategoryLabel className="text-white/80">{cat.korean}</CategoryLabel>
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
                      <Link href={`/${cat.slug}/${p.slug}`} className="group block py-2.5">
                        <h4 className="text-[14px] font-bold leading-snug text-foreground transition-colors group-hover:text-science-red">
                          {p.name}
                        </h4>
                        <p className="mt-0.5 text-[11px] leading-snug text-neutral-500">
                          {p.location}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress indicators (one per slide position) */}
      <div className="mt-6 flex items-center gap-2">
        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            className={`h-1 flex-1 transition-colors ${
              i === index ? 'bg-foreground' : 'bg-neutral-200 hover:bg-neutral-400'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
