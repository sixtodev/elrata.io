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
              Sí, estoy buscando trabajo. Y esta app es la prueba de que no hago las cosas a medias — la hice entera, solo, con IA como copiloto y café como combustible.
            </p>

            <div className="space-y-10 text-[15px] leading-relaxed">

              <section className="bg-bg2 border border-border rounded-xl p-7">
                <h2 className="text-foreground text-lg font-semibold mb-2">
                  🐀 La oportunidad rata del año
                </h2>
                <p className="text-muted">
                  Si llegaste hasta acá, ya sabés que sé construir productos. Frontend, backend, IA, deploy, diseño, copy — todo. Si tu equipo necesita alguien así, esta es la señal del universo. No la ignores, el universo no manda dos veces.
                </p>
              </section>

              <section>
                <h2 className="text-foreground text-lg font-semibold mb-4">¿En qué puedo ayudarte?</h2>
                <ul className="text-muted space-y-3 list-none">
                  <li className="flex items-start gap-2">
                    <span className="text-green mt-1 shrink-0">→</span>
                    <span><strong className="text-foreground">Desarrollo fullstack</strong> — Next.js, TypeScript, Node, bases de datos, APIs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green mt-1 shrink-0">→</span>
                    <span><strong className="text-foreground">Integraciones con IA</strong> — LLMs, scraping inteligente, automatizaciones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green mt-1 shrink-0">→</span>
                    <span><strong className="text-foreground">Productos desde cero</strong> — de la idea al deploy, sin drama</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green mt-1 shrink-0">→</span>
                    <span><strong className="text-foreground">Consultoría técnica</strong> — si tu código llora por las noches, podemos hablar</span>
                  </li>
                </ul>
              </section>

              <div className="border-t border-border" />

              <section>
                <h2 className="text-foreground text-lg font-semibold mb-5">Escribime</h2>
                <div className="space-y-3">
                  <a
                    href="mailto:hola@elrata.io"
                    className="flex items-center gap-3 text-muted hover:text-foreground transition-colors no-underline group"
                  >
                    <span className="w-10 h-10 rounded-lg bg-bg2 border border-border flex items-center justify-center text-green group-hover:border-green transition-colors">
                      @
                    </span>
                    <span>hola@elrata.io</span>
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-muted hover:text-foreground transition-colors no-underline group"
                  >
                    <span className="w-10 h-10 rounded-lg bg-bg2 border border-border flex items-center justify-center text-green group-hover:border-green transition-colors text-xs font-bold">
                      in
                    </span>
                    <span>LinkedIn</span>
                  </a>
                  <a
                    href="https://github.com"
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
