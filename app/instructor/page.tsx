import Image from 'next/image'
import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CategoryLabel } from '@/components/article-bits'
import { instructor } from '@/lib/instructor'

export const metadata = {
  title: 'Instructor | The Metabolic Map',
  description: `${instructor.name} · ${instructor.department}, ${instructor.college}`,
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t-2 border-foreground pt-3">
      <h2 className="text-lg font-extrabold uppercase tracking-wide">{children}</h2>
    </div>
  )
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

        {/* Header */}
        <header className="mt-6 grid grid-cols-1 gap-8 border-b border-neutral-200 pb-10 sm:grid-cols-[200px_1fr]">
          <div className="mx-auto sm:mx-0">
            <div className="relative aspect-square w-[180px] overflow-hidden rounded-full border-4 border-panel shadow-md">
              <Image
                src={instructor.image}
                alt={instructor.koreanName}
                fill
                priority
                className="object-cover"
                sizes="180px"
              />
            </div>
          </div>
          <div>
            <CategoryLabel>Instructor · 담당 교수</CategoryLabel>
            <h1 className="mt-1 text-4xl font-extrabold leading-tight text-foreground sm:text-5xl">
              {instructor.koreanName}{' '}
              <span className="text-2xl font-bold text-neutral-400 sm:text-3xl">
                {instructor.koreanTitle}
              </span>
            </h1>
            <p className="mt-1 text-lg font-semibold text-neutral-600">
              {instructor.name} · {instructor.title}
            </p>
            <p className="mt-2 text-[15px] text-neutral-700">
              {instructor.department} — {instructor.college}
            </p>
            <p className="mt-3 text-[14px] text-neutral-600">{instructor.degree}</p>

            {/* Contact */}
            <div className="mt-5 flex flex-col gap-2 text-[14px] text-neutral-700">
              <a
                href={`mailto:${instructor.email}`}
                className="flex items-center gap-2 transition-colors hover:text-science-red"
              >
                <Mail className="size-4 text-science-red" />
                {instructor.email}
              </a>
              <span className="flex items-center gap-2">
                <Phone className="size-4 text-science-red" />
                {instructor.phone}
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="size-4 text-science-red" />
                {instructor.office}
              </span>
            </div>
          </div>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            {/* Research */}
            <section>
              <SectionHeading>Research Interests</SectionHeading>
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {instructor.research.map((r) => (
                  <li
                    key={r}
                    className="flex gap-3 bg-panel p-4 text-[14px] leading-snug text-neutral-700"
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-science-red" />
                    {r}
                  </li>
                ))}
              </ul>
            </section>

            {/* Career */}
            <section className="mt-10">
              <SectionHeading>Career</SectionHeading>
              <ul className="mt-4">
                {instructor.career.map((c, i) => (
                  <li
                    key={i}
                    className={`grid grid-cols-1 gap-1 py-4 sm:grid-cols-[140px_1fr] sm:gap-6 ${i === 0 ? '' : 'border-t border-neutral-200'}`}
                  >
                    <span className="text-[12px] font-bold uppercase tracking-wider text-science-red">
                      {c.period}
                    </span>
                    <span className="text-[15px] leading-snug text-neutral-700">{c.role}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Publications */}
            <section className="mt-10">
              <SectionHeading>Selected Publications</SectionHeading>
              <ul className="mt-4">
                {instructor.publications.map((p, i) => (
                  <li
                    key={i}
                    className={`py-4 ${i === 0 ? '' : 'border-t border-neutral-200'}`}
                  >
                    <h3 className="text-[15px] font-bold leading-snug text-foreground">
                      {p.title}
                    </h3>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[12px] uppercase tracking-wide">
                      <span className="font-bold text-science-red">{p.journal}</span>
                      <span className="text-neutral-300">|</span>
                      <span className="text-neutral-500">{p.year}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-20 space-y-6">
              <div className="bg-panel p-5">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Courses Taught
                </h3>
                <ul className="mt-3 space-y-2">
                  {instructor.courses.map((course) => (
                    <li
                      key={course}
                      className="text-[14px] font-semibold leading-snug text-foreground"
                    >
                      {course}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-l-4 border-science-red bg-panel p-5">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-science-red">
                  About this site
                </h3>
                <p className="mt-2 text-[14px] leading-snug text-neutral-700">
                  This metabolic map accompanies Veterinary Biochemistry, walking through the
                  pathways of carbohydrate, lipid, protein, and nucleic acid metabolism.
                </p>
                <Link
                  href="/#map"
                  className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-science-red transition-colors hover:text-foreground"
                >
                  Open the Map →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
