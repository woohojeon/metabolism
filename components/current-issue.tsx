import Image from 'next/image'
import { CategoryLabel, Byline, ArrowLink } from './article-bits'
import { issueArticles, journalCovers } from '@/lib/data'

export function CurrentIssue() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6">
      {/* Section header */}
      <div className="border-t-2 border-foreground pt-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-lg font-extrabold uppercase tracking-wide">Science</h2>
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">
            Volume 392 <span className="mx-1 text-neutral-300">|</span> Issue 6804{' '}
            <span className="mx-1 text-neutral-300">|</span> June 2026
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-[210px_1fr]">
        {/* Cover */}
        <div className="flex flex-col items-center md:items-start">
          <div className="relative aspect-[3/4] w-[200px] overflow-hidden shadow-md">
            <Image
              src="/images/mag-cover.png"
              alt="Science cover — Brain Evolution"
              fill
              className="object-cover"
              sizes="200px"
            />
          </div>
          <button
            type="button"
            className="mt-4 rounded-full border border-neutral-300 px-5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-foreground"
          >
            View Cover
          </button>
        </div>

        {/* Article list */}
        <div>
          <ul>
            {issueArticles.map((a, i) => (
              <li
                key={a.title}
                className={i === 0 ? '' : 'border-t border-neutral-200'}
              >
                <a href="#" className="group block py-4">
                  <div className="flex flex-wrap items-center gap-x-2">
                    <CategoryLabel>{a.category}</CategoryLabel>
                    <span className="text-neutral-300">|</span>
                    <Byline className="normal-case tracking-normal">{a.byline}</Byline>
                  </div>
                  <h3 className="mt-1 text-[15px] font-bold leading-snug text-foreground transition-colors group-hover:text-science-red">
                    {a.title}
                  </h3>
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-end border-t border-neutral-200 pt-4">
            <ArrowLink>View Table of Contents</ArrowLink>
          </div>
        </div>
      </div>

      {/* Journal covers row */}
      <div className="mt-10 flex flex-wrap items-start justify-center gap-5">
        {journalCovers.map((j) => (
          <a key={j.name} href="#" className="group flex flex-col items-center">
            <div className="relative aspect-[3/4] w-[64px] overflow-hidden shadow-sm transition-transform group-hover:-translate-y-0.5 sm:w-[72px]">
              <Image
                src={j.image || '/placeholder.svg'}
                alt={`${j.name} cover`}
                fill
                className="object-cover"
                sizes="72px"
              />
            </div>
            <span
              className={`mt-2 h-[3px] w-10 ${j.active ? 'bg-science-red' : 'bg-transparent'}`}
            />
          </a>
        ))}
      </div>
    </section>
  )
}
