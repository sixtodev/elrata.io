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
      {/* Overlay */}
      <div
        aria-hidden="true"
        className={cn(
          'fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Panel de búsqueda"
        className={cn(
          'fixed top-1/2 left-1/2 z-[201] bg-bg2 border border-border rounded-2xl px-6 pt-6 pb-10 max-h-[calc(100vh-50px)] overflow-y-auto max-w-[680px] w-[calc(100%-32px)]',
          className
        )}
        style={{
          transition: 'transform 0.4s cubic-bezier(.32,.72,0,1), opacity 0.3s',
          transform: open ? 'translate(-50%, -50%)' : 'translate(-50%, 100%)',
          opacity: open ? 1 : 0,
          WebkitOverflowScrolling: 'touch',
        }}
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
    </>
  )
}
