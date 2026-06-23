import Image from 'next/image'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CategoryLabel, MetaDate, ArrowLink } from '@/components/article-bits'
import { Wordmark } from '@/components/wordmark'
import { categories } from '@/lib/pathways'
import { instructor } from '@/lib/instructor'

function Masthead() {
  return (
    <div className="flex flex-col items-center border-b border-neutral-200 py-8">
      <Link href="/" aria-label="Veterinary Biochemistry home">
        <Wordmark className="text-balance text-center text-[34px] leading-tight text-foreground sm:text-[48px]" />
      </Link>
      <p className="mt-3 text-[11px] uppercase tracking-wide text-neutral-500">
        The Metabolic Map <span className="mx-1 text-neutral-300">|</span> Vol. 1{' '}
        <span className="mx-1 text-neutral-300">|</span> 2026 Edition
      </p>
    </div>
  )
}

function HeroMap() {
  return (
    <section id="map" className="mt-8 scroll-mt-20">
      <Link href="/map" className="group block">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-ink">
          <Image
            src="/images/chemistry.jpg"
            alt="The metabolic map"
            fill
            priority
            className="object-cover opacity-95 transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="(min-width: 1024px) 1280px, 100vw"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-6 pt-24 sm:p-10">
            <div className="flex items-center gap-2">
              <CategoryLabel>Feature</CategoryLabel>
              <span className="text-white/40">|</span>
              <MetaDate className="text-white/70">Metabolism Overview</MetaDate>
            </div>
            <h1 className="mt-2 max-w-3xl text-balance text-2xl font-extrabold leading-tight text-white sm:text-4xl">
              The Metabolic Map: How Cells Transform Matter and Energy
            </h1>
            <p className="mt-3 max-w-2xl text-[13px] leading-snug text-white/85 sm:text-[15px]">
              Every reaction in the body connects into one vast, interlocking network. This
              course follows that network through four families of molecules — carbohydrate,
              lipid, protein, and nucleic acid — and the pathways that build, store, and break
              them down.
            </p>
          </div>
        </div>
      </Link>
    </section>
  )
}

function CategoryGrid() {
  return (
    <section className="mt-12">
      <div className="border-t-2 border-foreground pt-3">
        <h2 className="text-lg font-extrabold uppercase tracking-wide">
          Browse by Macromolecule
        </h2>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat) => (
          <Link key={cat.slug} href={`/${cat.slug}`} className="group block">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
              <Image
                src={cat.image}
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
                <p className="mt-1 text-[12px] leading-snug text-white/80">{cat.tagline}</p>
              </div>
            </div>
            <p className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              {cat.pathways.length} Pathways
              <span className="text-science-red transition-colors group-hover:text-foreground">
                Explore →
              </span>
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}

function PathwayIndex() {
  return (
    <section className="mt-14">
      <div className="border-t-2 border-foreground pt-3">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h2 className="text-lg font-extrabold uppercase tracking-wide">In This Issue</h2>
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">
            Table of Contents <span className="mx-1 text-neutral-300">|</span> 19 Metabolic
            Pathways
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat) => (
          <div key={cat.slug}>
            <Link
              href={`/${cat.slug}`}
              className="group flex items-baseline gap-2 border-b-2 border-foreground pb-2"
            >
              <h3 className="text-[15px] font-extrabold uppercase tracking-wide text-foreground transition-colors group-hover:text-science-red">
                {cat.name}
              </h3>
              <span className="text-[11px] text-neutral-400">{cat.korean}</span>
            </Link>
            <ul>
              {cat.pathways.map((p, i) => (
                <li key={p.slug} className={i === 0 ? '' : 'border-t border-neutral-200'}>
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
        ))}
      </div>
    </section>
  )
}

function InstructorTeaser() {
  return (
    <section className="mt-16 bg-panel px-6 py-10 sm:px-12">
      <div className="grid grid-cols-1 items-center gap-8 sm:grid-cols-[160px_1fr]">
        <div className="mx-auto sm:mx-0">
          <div className="relative aspect-square w-[140px] overflow-hidden rounded-full border-4 border-white shadow-md">
            <Image
              src={instructor.image}
              alt={instructor.koreanName}
              fill
              className="object-cover"
              sizes="140px"
            />
          </div>
        </div>
        <div>
          <CategoryLabel>Instructor</CategoryLabel>
          <h2 className="mt-1 text-2xl font-extrabold leading-tight text-foreground">
            {instructor.koreanName} <span className="text-neutral-400">·</span>{' '}
            {instructor.name}
          </h2>
          <p className="mt-1 text-[13px] font-semibold text-neutral-600">
            {instructor.title} · {instructor.department}
          </p>
          <p className="mt-3 max-w-2xl text-[14px] leading-snug text-neutral-700">
            {instructor.college}. Teaching Veterinary Biochemistry 1 / 2 and the accompanying
            laboratory courses, with research spanning companion-animal anticancer agents,
            dermatitis therapeutics, and veterinary diagnostics.
          </p>
          <div className="mt-4">
            <Link
              href="/instructor"
              className="group inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-science-red transition-colors hover:text-foreground"
            >
              Meet the Instructor
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-[1280px] px-4 pb-16 lg:px-6">
        <Masthead />
        <HeroMap />
        <CategoryGrid />
        <PathwayIndex />
        <InstructorTeaser />
        <div className="mt-10 flex justify-end">
          <ArrowLink>Start with Carbohydrate Metabolism</ArrowLink>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
