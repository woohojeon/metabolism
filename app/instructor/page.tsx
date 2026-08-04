import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { EditableInstructor } from '@/components/editable-instructor'
import { instructor, publishedProfile } from '@/lib/instructor'

export const metadata = {
  title: 'Instructor | The Metabolic Map',
  description: `${instructor.name} · ${instructor.department}, ${instructor.college}`,
}

export default function InstructorPage() {
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

        <EditableInstructor published={publishedProfile} image={instructor.image} />
      </main>
      <SiteFooter />
    </div>
  )
}
