import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-border py-8 px-6 text-center text-muted text-[13px] relative z-10">
      <p className="mb-3">
        <strong className="text-foreground">ElRata.io</strong> — Busca como rata, compra como rey
      </p>
      <p>
        <Link href="/terminos" className="text-muted hover:text-foreground no-underline transition-colors">Términos</Link>
        {' · '}
        <Link href="/privacidad" className="text-muted hover:text-foreground no-underline transition-colors">Privacidad</Link>
        {' · '}
        <Link href="/contacto" className="text-muted hover:text-foreground no-underline transition-colors">Contacto</Link>
      </p>
      <p className="mt-3 text-[12px]">© 2026 ElRata.io — Hecho con 🐀, café frío, cero presupuesto y los modelos de IA que no cobraron todavía</p>
      <p className="mt-2 text-[11px] italic">
        Nombre inspirado por las ofertas de trabajo ratas que el midu muestra en sus directos xD
      </p>
    </footer>
  )
}
