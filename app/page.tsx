import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ArrowLink } from '@/components/article-bits'
import { HomeHero } from '@/components/home-hero'
import { InstructorTeaser } from '@/components/instructor-teaser'
import { MacromoleculeSlider } from '@/components/macromolecule-slider'
import { NewspaperDownload } from '@/components/newspaper-download'
import { Wordmark } from '@/components/wordmark'
import { instructor, publishedProfile } from '@/lib/instructor'

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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-[1280px] px-4 pb-16 lg:px-6">
        <Masthead />
        <NewspaperDownload published={publishedNewspaper} />
        <HomeHero published={publishedHero} />
        <MacromoleculeSlider />
        <InstructorTeaser published={publishedProfile} image={instructor.image} />
        <div className="mt-10 flex justify-end">
          <ArrowLink>Start with Carbohydrate Metabolism</ArrowLink>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
