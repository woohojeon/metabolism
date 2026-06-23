import Image from 'next/image'
import { Info, ChevronRight } from 'lucide-react'
import { customPublishing } from '@/lib/data'

function Tags({ secondary }: { secondary: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="bg-science-red px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
        Sponsored
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
        {secondary}
      </span>
    </div>
  )
}

export function CustomPublishing() {
  return (
    <section className="bg-ink py-12 text-white">
      <div className="mx-auto max-w-[1280px] px-4 lg:px-6">
        <div className="flex items-center gap-2 border-b-2 border-white/80 pb-2">
          <h2 className="text-lg font-extrabold uppercase tracking-wide">
            Custom Publishing
          </h2>
          <Info className="size-4 text-white/50" />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6">
          {customPublishing.map((c) =>
            c.large ? (
              <a
                key={c.title}
                href="#"
                className="group relative block sm:col-span-2 lg:col-span-2"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={c.image || '/placeholder.svg'}
                    alt={c.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(min-width: 1024px) 420px, 100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <Tags secondary={c.tag} />
                    <h3 className="mt-2 max-w-[16ch] text-balance text-xl font-extrabold leading-tight text-white">
                      {c.title}
                    </h3>
                  </div>
                </div>
              </a>
            ) : (
              <a key={c.title} href="#" className="group block">
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={c.image || '/placeholder.svg'}
                    alt={c.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(min-width: 1024px) 200px, 50vw"
                  />
                </div>
                <div className="mt-2">
                  <Tags secondary={c.tag} />
                  <h3 className="mt-2 text-[14px] font-bold leading-snug text-white transition-colors group-hover:text-science-red">
                    {c.title}
                  </h3>
                </div>
              </a>
            ),
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <a
            href="#"
            className="group inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:text-science-red"
          >
            View More
            <ChevronRight className="size-4 text-science-red transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </section>
  )
}
