import Image from 'next/image'

export function PodcastBanner() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 pt-10 lg:px-6">
      <a
        href="#"
        className="group relative mx-auto flex h-[72px] w-full max-w-[540px] items-center justify-between overflow-hidden bg-[#0a1530] px-5"
      >
        <Image
          src="/images/podcast-banner.png"
          alt=""
          fill
          aria-hidden
          className="object-cover opacity-70"
          sizes="540px"
        />
        <div className="relative">
          <p className="font-serif text-xl leading-none text-white">Science</p>
          <p className="text-[9px] font-bold tracking-[0.3em] text-white/80">
            PODCAST
          </p>
        </div>
        <p className="relative hidden text-sm font-bold text-white sm:block">
          Science biographies
        </p>
        <span className="relative rounded-sm bg-science-red px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition-opacity group-hover:opacity-90">
          Listen Today
        </span>
      </a>
    </div>
  )
}
