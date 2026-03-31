'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { m, AnimatePresence } from 'motion/react'
import { useSearchDrawer } from './SearchDrawerContext'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { open } = useSearchDrawer()
  const router = useRouter()
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileOpen(false)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setUserMenuOpen(false)
    router.push('/')
  }

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? '?'

  return (
    <m.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 md:px-8 h-20 bg-background/85 backdrop-blur-xl border-b border-border"
    >
      <Link
        href="/"
        className="font-title text-[22px] font-bold text-foreground flex items-center gap-2 no-underline"
      >
        El<span className="text-green">Rata</span>.io
      </Link>

      {/* Desktop nav */}
      <ul className="hidden md:flex items-center gap-7 list-none">
        <li>
          <button type="button" onClick={() => scrollTo('como-funciona')} aria-label="Cómo funciona" className="nav-link text-foreground text-sm hover:text-green transition-colors bg-transparent border-none cursor-pointer">
            Cómo funciona
          </button>
        </li>
        <li>
          <button type="button" onClick={() => scrollTo('features')} aria-label="Features" className="nav-link text-foreground text-sm hover:text-green transition-colors bg-transparent border-none cursor-pointer">
            Features
          </button>
        </li>
        <li>
          <button type="button" onClick={() => scrollTo('precios')} aria-label="Precios" className="nav-link text-foreground text-sm hover:text-green transition-colors bg-transparent border-none cursor-pointer">
            Precios
          </button>
        </li>

        {user ? (
          <>
            <li>
              <Link href="/dashboard" className={`nav-link text-sm transition-colors no-underline hover:text-green ${isActive('/dashboard') ? 'text-green font-semibold' : 'text-foreground'}`}>
                Dashboard
              </Link>
            </li>
            <li className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-8 h-8 rounded-full bg-green text-black border-none cursor-pointer text-sm font-semibold flex items-center justify-center"
                title={user.email ?? ''}
              >
                {userInitial}
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <m.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-10 right-0 bg-bg2 border border-border rounded-lg py-2 min-w-[200px] z-[200]"
                  >
                    <div className="px-4 py-2 text-muted text-xs border-b border-border">
                      {user.email}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 bg-transparent border-none text-red text-[13px] cursor-pointer text-left hover:bg-bg3 transition-colors"
                    >
                      Cerrar sesión
                    </button>
                  </m.div>
                )}
              </AnimatePresence>
            </li>
          </>
        ) : (
          <li>
            <Link href="/login" className={`nav-link text-sm transition-colors no-underline hover:text-green ${isActive('/login') ? 'text-green font-semibold' : 'text-foreground'}`}>
              Login
            </Link>
          </li>
        )}

        <li>
          <Button size="sm" onClick={open}>
            A Ratear
          </Button>
        </li>
      </ul>

      {/* Mobile hamburger */}
      <button
        className="flex md:hidden items-center justify-center min-h-11 min-w-11 bg-transparent border-none cursor-pointer text-foreground"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Menú"
        aria-expanded={mobileOpen}
        aria-controls="mobile-menu"
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
      <AnimatePresence>
        {mobileOpen && (
          <m.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute top-20 left-0 right-0 z-[100] bg-bg2 border-b border-border p-6 flex flex-col gap-4 md:hidden"
          >
            <button type="button" onClick={() => scrollTo('como-funciona')} aria-label="Cómo funciona" className="text-foreground text-left hover:text-green transition-colors bg-transparent border-none cursor-pointer min-h-11">
              Cómo funciona
            </button>
            <button type="button" onClick={() => scrollTo('features')} aria-label="Features" className="text-foreground text-left hover:text-green transition-colors bg-transparent border-none cursor-pointer min-h-11">
              Features
            </button>
            <button type="button" onClick={() => scrollTo('precios')} aria-label="Precios" className="text-foreground text-left hover:text-green transition-colors bg-transparent border-none cursor-pointer min-h-11">
              Precios
            </button>

            {user ? (
              <>
                <Link href="/dashboard" className={`transition-colors no-underline min-h-11 flex items-center hover:text-green ${isActive('/dashboard') ? 'text-green font-semibold' : 'text-foreground'}`}>
                  Dashboard
                </Link>
                <div className="flex items-center gap-2.5 text-muted text-[13px]">
                  <div className="w-7 h-7 rounded-full bg-green text-black flex items-center justify-center text-xs font-semibold shrink-0">
                    {userInitial}
                  </div>
                  {user.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-transparent border-none text-red cursor-pointer text-left text-sm p-0 min-h-11"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link href="/login" className={`transition-colors no-underline min-h-11 flex items-center hover:text-green ${isActive('/login') ? 'text-green font-semibold' : 'text-foreground'}`}>
                Iniciar sesión
              </Link>
            )}

            <Button onClick={() => { open(); setMobileOpen(false); }}>
              A Ratear
            </Button>
          </m.div>
        )}
      </AnimatePresence>
    </m.nav>
  )
}
