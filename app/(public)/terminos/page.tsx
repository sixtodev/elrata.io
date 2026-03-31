import type { Metadata } from 'next'
import { MotionProvider } from '@/components/landing/MotionProvider'
import { SearchDrawerProvider } from '@/components/landing/SearchDrawerContext'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { SearchDrawer } from '@/components/landing/SearchDrawer'

export const metadata: Metadata = {
  title: 'Términos y Condiciones — ElRata.io',
  description: 'Términos de uso de ElRata.io. Spoiler: es gratis y sin letra chica.',
}

export default function TerminosPage() {
  return (
    <MotionProvider>
      <SearchDrawerProvider>
        <Navbar />

        <main className="min-h-screen bg-background">
          <div className="max-w-2xl mx-auto px-6 pt-[120px] pb-[80px]">

            <p className="text-green text-sm font-semibold mb-3 uppercase tracking-widest">Legal</p>
            <h1 className="font-title text-[40px] md:text-[52px] text-foreground leading-tight mb-6">
              Términos y<br /><span className="text-green">Condiciones</span>
            </h1>
            <p className="text-muted text-base mb-12">
              Última actualización: 30 de marzo de 2026 (o sea, hoy)
            </p>

            <div className="space-y-10 text-[15px] leading-relaxed">

              <section>
                <h2 className="text-foreground text-lg font-semibold mb-3">
                  🐀 La verdad de la milanesa
                </h2>
                <p className="text-muted">
                  ElRata.io es <strong className="text-foreground">completamente gratis</strong>, sin condiciones ocultas, sin suscripciones que se cobran a los 30 días, sin versión premium camuflada. Si algún día eso cambia, te lo decimos con tiempo y sin letra chica.
                </p>
              </section>

              <div className="border-t border-border" />

              <section>
                <h2 className="text-foreground text-lg font-semibold mb-3">
                  Uso del servicio
                </h2>
                <p className="text-muted mb-4">
                  Podés usar ElRata.io para comparar precios, guardar búsquedas y crear alertas. Lo único que pedimos:
                </p>
                <ul className="text-muted space-y-2 list-none">
                  <li className="flex items-start gap-2"><span className="text-green mt-1">→</span> No la uses para hacer spam ni automatización masiva</li>
                  <li className="flex items-start gap-2"><span className="text-green mt-1">→</span> No intentes romper la app (aunque si encontrás algo, avisanos)</li>
                  <li className="flex items-start gap-2"><span className="text-green mt-1">→</span> No hagas nada que haría llorar a tu abuela</li>
                </ul>
              </section>

              <div className="border-t border-border" />

              <section>
                <h2 className="text-foreground text-lg font-semibold mb-3">
                  Responsabilidad de precios
                </h2>
                <p className="text-muted">
                  Los precios que mostramos vienen de búsquedas en tiempo real via IA. Pueden no ser 100% exactos o estar desactualizados unos minutos. Siempre verificá en la tienda oficial antes de comprar. Somos ratas, no oráculos.
                </p>
              </section>

              <div className="border-t border-border" />

              <section>
                <h2 className="text-foreground text-lg font-semibold mb-3">
                  Propiedad intelectual
                </h2>
                <p className="text-muted">
                  El código, diseño y nombre "ElRata.io" son propiedad del creador. La rata del logo también — se llama Rata y tiene más personalidad que la mayoría.
                </p>
              </section>

              <div className="border-t border-border" />

              <section>
                <h2 className="text-foreground text-lg font-semibold mb-3">
                  Cambios en estos términos
                </h2>
                <p className="text-muted">
                  Si algo cambia, lo avisamos. No somos de esos que actualizan los términos a las 3am y te mandan un mail que va directo a spam.
                </p>
              </section>

              <div className="border-t border-border" />

              <section className="bg-bg2 border border-green rounded-xl p-6">
                <p className="text-muted text-sm">
                  <strong className="text-foreground">TL;DR:</strong> Úsala, es gratis, no hagas cosas malas, y si algo no funciona avisanos. Eso es todo. Serio.
                </p>
              </section>

            </div>
          </div>
        </main>

        <Footer />
        <SearchDrawer />
      </SearchDrawerProvider>
    </MotionProvider>
  )
}
