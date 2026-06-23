'use client'

import { useState } from 'react'
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

export function MacromoleculeSlider() {
  const [index, setIndex] = useState(0)
  const count = categories.length

  const go = (dir: number) => {
    setIndex((prev) => (prev + dir + count) % count)
  }

  const totalPathways = categories.reduce((sum, c) => sum + c.pathways.length, 0)

  return (
    <section className="mt-12">
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
              aria-label="Previous macromolecule"
              className="flex size-9 items-center justify-center border border-neutral-300 text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next macromolecule"
              className="flex size-9 items-center justify-center border border-neutral-300 text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {categories.map((cat, ci) => (
            <div key={cat.slug} className="w-full shrink-0">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
                {/* Category card */}
                <Link href={`/${cat.slug}`} className="group block">
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
                    <Image
                      src={coverImage(cat, ci)}
                      alt={cat.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      sizes="(min-width: 1024px) 360px, 100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <CategoryLabel className="text-white/80">{cat.korean}</CategoryLabel>
                      <h3 className="mt-1 text-xl font-extrabold leading-tight text-white">
                        {cat.name}
                      </h3>
                      <p className="mt-1 text-[12px] leading-snug text-white/80">
                        {cat.tagline}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    {cat.pathways.length} Pathways
                    <span className="text-science-red transition-colors group-hover:text-foreground">
                      Explore →
                    </span>
                  </p>
                </Link>

                {/* Pathway list */}
                <div>
                  <Link
                    href={`/${cat.slug}`}
                    className="group flex items-baseline gap-2 border-b-2 border-foreground pb-2"
                  >
                    <h3 className="text-[15px] font-extrabold uppercase tracking-wide text-foreground transition-colors group-hover:text-science-red">
                      {cat.name}
                    </h3>
                    <span className="text-[11px] text-neutral-400">{cat.korean}</span>
                  </Link>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-8">
                    {cat.pathways.map((p, i) => (
                      <li
                        key={p.slug}
                        className={i === 0 ? '' : 'border-t border-neutral-200 sm:border-t-0'}
                      >
                        <Link href={`/${cat.slug}/${p.slug}`} className="group block py-3">
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
            </div>
          ))}
        </div>
      </div>

      {/* Progress indicators */}
      <div className="mt-6 flex items-center gap-2">
        {categories.map((cat, i) => (
          <button
            key={cat.slug}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to ${cat.name}`}
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
