import { cn } from '@/lib/utils'

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-serif leading-none tracking-tight', className)}>
      Veterinary Biochemistry
    </span>
  )
}
