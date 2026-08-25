import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CategoryFigures } from '@/components/category-figures'
import { categories, getCategory } from '@/lib/pathways'
import { loadContentCached } from '@/lib/site-content-server'

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }))
}

// CDN-served with a one-minute background refresh (ISR), like the pathway
// pages. The gallery below is read on the server within the same window, so the
// page no longer ships the figures that shipped in the source and then has the
// client fetch replace them — a whole gallery appearing, changing or vanishing
// after the first paint.
export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category: slug } = await params
  const category = getCategory(slug)
  if (!category) return {}
  return {
    title: `${category.name} Metabolism | The Metabolic Map`,
    description: category.tagline,
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category: slug } = await params
  const category = getCategory(slug)
  if (!category) notFound()

  // Whatever the administrator last saved for this gallery. An empty list is a
  // real answer — it means every figure was removed — so fall back to the
  // published set only when nothing has been saved at all.
  const savedFigures = await loadContentCached<string[]>(
    `metabolism-cat-figures:${category.slug}`,
    60,
  )
  const figures = savedFigures ?? category.figures ?? []

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative">
          {/* 21:9 leaves about 160px of height on a phone — less than the
              title and tagline laid over it need. The crop stays wide only
              where the width is there to pay for it. */}
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink sm:aspect-[21/9]">
            <Image
              src={category.image}
              alt={category.name}
              fill
              priority
              className="object-cover opacity-90"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
            <div className="absolute inset-x-0 bottom-0">
              <div className="mx-auto max-w-[1280px] px-4 pb-6 sm:pb-8 lg:px-6">
                <h1 className="mt-1 text-3xl font-extrabold leading-tight text-white sm:text-6xl">
                  {category.name}
                </h1>
                <p className="mt-2 max-w-2xl text-[15px] leading-snug text-white/85">
                  {category.tagline}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1280px] px-4 py-10 lg:px-6">
          {/* Breadcrumb */}
          <nav className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            <Link href="/" className="transition-colors hover:text-science-red">
              Home
            </Link>
            <span className="mx-2 text-neutral-300">/</span>
            <span className="text-foreground">{category.name}</span>
          </nav>

          {/* Intro figure + pathway index (the labelled "Overview" write-up
              was removed — it carried no content). */}
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
            {category.figure && (
              <div className="lg:col-span-8">
                <figure className="overflow-hidden rounded border border-neutral-200 bg-white">
                  <Image
                    src={category.figure}
                    alt={`${category.name} illustration`}
                    width={1000}
                    height={750}
                    className="h-auto w-full"
                    sizes="(min-width: 1024px) 640px, 100vw"
                  />
                </figure>
              </div>
            )}
            <aside className="lg:col-span-4">
              <div className="bg-panel p-5">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Pathways in this section
                </h3>
                <p className="mt-2 font-serif text-5xl leading-none text-science-red">
                  {category.pathways.length}
                </p>
                <ul className="mt-4 space-y-1">
                  {category.pathways.map((p) => (
                    <li key={p.slug}>
                      <a
                        href={`#${p.slug}`}
                        className="text-[13px] font-semibold text-neutral-700 transition-colors hover:text-science-red"
                      >
                        {p.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>

          {/* Pathway list */}
          <section className="mt-12">
            <div className="border-t-2 border-foreground pt-3">
              <h2 className="text-lg font-extrabold uppercase tracking-wide">
                The Pathways
              </h2>
            </div>
            <ul className="mt-6">
              {category.pathways.map((p, i) => (
                <li
                  id={p.slug}
                  key={p.slug}
                  className={`scroll-mt-20 ${i === 0 ? '' : 'border-t border-neutral-200'}`}
                >
                  <Link
                    href={`/${category.slug}/${p.slug}`}
                    className="group grid grid-cols-1 gap-2 py-6 sm:grid-cols-[3rem_1fr] sm:gap-6"
                  >
                    <span className="font-serif text-3xl leading-none text-neutral-300 transition-colors group-hover:text-science-red">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="text-xl font-extrabold leading-snug text-foreground transition-colors group-hover:text-science-red">
                        {p.name}
                      </h3>
                      <p className="mt-1 font-mono text-[12px] text-neutral-500">
                        {p.equation}
                      </p>
                      <p className="mt-2 max-w-3xl text-[14px] leading-snug text-neutral-700">
                        {p.summary}
                      </p>
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        {p.location}
                      </p>
                    </div>
                  </Link>
                  {p.children.length > 0 && (
                    <ul className="mb-6 flex flex-wrap gap-2 sm:ml-[3.75rem]">
                      {p.children.map((child) => (
                        <li key={child.slug}>
                          <Link
                            href={`/${category.slug}/${p.slug}/${child.slug}`}
                            className="inline-block rounded-full border border-neutral-300 px-3 py-1 text-[12px] font-semibold text-neutral-600 transition-colors hover:border-science-red hover:text-science-red"
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* Supplementary figure gallery (from Figures_upload.pptx). */}
          <CategoryFigures
            categorySlug={category.slug}
            categoryName={category.name}
            published={figures}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
