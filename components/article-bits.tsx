import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CategoryLabel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'text-[10px] font-bold uppercase tracking-wider text-science-red',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function MetaDate({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'text-[10px] font-bold uppercase tracking-wider text-neutral-500',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Byline({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p
      className={cn(
        'text-[10px] font-semibold uppercase tracking-wide text-neutral-500',
        className,
      )}
    >
      {children}
    </p>
  )
}

export function ArrowLink({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <a
      href="#"
      className={cn(
        'group inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-science-red transition-colors hover:text-foreground',
        className,
      )}
    >
      {children}
      <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
    </a>
  )
}
