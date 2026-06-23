import Link from 'next/link'
import { Wordmark } from '@/components/wordmark'
import { categories } from '@/lib/pathways'

export function SiteFooter() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-[1180px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((cat) => (
            <div key={cat.slug}>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
                <Link href={`/${cat.slug}`} className="transition-colors hover:text-science-red">
                  {cat.name}
                </Link>
              </h3>
              <ul className="flex flex-col gap-2.5">
                {cat.pathways.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/${cat.slug}/${p.slug}`}
                      className="text-[13px] leading-snug text-white/70 transition-colors hover:text-white"
                    >
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">Course</h3>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link href="/instructor" className="text-[13px] leading-snug text-white/70 transition-colors hover:text-white">
                  Instructor
                </Link>
              </li>
              <li>
                <Link href="/#map" className="text-[13px] leading-snug text-white/70 transition-colors hover:text-white">
                  The Metabolic Map
                </Link>
              </li>
              <li>
                <a href="mailto:jwsseol@jbnu.ac.kr" className="text-[13px] leading-snug text-white/70 transition-colors hover:text-white">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-white/15 pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="font-serif text-3xl leading-none text-white">
              <Wordmark />
            </span>
            <span className="text-xs uppercase tracking-wider text-white/50">
              Veterinary Biochemistry · Metabolic Map
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/60">
            <span>College of Veterinary Medicine</span>
            <span>Jeonbuk National University</span>
            <span>{'© 2026 J. Seol. Educational use.'}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
