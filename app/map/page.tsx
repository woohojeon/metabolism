import Image from 'next/image'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CategoryLabel } from '@/components/article-bits'

export const metadata = {
  title: 'The Metabolic Map | Veterinary Biochemistry',
  description: 'The full metabolic map — every pathway in one interconnected network.',
}

export default function MapPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-[1280px] px-4 py-8 lg:px-6">
        {/* Breadcrumb */}
        <nav className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
          <Link href="/" className="transition-colors hover:text-science-red">
            Home
          </Link>
          <span className="mx-2 text-neutral-300">/</span>
          <span className="text-foreground">The Metabolic Map</span>
        </nav>

        <header className="mt-6 border-b border-neutral-200 pb-6">
          <CategoryLabel>대사 지도 · Overview</CategoryLabel>
          <h1 className="mt-2 max-w-4xl text-balance text-4xl font-extrabold leading-tight text-foreground sm:text-5xl">
            The Metabolic Map
          </h1>
          <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-neutral-700">
            세포 안의 모든 반응은 하나의 거대한 네트워크로 연결됩니다. 탄수화물·지질·단백질·핵산
            네 갈래의 대사 경로가 어떻게 서로 만나고 갈라지는지 전체 지도에서 한눈에 살펴보세요.
          </p>
        </header>

        {/* Full map */}
        <section className="mt-8">
          <a
            href="/images/pathway.png"
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
            title="클릭하면 원본 크기로 열립니다"
          >
            <div className="relative w-full overflow-hidden rounded-sm border border-neutral-200 bg-ink">
              <Image
                src="/images/pathway.png"
                alt="The full metabolic map"
                width={2400}
                height={1600}
                priority
                className="h-auto w-full object-contain transition-transform duration-500 group-hover:scale-[1.01]"
                sizes="(min-width: 1024px) 1280px, 100vw"
              />
            </div>
          </a>
          <p className="mt-3 text-center text-[12px] text-neutral-500">
            이미지를 클릭하면 새 탭에서 원본 크기(고해상도)로 볼 수 있습니다.
          </p>
        </section>

        {/* Jump to categories */}
        <section className="mt-12">
          <div className="border-t-2 border-foreground pt-3">
            <h2 className="text-lg font-extrabold uppercase tracking-wide">
              Explore the Map by Macromolecule
            </h2>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { slug: 'carbohydrate', name: 'Carbohydrate', korean: '탄수화물' },
              { slug: 'lipid', name: 'Lipid', korean: '지질' },
              { slug: 'protein', name: 'Protein', korean: '단백질' },
              { slug: 'nucleic-acid', name: 'Nucleic acid', korean: '핵산' },
            ].map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="group border border-neutral-200 p-4 transition-colors hover:border-science-red"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  {c.korean}
                </p>
                <p className="mt-1 text-[15px] font-extrabold text-foreground transition-colors group-hover:text-science-red">
                  {c.name}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
