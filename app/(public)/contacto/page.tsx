import type { Metadata } from 'next'
import { MotionProvider } from '@/components/landing/MotionProvider'
import { SearchDrawerProvider } from '@/components/landing/SearchDrawerContext'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { SearchDrawer } from '@/components/landing/SearchDrawer'

export const metadata: Metadata = {
  title: 'Contacto — ElRata.io',
  description: '¿Querés trabajar juntos? Esta es tu oportunidad rata.',
}

export default function ContactoPage() {
  return (
    <MotionProvider>
      <SearchDrawerProvider>
        <Navbar />

        <main className="min-h-screen bg-background">
          <div className="max-w-2xl mx-auto px-6 pt-[120px] pb-[80px]">

            <p className="text-green text-sm font-semibold mb-3 uppercase tracking-widest">Contacto</p>
            <h1 className="font-title text-[40px] md:text-[52px] text-foreground leading-tight mb-6">
              ¿Trabajamos<br /><span className="text-green">juntos?</span>
            </h1>
            <p className="text-muted text-base mb-12 max-w-lg">
              Sí, estoy buscando trabajo. Esta app la construí solo, con IA como copiloto — pero el que sabe lo que está haciendo soy yo.
            </p>

            <div className="space-y-10 text-[15px] leading-relaxed">

              <section>
                <h2 className="text-foreground text-lg font-semibold mb-2">Un poco de honestidad</h2>
                <p className="text-muted mb-4">
                  No voy a decir que soy un senior experto nivel dios — no lo soy y no voy a mentirte. Pero sí tengo los fundamentos sólidos, me importa hacer las cosas bien, y esta app es la prueba: arquitectura limpia, buenas prácticas, seguridad, deploy real. No es un tutorial de YouTube.
                </p>
                <p className="text-muted mb-4">
                  Usé IA para construir esto y lo digo sin vergüenza. La IA es una herramienta, como lo fue Stack Overflow en su momento. La diferencia es que yo entiendo lo que estoy haciendo: sé por qué una decisión de arquitectura es mejor que otra, qué es seguro y qué no. La IA ejecuta, yo dirijo. Y si algo no sé, lo investigo — leo la documentación, busco alternativas, comparo opciones.
                </p>
                <p className="text-muted">
                  Ejemplo concreto: el scraping de esta app. Hay mil servicios de pago para eso, pero yo quería la opción más free y rata posible. Investigué, probé, descarté, volví a probar. El resultado funciona bien — con sus limitaciones, claro. La más memorable: MercadoLibre me baneó la IP del VPS. Literalmente. Me bloqueó el servidor entero. En algún punto eso deja de ser un error y empieza a ser un logro.
                </p>
              </section>

              <div className="border-t border-border" />

              <section>
                <h2 className="text-foreground text-lg font-semibold mb-4">Con qué trabajo</h2>
                <ul className="text-muted space-y-3 list-none">
                  <li className="flex items-start gap-2">
                    <span className="text-green mt-1 shrink-0">→</span>
                    <span><strong className="text-foreground">Next.js / Astro / Node.js</strong> — frontend y backend, según lo que necesite el proyecto</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green mt-1 shrink-0">→</span>
                    <span><strong className="text-foreground">NestJS</strong> — APIs estructuradas, con arquitectura que escala</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green mt-1 shrink-0">→</span>
                    <span><strong className="text-foreground">Integraciones con IA</strong> — LLMs, automatizaciones, scraping inteligente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green mt-1 shrink-0">→</span>
                    <span><strong className="text-foreground">Shopify</strong> — integraciones, apps, storefronts custom</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green mt-1 shrink-0">→</span>
                    <span><strong className="text-foreground">Pagos</strong> — Stripe, MercadoPago y similares</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green mt-1 shrink-0">→</span>
                    <span><strong className="text-foreground">Productos desde cero</strong> — de la idea al deploy, sin drama</span>
                  </li>
                </ul>
              </section>

              <div className="border-t border-border" />

              <section>
                <h2 className="text-foreground text-lg font-semibold mb-5">Escribime</h2>
                <div className="space-y-3">
                  <a
                    href="mailto:sixtocode@gmail.com"
                    className="flex items-center gap-3 text-muted hover:text-foreground transition-colors no-underline group"
                  >
                    <span className="w-10 h-10 rounded-lg bg-bg2 border border-border flex items-center justify-center text-green group-hover:border-green transition-colors">
                      @
                    </span>
                    <span>sixtocode@gmail.com</span>
                  </a>
                  <a
                    href="https://github.com/sixtodev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-muted hover:text-foreground transition-colors no-underline group"
                  >
                    <span className="w-10 h-10 rounded-lg bg-bg2 border border-border flex items-center justify-center text-green group-hover:border-green transition-colors text-sm">
                      gh
                    </span>
                    <span>GitHub</span>
                  </a>
                </div>
              </section>

              <div className="border-t border-border" />

              <section className="bg-bg2 border border-border rounded-xl p-6">
                <p className="text-muted text-sm">
                  <strong className="text-foreground">P.D.:</strong> Si llegaste acá solo para curiosear, también está bien. Podés cerrar esto y seguir buscando precios como rata. Para eso está la app.
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
