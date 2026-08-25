import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { EditableInstructor } from '@/components/editable-instructor'
import { instructor, publishedProfile } from '@/lib/instructor'
import { INSTRUCTOR_KEY, type InstructorProfile } from '@/lib/edits'
import { loadContentServer } from '@/lib/site-content-server'

export const metadata = {
  title: 'Instructor | The Metabolic Map',
  description: `${instructor.name} · ${instructor.department}, ${instructor.college}`,
}

// Render on demand rather than at build time, the same way the home page does.
// Prerendered, this page was frozen at the profile that shipped in the source,
// and the client fetch then swapped the administrator's saved copy over it —
// the visible flicker of one profile turning into another on every load.
export const dynamic = 'force-dynamic'

export default async function InstructorPage() {
  // Read the saved profile before rendering, so the page is sent already
  // holding it. Merged over the published copy so a partial save, or none at
  // all, still fills every line.
  const saved = await loadContentServer<Partial<InstructorProfile>>(INSTRUCTOR_KEY)
  const profile = { ...publishedProfile, ...saved }

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
          <span className="text-foreground">Instructor</span>
        </nav>

        <EditableInstructor published={profile} image={instructor.image} />
      </main>
      <SiteFooter />
    </div>
  )
}
