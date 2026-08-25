import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { EditablePathway } from '@/components/editable-pathway'
import { PathwayQuiz } from '@/components/pathway-quiz'
import { categories, getChild } from '@/lib/pathways'
import type { Pathway } from '@/lib/pathways'
import type { QuizQuestion } from '@/lib/pathway-quiz'
import { loadContentCached } from '@/lib/site-content-server'

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

// CDN-served with a one-minute background refresh (ISR) — see the parent
// pathway page.
export const revalidate = 60

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
  const { category, pathway } = result

  // Server-load the saved article so slides and other edits render in the first
  // paint instead of flashing in on the client. EditablePathway keys a child's
  // edit by category + child slug, so match that here.
  // The quiz is its own document, read here for the same reason: rendered on
  // the client alone it showed the seed questions (or an empty gap) before the
  // saved ones arrived.
  const quizKey = `${category.slug}/${pathway.slug}/${childSlug}`
  // The order the quiz deals its opening hand in. Chosen here so the server and
  // the browser agree on it — the block used to shuffle on the client alone,
  // which meant the HTML carried no question and the reader watched an empty
  // panel turn into one. It is as old as this page's cache entry; a reader who
  // wants a fresh order retries, which re-shuffles for real.
  const shuffleSeed = Math.floor(Math.random() * 2 ** 31)
  const [saved, savedQuiz] = await Promise.all([
    loadContentCached<Pathway>(`metabolism-edit:${category.slug}/${childSlug}`, 60),
    loadContentCached<QuizQuestion[]>(`metabolism-quiz:${quizKey}`, 60),
  ])
  const child = saved ? { ...result.child, ...saved } : result.child

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

        {/* Self-check quiz, on the same 12-column grid the article uses so it
            lines up with the body column rather than the full page width. */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <PathwayQuiz path={quizKey} published={savedQuiz} shuffleSeed={shuffleSeed} />
          </div>
        </div>

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
