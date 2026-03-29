'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DashboardNavProps {
  email?: string
}

export function DashboardNav({ email }: DashboardNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 md:px-8 h-16 bg-background/85 backdrop-blur-xl border-b border-border">
      <a
        href="/"
        className="font-title text-[22px] text-foreground flex items-center gap-2 no-underline"
      >
        El<span className="text-green">Rata</span>.io
      </a>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-6">
        <a
          href="/dashboard"
          className="text-foreground text-sm no-underline hover:text-green transition-colors"
        >
          Dashboard
        </a>
        <a
          href="/alerts"
          className="text-muted text-sm no-underline hover:text-foreground transition-colors"
        >
          Alertas
        </a>

        {email && (
          <span className="text-muted text-[13px] border-l border-border pl-4">
            {email}
          </span>
        )}

        <button
          onClick={handleLogout}
          className="bg-transparent border border-border text-muted text-[13px] px-3.5 py-1.5 rounded-lg cursor-pointer hover:text-foreground hover:border-muted transition-all"
        >
          Salir
        </button>
      </div>

      {/* Mobile hamburger */}
      <button
        className="flex md:hidden items-center justify-center min-h-11 min-w-11 bg-transparent border-none cursor-pointer text-foreground"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Menú"
        aria-expanded={mobileOpen}
        aria-controls="dashboard-mobile-menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {mobileOpen ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <path d="M3 12h18M3 6h18M3 18h18" />
          )}
        </svg>
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          id="dashboard-mobile-menu"
          className="absolute top-16 left-0 right-0 bg-bg2 border-b border-border p-6 flex flex-col gap-4 md:hidden"
        >
          <a
            href="/dashboard"
            className="text-foreground no-underline hover:text-green transition-colors min-h-11 flex items-center"
          >
            Dashboard
          </a>
          <a
            href="/alerts"
            className="text-muted no-underline hover:text-foreground transition-colors min-h-11 flex items-center"
          >
            Alertas
          </a>

          {email && (
            <span className="text-muted text-[13px]">{email}</span>
          )}

          <button
            onClick={() => { handleLogout(); setMobileOpen(false); }}
            className="bg-transparent border-none text-red cursor-pointer text-left text-sm p-0 min-h-11"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  )
}
