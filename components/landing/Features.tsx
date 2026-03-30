'use client'

import Image from 'next/image'
import { m, useInView } from 'motion/react'
import { useRef } from 'react'

const features = [
  {
    tag: 'Core',
    icon: '/icons/world2.webp',
    isImage: true,
    title: 'Búsqueda local + global',
    desc: 'No solo EEUU. Busca en tu ciudad específica, en tu país. Resultados de tiendas que realmente te llegan.',
  },
  {
    tag: 'Core',
    icon: '/icons/list.webp',
    isImage: true,
    title: 'Tabla comparativa',
    desc: 'Precio, tienda, disponibilidad y link directo en una sola vista. Sin abrir 15 tabs.',
  },
  {
    tag: 'Con cuenta',
    icon: '/icons/folder.webp',
    isImage: true,
    title: 'Carpetas de búsquedas',
    desc: 'Organiza tus búsquedas guardadas por categoría. "Laptops", "Cafeteras", "Auriculares". Como Notion pero para compras.',
  },
  {
    tag: 'Con cuenta',
    icon: '/icons/model.webp',
    isImage: true,
    title: 'Multi-modelo IA',
    desc: 'Usamos varios modelos de IA que se rotan automáticamente para analizar tus resultados y darte la mejor recomendación según lo que necesitas.',
  },
  {
    tag: 'Alertas',
    icon: '/icons/bell.webp',
    isImage: true,
    title: 'Alerta de precio',
    desc: 'Define tu precio objetivo y recibe un email cuando el producto llegue a ese valor. Nunca te pierdas una oferta.',
    tagVariant: 'warning' as const,
  },
  {
    tag: 'Alertas',
    icon: '/icons/pinch.webp',
    isImage: true,
    title: 'Monitoreo cada hora',
    desc: 'El sistema re-ejecuta tu búsqueda cada 60 minutos automáticamente. Guarda historial de precios para que veas la tendencia.',
    tagVariant: 'warning' as const,
  },
]

const alertRows = [
  {
    product: 'MacBook Air M3',
    target: 'Objetivo: $1.100.000 CLP',
    price: '$1.089.000',
    priceDown: true,
    badge: '¡Alerta!',
    badgeType: 'triggered',
  },
  {
    product: 'Sony WH-1000XM5',
    target: 'Objetivo: $250 USD',
    price: '$279 USD',
    priceDown: false,
    badge: 'Activa',
    badgeType: 'active',
  },
  {
    product: 'Cafetera Nespresso',
    target: 'Objetivo: $80.000 COP',
    price: '$74.900',
    priceDown: true,
    badge: '¡Alerta!',
    badgeType: 'triggered',
  },
]

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

export function Features() {
  const gridRef = useRef(null)
  const gridInView = useInView(gridRef, { once: true, amount: 0.1 })
  const alertRef = useRef(null)
  const alertInView = useInView(alertRef, { once: true, amount: 0.3 })

  return (
    <section id="features" className="py-24 px-6 relative z-10 bg-bg2">
      <m.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center text-[12px] font-semibold tracking-[3px] uppercase text-green mb-4"
      >
        Features
      </m.p>
      <m.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="font-title text-[clamp(40px,6vw,68px)] text-center mb-4"
      >
        Todo lo que un rata necesita
      </m.h2>
      <m.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-center text-muted text-lg max-w-125 mx-auto mb-16"
      >
        Sin comisiones, sin anuncios. Solo información.
      </m.p>

      {/* Feature grid */}
      <m.div
        ref={gridRef}
        variants={gridVariants}
        initial="hidden"
        animate={gridInView ? 'visible' : 'hidden'}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-275 mx-auto"
      >
        {features.map((f) => (
          <m.div
            key={f.title}
            variants={cardVariants}
            whileHover={{ y: -4, borderColor: 'rgba(196,239,22,0.4)' }}
            className="bg-background border border-border rounded-2xl p-7"
          >
            {'isImage' in f && f.isImage ? (
              <Image src={f.icon} alt={f.title} width={48} height={48} unoptimized className="block mb-4" />
            ) : (
              <span className="text-4xl block mb-4">{f.icon}</span>
            )}
            <h3 className="font-title text-[20px] font-semibold tracking-wide mb-2">
              {f.title}
            </h3>
            <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
          </m.div>
        ))}
      </m.div>

      {/* Alert highlight */}
      <m.div
        ref={alertRef}
        initial={{ opacity: 0, y: 40 }}
        animate={alertInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="max-w-225 mx-auto mt-16 bg-[linear-gradient(135deg,rgba(196,239,22,0.05),rgba(196,239,22,0.02))] border border-green/20 rounded-[20px] p-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
      >
        <div>
          <h3 className="font-title text-[26px] font-semibold tracking-wide mb-3">
            Alertas de precio inteligentes
          </h3>
          <p className="text-muted leading-relaxed mb-5">
            Dile a ElRata cuánto estás dispuesto a pagar. Nosotros vigilamos
            cada hora y te avisamos al correo cuando el precio llegue o baje de
            tu objetivo.
          </p>
          <ul className="space-y-3.5">
            {[
              'Ingresa tu precio objetivo al guardar una búsqueda',
              'Consulta de precios cada 60 minutos',
              'Compara el precio actual con tu objetivo',
              'Si matchea → te llega un email al tiro',
              'Historial de precios para ver la tendencia',
            ].map((text, i) => (
              <m.li
                key={text}
                initial={{ opacity: 0, x: -20 }}
                animate={alertInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-3 text-sm text-muted"
              >
                <span className="w-5 h-5 bg-green rounded-full flex items-center justify-center text-[11px] text-black font-bold shrink-0 mt-0.5">
                  ✓
                </span>
                {text}
              </m.li>
            ))}
          </ul>
        </div>

        {/* Alert mockup */}
        <m.div
          initial={{ opacity: 0, x: 30 }}
          animate={alertInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-bg3 border border-border rounded-xl p-5 text-[13px]"
        >
          <div className="flex items-center gap-2 mb-4 text-muted text-[12px]">
            <span className="w-2 h-2 bg-red rounded-full" />
            <span className="w-2 h-2 bg-yellow rounded-full" />
            <span className="w-2 h-2 bg-green rounded-full" />
            Panel de Alertas — elrata.io
          </div>
          {alertRows.map((row, i) => (
            <m.div
              key={row.product}
              initial={{ opacity: 0, y: 10 }}
              animate={alertInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ duration: 0.4, delay: 0.6 + i * 0.12 }}
              className="flex items-center justify-between py-2.5 border-b border-border last:border-b-0 gap-2"
            >
              <div>
                <div className="font-medium text-[13px]">{row.product}</div>
                <div className="text-muted text-[12px]">{row.target}</div>
              </div>
              <div className="text-right">
                <div
                  className={`text-[13px] font-semibold ${
                    row.priceDown ? 'text-green' : 'text-muted'
                  }`}
                >
                  {row.price} {row.priceDown && '✓'}
                </div>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[11px] ${
                    row.badgeType === 'triggered'
                      ? 'bg-yellow/10 text-yellow'
                      : 'bg-green/10 text-green'
                  }`}
                >
                  {row.badge}
                </span>
              </div>
            </m.div>
          ))}
          <div className="mt-3.5 text-[12px] text-muted text-center">
            Última verificación: hace 12 minutos
          </div>
        </m.div>
      </m.div>
    </section>
  )
}
