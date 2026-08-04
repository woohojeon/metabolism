'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CategoryLabel } from '@/components/article-bits'
import { loadInstructorProfile, type InstructorProfile } from '@/lib/edits'

// The home page's instructor card. It reads the same saved document the
// instructor page is edited into (lib/edits.ts), so a name or a department
// corrected there is corrected here too rather than the two pages disagreeing.
// Editing itself stays on the instructor page — this is only the shop window.
export function InstructorTeaser({
  published,
  image,
}: {
  published: InstructorProfile
  image: string
}) {
  const [profile, setProfile] = useState<InstructorProfile>(published)

  useEffect(() => {
    let stale = false
    loadInstructorProfile().then((saved) => {
      if (!stale && saved) setProfile({ ...published, ...saved })
    })
    return () => {
      stale = true
    }
  }, [published])

  return (
    <section className="mt-16 bg-panel px-6 py-10 sm:px-12">
      <div className="grid grid-cols-1 items-center gap-8 sm:grid-cols-[160px_1fr]">
        <div className="mx-auto sm:mx-0">
          <div className="relative aspect-square w-[140px] overflow-hidden rounded-full border-4 border-white shadow-md">
            <Image
              src={image}
              alt={profile.name}
              fill
              className="object-cover"
              sizes="140px"
            />
          </div>
        </div>
        <div>
          <CategoryLabel>Instructor</CategoryLabel>
          <h2 className="mt-1 text-2xl font-extrabold leading-tight text-foreground">
            {profile.name}
          </h2>
          <p className="mt-1 text-[13px] font-semibold text-neutral-600">
            {profile.title} · {profile.department}
          </p>
          <p className="mt-3 max-w-2xl text-[14px] leading-snug text-neutral-700">
            {profile.college}. Teaching Veterinary Biochemistry 1 / 2 and the accompanying
            laboratory courses, with research spanning companion-animal anticancer agents,
            dermatitis therapeutics, and veterinary diagnostics.
          </p>
          <div className="mt-4">
            <Link
              href="/instructor"
              className="group inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-science-red transition-colors hover:text-foreground"
            >
              Meet the Instructor
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
