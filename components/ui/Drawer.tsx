'use client'

import { useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface DrawerProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function Drawer({ open, onClose, children, className }: DrawerProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          zIndex: 201,
          background: '#1C1C1F',
          border: '1px solid #2a2a2a',
          borderRadius: '16px',
          padding: '24px 24px 40px',
          maxHeight: 'calc(100vh - 50px)',
          height: 'auto',
          overflowY: 'auto',
          maxWidth: '680px',
          width: 'calc(100% - 32px)',
          transition: 'transform 0.4s cubic-bezier(.32,.72,0,1), opacity 0.3s',
          transform: open ? 'translate(-50%, -50%)' : 'translate(-50%, 100%)',
          opacity: open ? 1 : 0,
          WebkitOverflowScrolling: 'touch',
        }}
        className={className}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: 'transparent',
            border: 'none',
            color: '#6b7280',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '6px',
            lineHeight: 1,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fefeff' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280' }}
        >
          ✕
        </button>
        {children}
      </div>
    </>
  )
}
