import { Suspense } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Board } from '@/components/board'

export const metadata = {
  title: '게시판 | The Metabolic Map',
  description: '공지사항, Q&A, 건의사항.',
}

export default function BoardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[880px] flex-1 px-4 py-8 lg:px-6">
        <nav className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
          <Link href="/" className="transition-colors hover:text-science-red">
            Home
          </Link>
          <span className="mx-2 text-neutral-300">/</span>
          <span className="text-foreground">Board</span>
        </nav>

        <div className="mt-6">
          {/* Which board is open comes from the query string, which a client
              component may only read inside a Suspense boundary. */}
          <Suspense fallback={<div className="h-64" />}>
            <Board />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
