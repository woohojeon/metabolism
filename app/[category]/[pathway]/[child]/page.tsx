import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { EditablePathway } from '@/components/editable-pathway'
import { categories, getChild } from '@/lib/pathways'

export function generateStaticParams() {
  return categories.flatMap((c) =>
    c.pathways.flatMap((p) =>
      p.children.map((ch) => ({
        category: c.slug,
        pathway: p.slug,
        child: ch.slug,
      })),
    ),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; pathway: string; child: string }>
}) {
  const { category, pathway, child } = await params
  const result = getChild(category, pathway, child)
  if (!result) return {}
  return {
    title: `${result.child.name} | The Metabolic Map`,
    description: result.child.summary,
  }
}

export default async function ChildPage({
  params,
}: {
  params: Promise<{ category: string; pathway: string; child: string }>
}) {
  const { category: catSlug, pathway: pathSlug, child: childSlug } = await params
  const result = getChild(catSlug, pathSlug, childSlug)
  if (!result) notFound()
  const { category, pathway, child } = result

  const index = pathway.children.findIndex((c) => c.slug === child.slug)
  const prev = pathway.children[index - 1]
  const next = pathway.children[index + 1]

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
          <Link
            href={`/${category.slug}/${pathway.slug}`}
            className="transition-colors hover:text-science-red"
          >
            {pathway.name}
          </Link>
          <span className="mx-2 text-neutral-300">/</span>
          <span className="text-foreground">{child.name}</span>
        </nav>

        {/* Editable article body */}
        <EditablePathway category={category} pathway={child} />

        {/* Prev / Next within sibling sub-topics */}
        <nav className="mt-12 grid grid-cols-2 gap-4 border-t border-neutral-200 pt-6">
          <div>
            {prev && (
              <Link
                href={`/${category.slug}/${pathway.slug}/${prev.slug}`}
                className="group block"
              >
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
              <Link
                href={`/${category.slug}/${pathway.slug}/${next.slug}`}
                className="group block"
              >
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
