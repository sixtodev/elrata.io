'use client'

import Link from 'next/link'

export function AnonymousBanner() {
  return (
    <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3.5 bg-green/10 border border-green/30 rounded-xl">
      <div className="flex items-start sm:items-center gap-3">
        <span className="text-green text-lg leading-none mt-0.5 sm:mt-0">🚀</span>
        <div>
          <p className="text-foreground text-sm font-semibold">
            Estás en modo demo — todas las funciones están habilitadas
          </p>
          <p className="text-muted text-xs mt-0.5">
            Carpetas, alertas, historial de precios. Registrate para no perder tu progreso.
          </p>
        </div>
      </div>
      <Link
        href="/login"
        className="shrink-0 bg-green text-black text-[13px] font-semibold px-4 py-2 rounded-lg no-underline hover:opacity-90 transition-opacity"
      >
        Crear cuenta
      </Link>
    </div>
  )
}
