import type { Metadata } from 'next'
import { MotionProvider } from '@/components/landing/MotionProvider'
import { SearchDrawerProvider } from '@/components/landing/SearchDrawerContext'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { SearchDrawer } from '@/components/landing/SearchDrawer'

export const metadata: Metadata = {
  title: 'Política de Privacidad — ElRata.io',
  description: 'Tus datos son tuyos. Acá te explicamos exactamente qué guardamos y qué no.',
}

export default function PrivacidadPage() {
  return (
    <MotionProvider>
      <SearchDrawerProvider>
        <Navbar />

        <main className="min-h-screen bg-background">
          <div className="max-w-2xl mx-auto px-6 pt-[120px] pb-[80px]">

            <p className="text-green text-sm font-semibold mb-3 uppercase tracking-widest">Privacidad</p>
            <h1 className="font-title text-[40px] md:text-[52px] text-foreground leading-tight mb-6">
              Tu información,<br /><span className="text-green">tus reglas</span>
            </h1>
            <p className="text-muted text-base mb-12">
              Sin rodeos. Lo que guardamos, por qué, y lo que nunca vamos a hacer con tus datos.
            </p>

            <div className="space-y-10 text-[15px] leading-relaxed">

              <section>
                <h2 className="text-foreground text-lg font-semibold mb-3">¿Qué información guardamos?</h2>
                <ul className="text-muted space-y-3 list-none">
                  <li className="flex items-start gap-2">
                    <span className="text-green mt-1 shrink-0">→</span>
                    <span><strong className="text-foreground">Tu email</strong> — para crear tu cuenta y enviarte alertas de precio. Nada más.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green mt-1 shrink-0">→</span>
                    <span><strong className="text-foreground">Tus búsquedas</strong> — las que vos guardás en tus carpetas quedan asociadas a tu perfil.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green mt-1 shrink-0">→</span>
                    <span><strong className="text-foreground">Tus alertas</strong> — el producto, precio objetivo y frecuencia de verificación.</span>
                  </li>
                </ul>
              </section>

              <div className="border-t border-border" />

              <section>
                <h2 className="text-foreground text-lg font-semibold mb-3">¿Quién puede ver tus datos?</h2>
                <p className="text-muted mb-4">
                  <strong className="text-foreground">Solo tú.</strong> Usamos Supabase con Row Level Security (RLS) habilitado — cada usuario solo puede leer y escribir sus propios datos. No hay forma de que otro usuario vea tus búsquedas o alertas.
                </p>
                <p className="text-muted">
                  El equipo técnico (por ahora, una sola persona con demasiado café) tiene acceso a la base para mantenimiento, pero no revisamos búsquedas individuales. No hay negocio en espiarte.
                </p>
              </section>

              <div className="border-t border-border" />

              <section>
                <h2 className="text-foreground text-lg font-semibold mb-3">Emails que enviamos</h2>
                <p className="text-muted">
                  Solo recibís emails cuando una alerta se dispara (el precio bajó al nivel que configuraste). No hay newsletter, no hay "novedades de ElRata.io", no hay emails de "te extrañamos" si no entrás hace 3 días. Serio.
                </p>
              </section>

              <div className="border-t border-border" />

              <section>
                <h2 className="text-foreground text-lg font-semibold mb-3">Cookies y tracking</h2>
                <p className="text-muted">
                  Usamos cookies solo para mantener tu sesión activa. Sin analytics de terceros, sin píxeles de Facebook, sin Google Tag Manager cargando 40 scripts en background. La app es rápida porque no tiene esa mugre.
                </p>
              </section>

              <div className="border-t border-border" />

              <section>
                <h2 className="text-foreground text-lg font-semibold mb-3">¿Querés borrar tu cuenta?</h2>
                <p className="text-muted">
                  Escribinos a <strong className="text-foreground">sixtocode@gmail.com</strong> y borramos todo: cuenta, búsquedas, alertas. Sin preguntas, sin formulario de 5 pasos, sin "¿estás seguro?" tres veces.
                </p>
              </section>

              <div className="border-t border-border" />

              <section className="bg-bg2 border border-border rounded-xl p-6">
                <p className="text-muted text-sm">
                  <strong className="text-foreground">Resumen:</strong> Tus datos son tuyos. Los usamos solo para que la app funcione. No los vendemos. No los compartimos. Si algo cambia, te avisamos antes de que cambie.
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
