import Image from 'next/image'
import { Info, ChevronRight } from 'lucide-react'
import { MetaDate, Byline } from './article-bits'
import { careersArticles, newsFeatures } from '@/lib/data'

function CareersColumn() {
  return (
    <div className="bg-ink p-6 text-white">
      <h2 className="border-b-2 border-white/80 pb-2 text-xl font-extrabold uppercase tracking-wide">
        Careers
      </h2>
      <ul className="mt-4">
        {careersArticles.map((a, i) => (
          <li
            key={a.title}
            className={i === 0 ? 'py-4' : 'border-t border-white/15 py-4'}
          >
            <a href="#" className="group flex items-start gap-4">
              <div className="relative aspect-square w-[100px] shrink-0 overflow-hidden">
                <Image
                  src={a.image || '/placeholder.svg'}
                  alt={a.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  sizes="100px"
                />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2">
                  <MetaDate className="text-science-red">{a.date}</MetaDate>
                  <span className="text-white/30">|</span>
                  <Byline className="text-white/60">{a.byline}</Byline>
                </div>
                <h3 className="mt-1 text-[14px] font-bold leading-snug text-white transition-colors group-hover:text-science-red">
                  {a.title}
                </h3>
              </div>
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex justify-end">
        <a
          href="#"
          className="group inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:text-science-red"
        >
          View More
          <ChevronRight className="size-4 text-science-red transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
    </div>
  )
}

function NewsFeaturesColumn() {
  return (
    <div>
      <div className="flex items-center gap-2 border-b-2 border-foreground pb-2">
        <h2 className="text-xl font-extrabold uppercase tracking-wide text-foreground">
          News Features
        </h2>
        <Info className="size-4 text-neutral-400" />
      </div>
      <ul>
        {newsFeatures.map((a, i) => (
          <li
            key={a.title}
            className={i === 0 ? 'py-5' : 'border-t border-neutral-200 py-5'}
          >
            <a href="#" className="group flex flex-col gap-4 sm:flex-row">
              <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden bg-neutral-100 sm:w-[210px]">
                <Image
                  src={a.image || '/placeholder.svg'}
                  alt={a.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(min-width: 640px) 210px, 100vw"
                />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2">
                  <MetaDate>{a.date}</MetaDate>
                  <span className="text-neutral-300">|</span>
                  <Byline className="normal-case tracking-normal">{a.byline}</Byline>
                </div>
                <h3 className="mt-1 text-[17px] font-bold leading-snug text-foreground transition-colors group-hover:text-science-red">
                  {a.title}
                </h3>
                <p className="mt-2 text-[13px] leading-snug text-neutral-600">
                  {a.summary}
                </p>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function CareersAndNews() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-10 lg:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[360px_1fr]">
        <CareersColumn />
        <NewsFeaturesColumn />
      </div>
    </section>
  )
}
