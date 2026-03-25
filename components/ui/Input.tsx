'use client'

import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  ref?: React.Ref<HTMLInputElement>
}

export function Input({ label, error, className, id, ref, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[13px] font-semibold text-muted uppercase tracking-wide"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'w-full bg-bg3 border border-border rounded-[10px] px-4 py-3 text-[15px] text-foreground font-sans transition-colors duration-200 outline-none placeholder:text-muted focus:border-green',
          error && 'border-red',
          className
        )}
        {...props}
      />
      {error && <p className="text-red text-xs">{error}</p>}
    </div>
  )
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  ref?: React.Ref<HTMLTextAreaElement>
}

export function Textarea({
  label,
  error,
  className,
  id,
  ref,
  ...props
}: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[13px] font-semibold text-muted uppercase tracking-wide"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          'w-full bg-bg3 border border-border rounded-[10px] px-4 py-3 text-[15px] text-foreground font-sans transition-colors duration-200 outline-none placeholder:text-muted focus:border-green resize-vertical min-h-[80px]',
          error && 'border-red',
          className
        )}
        {...props}
      />
      {error && <p className="text-red text-xs">{error}</p>}
    </div>
  )
}
