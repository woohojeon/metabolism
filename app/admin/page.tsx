import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AdminStudents } from '@/components/admin-students'

export const metadata = {
  title: 'Student Accounts | The Metabolic Map',
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-[1280px] px-4 py-8 lg:px-6">
        <nav className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
          <Link href="/" className="transition-colors hover:text-science-red">
            Home
          </Link>
          <span className="mx-2 text-neutral-300">/</span>
          <span className="text-foreground">Admin</span>
        </nav>

        <div className="mt-6">
          <AdminStudents />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
