import Image from 'next/image'
import { CategoryLabel, MetaDate, Byline, ArrowLink } from './article-bits'
import { Wordmark } from './wordmark'
import { heroArticle, heroCards, heroMiddle, latestNews } from '@/lib/data'

function HeroCard() {
  return (
    <a href="#" className="group block">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink">
        <Image
          src={heroArticle.image || '/placeholder.svg'}
          alt={heroArticle.title}
          fill
          priority
          className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-[1.02]"
          sizes="(min-width: 1024px) 640px, 100vw"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-5 pt-16">
          <div className="flex items-center gap-2">
            <CategoryLabel>{heroArticle.category}</CategoryLabel>
            <span className="text-white/40">|</span>
            <MetaDate className="text-white/70">{heroArticle.date}</MetaDate>
          </div>
          <h2 className="mt-2 max-w-2xl text-balance text-xl font-extrabold leading-tight text-white sm:text-2xl">
            {heroArticle.title}
          </h2>
          <Byline className="mt-2 text-white/70">{heroArticle.byline}</Byline>
          <p className="mt-2 max-w-2xl text-[13px] leading-snug text-white/85">
            {heroArticle.summary}
          </p>
        </div>
      </div>
    </a>
  )
}

function HeroSubCards() {
  return (
    <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-3">
      {heroCards.map((a, i) => (
        <a
          key={a.title}
          href="#"
          className={`group block pt-3 ${i === 0 ? 'border-t-2 border-foreground' : 'border-t-2 border-foreground sm:border-l sm:border-t-2 sm:border-l-neutral-200 sm:pl-5'}`}
        >
          <div className="flex flex-wrap items-center gap-x-2">
            <CategoryLabel>{a.category}</CategoryLabel>
          </div>
          <MetaDate className="mt-1 block">{a.date}</MetaDate>
          <h3 className="mt-1.5 text-[15px] font-bold leading-snug text-foreground transition-colors group-hover:text-science-red">
            {a.title}
          </h3>
          <Byline className="mt-2 normal-case tracking-normal">{a.byline}</Byline>
        </a>
      ))}
    </div>
  )
}

function MiddleColumn() {
  return (
    <div className="flex flex-col gap-6">
      {heroMiddle.map((a, i) => (
        <a
          key={a.title}
          href="#"
          className={`group block ${i > 0 ? 'border-t border-neutral-200 pt-6' : ''}`}
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
            <Image
              src={a.image || '/placeholder.svg'}
              alt={a.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(min-width: 1024px) 200px, 100vw"
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2">
            <CategoryLabel>{a.category}</CategoryLabel>
            <span className="text-neutral-300">|</span>
            <MetaDate>{a.date}</MetaDate>
          </div>
          <h3 className="mt-1 text-[15px] font-bold leading-snug text-foreground transition-colors group-hover:text-science-red">
            {a.title}
          </h3>
          <Byline className="mt-1.5 normal-case tracking-normal">{a.byline}</Byline>
        </a>
      ))}
    </div>
  )
}

function LatestNews() {
  return (
    <div>
      <h2 className="mb-3 text-lg font-extrabold uppercase tracking-wide text-foreground">
        Latest News
      </h2>
      <ul className="flex flex-col gap-2">
        {latestNews.map((n) => (
          <li key={n.title}>
            <a
              href="#"
              className="group block bg-panel px-3 py-3 transition-colors hover:bg-neutral-200"
            >
              <MetaDate>{n.date}</MetaDate>
              <p className="mt-1 text-[13px] font-bold leading-snug text-foreground transition-colors group-hover:text-science-red">
                {n.title}
              </p>
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-end">
        <ArrowLink>More News</ArrowLink>
      </div>
    </div>
  )
}

export function FeaturedSection() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 pb-8 lg:px-6">
      {/* Centered masthead */}
      <div className="flex justify-center border-b border-neutral-200 py-6">
        <a href="#" aria-label="Science home">
          <Wordmark className="text-[44px] leading-none text-foreground sm:text-[52px]" />
        </a>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <HeroCard />
          <HeroSubCards />
        </div>
        <div className="lg:col-span-2">
          <MiddleColumn />
        </div>
        <div className="lg:col-span-3">
          <LatestNews />
        </div>
      </div>
    </section>
  )
}
