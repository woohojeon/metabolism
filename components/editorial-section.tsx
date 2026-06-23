import Image from 'next/image'
import { Info } from 'lucide-react'
import { CategoryLabel, MetaDate } from './article-bits'
import { editorialQuote, firstRelease } from '@/lib/data'

function QuoteBlock() {
  return (
    <div className="bg-panel px-6 py-10 text-center sm:px-12">
      <div className="font-serif text-6xl leading-none text-science-red">&rdquo;</div>
      <blockquote className="mx-auto mt-2 max-w-2xl text-balance text-xl font-extrabold leading-snug text-foreground sm:text-2xl">
        {editorialQuote.quote}
      </blockquote>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-2">
        <CategoryLabel>{editorialQuote.category}</CategoryLabel>
        <span className="text-neutral-300">|</span>
        <MetaDate>{editorialQuote.date}</MetaDate>
        <span className="text-neutral-300">|</span>
        <MetaDate>{editorialQuote.byline}</MetaDate>
      </div>
    </div>
  )
}

function FirstRelease() {
  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 border-b-2 border-foreground pb-2">
        <h2 className="text-lg font-extrabold uppercase tracking-wide text-foreground">
          First Release
        </h2>
        <Info className="size-4 text-neutral-400" />
      </div>
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 pt-5 sm:grid-cols-3">
        {firstRelease.map((a) => (
          <a key={a.title} href="#" className="group block">
            <div className="flex flex-wrap items-center gap-x-2">
              <CategoryLabel>{a.category}</CategoryLabel>
              <span className="text-neutral-300">|</span>
              <MetaDate>{a.date}</MetaDate>
            </div>
            <h3 className="mt-1.5 text-[15px] font-bold leading-snug text-foreground transition-colors group-hover:text-science-red">
              {a.title}
            </h3>
          </a>
        ))}
      </div>
    </div>
  )
}

function CareersAd() {
  return (
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
        Advertisement
      </p>
      <div className="relative overflow-hidden bg-[#eaf3f7] px-6 py-10 text-center">
        <Image
          src="/images/careers-bg.png"
          alt=""
          fill
          aria-hidden
          className="object-cover opacity-60"
          sizes="320px"
        />
        <div className="relative">
          <p className="font-serif text-3xl leading-none text-science-red">Science</p>
          <p className="font-serif text-4xl font-bold leading-tight text-ink">Careers</p>
          <p className="mt-1 text-[10px] font-bold tracking-widest text-ink">
            AAAS
          </p>
          <p className="mt-8 text-2xl font-extrabold leading-tight text-[#1b7b8c]">
            Science jobs straight to your inbox!
          </p>
          <p className="mt-6 text-lg font-bold text-ink">Create a job alert today</p>
        </div>
      </div>
    </div>
  )
}

export function EditorialSection() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-8 lg:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-9">
          <QuoteBlock />
          <FirstRelease />
        </div>
        <aside className="lg:col-span-3">
          <CareersAd />
        </aside>
      </div>
    </section>
  )
}
