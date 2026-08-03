import Image from 'next/image'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CategoryLabel, ArrowLink } from '@/components/article-bits'
import { HomeHero } from '@/components/home-hero'
import { MacromoleculeSlider } from '@/components/macromolecule-slider'
import { NewspaperDownload } from '@/components/newspaper-download'
import { Wordmark } from '@/components/wordmark'
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

// The published hero copy and picture. The administrator can edit all three in
// place; components/home-hero.tsx loads whatever was saved over these.
const publishedHero = {
  title: '대사 지도: 세포는 물질과 에너지를 어떻게 바꾸는가',
  standfirst:
    '몸속에서 일어나는 모든 반응은 서로 맞물려 하나의 거대한 네트워크를 이룹니다. ' +
    '탄수화물, 지질, 단백질, 핵산 네 갈래의 분자를 따라 그 네트워크를 훑으며, ' +
    '이들을 만들고 저장하고 분해하는 대사 경로를 다룹니다.',
  image: '/images/chemistry.jpg',
}

// The newspaper download card's defaults. The administrator (jbnu) can edit the
// title and replace the PDF in place; components/newspaper-download.tsx loads
// whatever was saved over these.
const publishedNewspaper = {
  title: '수의생화학신문 (2026년)',
  pdf: '/downloads/vet-biochem-news-2026.pdf',
}

function InstructorTeaser() {
  return (
    <section className="mt-16 bg-panel px-6 py-10 sm:px-12">
      <div className="grid grid-cols-1 items-center gap-8 sm:grid-cols-[160px_1fr]">
        <div className="mx-auto sm:mx-0">
          <div className="relative aspect-square w-[140px] overflow-hidden rounded-full border-4 border-white shadow-md">
            <Image
              src={instructor.image}
              alt={instructor.name}
              fill
              className="object-cover"
              sizes="140px"
            />
          </div>
        </div>
        <div>
          <CategoryLabel>Instructor</CategoryLabel>
          <h2 className="mt-1 text-2xl font-extrabold leading-tight text-foreground">
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
        <NewspaperDownload published={publishedNewspaper} />
        <HomeHero published={publishedHero} />
        <MacromoleculeSlider />
        <InstructorTeaser />
        <div className="mt-10 flex justify-end">
          <ArrowLink>Start with Carbohydrate Metabolism</ArrowLink>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
