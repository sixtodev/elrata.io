'use client'

import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'

const variants = {
  primary:
    'bg-green text-black font-bold hover:bg-green-dim shadow-none hover:shadow-[0_0_20px_rgba(196,239,22,0.15)] hover:-translate-y-0.5 active:translate-y-0',
  secondary:
    'bg-transparent text-muted border border-border hover:text-foreground hover:border-[#444]',
  ghost: 'bg-transparent text-muted hover:text-foreground hover:bg-bg3',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-3 text-base rounded-xl',
  lg: 'px-9 py-4 text-lg rounded-xl',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-sans transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
