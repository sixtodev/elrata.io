'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface DrawerProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function Drawer({ open, onClose, children, className }: DrawerProps) {
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      {/* Overlay — centers the drawer via flexbox, pt-16 on mobile to clear navbar */}
      <div
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300 px-4 pt-16 sm:pt-4 pb-4',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer panel — positioned on top of overlay, same centering logic */}
      <div
        className={cn(
          'fixed inset-0 z-[201] flex items-center justify-center px-4 pt-16 sm:pt-4 pb-4',
          open ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Panel de búsqueda"
          className={cn(
            'relative bg-bg2 border border-border rounded-2xl px-6 pt-6 pb-10 w-full max-w-[680px]',
            'max-h-[calc(100vh-80px)] sm:max-h-[calc(100vh-50px)] overflow-y-auto',
            className
          )}
          style={{
            transition: 'transform 0.4s cubic-bezier(.32,.72,0,1), opacity 0.3s',
            transform: open ? 'translateY(0)' : 'translateY(60px)',
            opacity: open ? 1 : 0,
            WebkitOverflowScrolling: 'touch',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-3.5 right-3.5 bg-transparent border-none text-muted hover:text-foreground text-xl cursor-pointer px-2 py-1 rounded-md leading-none transition-colors"
          >
            ✕
          </button>
          {children}
        </div>
      </div>
    </>
  )
}
