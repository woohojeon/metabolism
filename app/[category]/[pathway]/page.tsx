import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { EditablePathway } from '@/components/editable-pathway'
import { categories, getPathway } from '@/lib/pathways'

export function generateStaticParams() {
  return categories.flatMap((c) =>
    c.pathways.map((p) => ({ category: c.slug, pathway: p.slug })),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; pathway: string }>
}) {
  const { category, pathway } = await params
  const result = getPathway(category, pathway)
  if (!result) return {}
  return {
    title: `${result.pathway.name} | The Metabolic Map`,
    description: result.pathway.summary,
  }
}

export default async function PathwayPage({
  params,
}: {
  params: Promise<{ category: string; pathway: string }>
}) {
  const { category: catSlug, pathway: pathSlug } = await params
  const result = getPathway(catSlug, pathSlug)
  if (!result || !result.category) notFound()
  const { category, pathway } = result

  const index = category.pathways.findIndex((p) => p.slug === pathway.slug)
  const prev = category.pathways[index - 1]
  const next = category.pathways[index + 1]

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
          <Link href={`/${category.slug}`} className="transition-colors hover:text-science-red">
            {category.name}
          </Link>
          <span className="mx-2 text-neutral-300">/</span>
          <span className="text-foreground">{pathway.name}</span>
        </nav>

        {/* Editable article body */}
        <EditablePathway category={category} pathway={pathway} />

        {/* Prev / Next */}
        <nav className="mt-12 grid grid-cols-2 gap-4 border-t border-neutral-200 pt-6">
          <div>
            {prev && (
              <Link href={`/${category.slug}/${prev.slug}`} className="group block">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  ← Previous
                </p>
                <p className="mt-1 text-[15px] font-bold text-foreground transition-colors group-hover:text-science-red">
                  {prev.name}
                </p>
              </Link>
            )}
          </div>
          <div className="text-right">
            {next && (
              <Link href={`/${category.slug}/${next.slug}`} className="group block">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Next →
                </p>
                <p className="mt-1 text-[15px] font-bold text-foreground transition-colors group-hover:text-science-red">
                  {next.name}
                </p>
              </Link>
            )}
          </div>
        </nav>
      </main>
      <SiteFooter />
    </div>
  )
}
