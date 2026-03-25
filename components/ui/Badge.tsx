import { cn } from '@/lib/utils'

const variants = {
  default: 'bg-green/10 text-green border-green/20',
  warning: 'bg-yellow/10 text-yellow border-yellow/20',
  error: 'bg-red/10 text-red border-red/20',
  muted: 'bg-bg3 text-muted border-border',
}

interface BadgeProps {
  variant?: keyof typeof variants
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
