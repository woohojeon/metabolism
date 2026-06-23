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
          <CategoryLabel>Metabolic Map · Overview</CategoryLabel>
          <h1 className="mt-2 max-w-4xl text-balance text-4xl font-extrabold leading-tight text-foreground sm:text-5xl">
            The Metabolic Map
          </h1>
          <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-neutral-700">
            Every reaction inside the cell is wired into one vast network. See at a glance how the
            four branches of metabolism — carbohydrate, lipid, protein, and nucleic acid — meet and
            diverge across the full map.
          </p>
        </header>

        {/* Full map */}
        <section className="mt-8">
          <a
            href="/images/pathway.png"
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
            title="Click to open the full-size image"
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
            Click the image to view it at full, high resolution in a new tab.
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
              { slug: 'carbohydrate', name: 'Carbohydrate' },
              { slug: 'lipid', name: 'Lipid' },
              { slug: 'protein', name: 'Protein' },
              { slug: 'nucleic-acid', name: 'Nucleic acid' },
            ].map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="group border border-neutral-200 p-4 transition-colors hover:border-science-red"
              >
                <p className="text-[15px] font-extrabold text-foreground transition-colors group-hover:text-science-red">
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
