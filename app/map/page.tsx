import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { MapSvgView } from '@/components/map-svg-view'

export const metadata = {
  title: 'Metabolic Pathway Map | Veterinary Biochemistry',
  description: 'The full metabolic map — every pathway in one interconnected network.',
}

export default function MapPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6">
        {/* Breadcrumb */}
        <nav className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
          <Link href="/" className="transition-colors hover:text-science-red">
            Home
          </Link>
          <span className="mx-2 text-neutral-300">/</span>
          <span className="text-foreground">Metabolic Pathway Map</span>
        </nav>

        <div className="mt-3 border-t-2 border-foreground pt-3">
          <h1 className="text-2xl font-extrabold leading-tight text-foreground sm:text-3xl">
            Metabolic Pathway Map
            <span className="ml-2 text-[13px] font-semibold uppercase tracking-wider text-neutral-400">
              Veterinary Biochemistry
            </span>
          </h1>
        </div>

        <div className="mt-5">
          <MapSvgView />
        </div>
      </main>
    </div>
  )
}
