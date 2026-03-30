'use client'

import Link from 'next/link'
import { m, useInView } from 'motion/react'
import { useRef } from 'react'
import { useSearchDrawer } from './SearchDrawerContext'
import { Button } from '@/components/ui/Button'

const plans = [
  {
    name: 'Sin cuenta',
    desc: 'Busca sin registrarte',
    featured: false,
    features: [
      { text: '5 búsquedas por día', ok: true },
      { text: 'Hasta 10 resultados por búsqueda', ok: true },
      { text: 'Búsqueda por categoría y filtros', ok: true },
      { text: 'Búsqueda en cualquier país', ok: true },
      { text: 'Recomendación IA', ok: true },
      { text: 'Guardar búsquedas en carpetas', ok: false },
      { text: 'Alertas de precio por email', ok: false },
      { text: 'Historial de precios', ok: false },
      { text: 'Buscar en URL personalizada', ok: false },
      { text: 'URLs de tiendas guardadas', ok: false },
    ],
    cta: 'Buscar ahora',
  },
  {
    name: 'Con cuenta gratis',
    desc: 'Regístrate y desbloquea todo — $0 por siempre',
    featured: true,
    badge: '100% GRATIS',
    features: [
      { text: 'Búsquedas ilimitadas', ok: true },
      { text: 'Hasta 20 resultados por búsqueda', ok: true },
      { text: 'Búsqueda por categoría y filtros', ok: true },
      { text: 'Búsqueda en cualquier país', ok: true },
      { text: 'Recomendación IA', ok: true },
      { text: 'Guardar búsquedas en carpetas', ok: true },
      { text: 'Alertas de precio por email', ok: true },
      { text: 'Historial de precios', ok: true },
      { text: 'Buscar en URL personalizada', ok: true },
      { text: 'URLs de tiendas guardadas', ok: true },
    ],
    cta: 'Crear cuenta gratis',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } },
}

const planVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

export function Pricing() {
  const { open } = useSearchDrawer()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section id="precios" className="py-24 px-6 relative z-10" style={{ backgroundImage: 'linear-gradient(rgba(196,239,22,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(196,239,22,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px' }}>
      <m.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center text-[12px] font-semibold tracking-[3px] uppercase text-green mb-4"
      >
        Siempre gratis
      </m.p>
      <m.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="font-title text-[clamp(40px,6vw,68px)] text-center mb-4"
      >
        Todo gratis para{' '}
        <span className="text-green">ratas exigentes</span>
      </m.h2>
      <m.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-center text-muted text-lg max-w-[500px] mx-auto mb-16"
      >
        Sin tarjeta, sin planes de pago. Crea una cuenta gratis y desbloquea todo.
      </m.p>

      <m.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[900px] mx-auto"
      >
        {plans.map((plan) => (
          <m.div
            key={plan.name}
            variants={planVariants}
            whileHover={{ y: -6 }}
            transition={{ duration: 0.3 }}
            className={`relative rounded-[20px] p-8 flex flex-col ${
              plan.featured
                ? 'border border-green bg-[linear-gradient(135deg,rgba(196,239,22,0.06),var(--bg2))]'
                : 'bg-bg2 border border-border'
            }`}
          >
            {plan.badge && (
              <m.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4, delay: 0.5, type: 'spring', stiffness: 300, damping: 20 }}
                className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green text-black rounded-full px-4 py-1 text-[12px] font-bold"
              >
                {plan.badge}
              </m.div>
            )}
            <div className="font-title text-[22px] font-semibold tracking-wide mb-2">
              {plan.name}
            </div>
            <div className="text-muted text-sm mb-6">{plan.desc}</div>
            <ul className="space-y-0 mb-7 flex-1">
              {plan.features.map((f) => (
                <li
                  key={f.text}
                  className="flex items-center gap-2.5 text-sm py-2 border-b border-border last:border-b-0 text-muted"
                >
                  <span
                    className={
                      f.ok ? 'text-green text-base' : 'text-muted opacity-40'
                    }
                  >
                    {f.ok ? '✓' : '✗'}
                  </span>
                  {f.text}
                </li>
              ))}
            </ul>
            {plan.featured ? (
              <Link
                href="/login"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  width: '100%',
                  textDecoration: 'none',
                }}
              >
                <Button variant="primary" className="w-full">
                  {plan.cta}
                </Button>
              </Link>
            ) : (
              <Button
                variant="secondary"
                className="w-full bg-[#151518] text-white border-[#151518] hover:bg-[#1C1C1F]"
                onClick={open}
              >
                {plan.cta}
              </Button>
            )}
          </m.div>
        ))}
      </m.div>
    </section>
  )
}
