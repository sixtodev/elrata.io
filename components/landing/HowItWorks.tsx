'use client'

import { m, useInView } from 'motion/react'
import { useRef } from 'react'

const steps = [
  {
    num: '01',
    icon: '📝',
    title: 'Describe lo que quieres',
    desc: 'Ingresa el producto, marca (opcional), tu ciudad y país, y para qué lo necesitas. Eso es todo.',
  },
  {
    num: '02',
    icon: '🤖',
    title: 'Buscamos en tiendas reales',
    desc: 'Rastreamos precios en MercadoLibre, Google Shopping y tiendas online de tu país. Luego la IA analiza los resultados y te recomienda la mejor opción.',
  },
  {
    num: '03',
    icon: '💸',
    title: 'Compara y ahorra',
    desc: 'Ves una tabla comparativa con nombre, precio, tienda y link directo. Guarda, ponle alerta y a esperar el momento.',
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

export function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section id="como-funciona" className="py-24 px-6 relative z-10" style={{ backgroundImage: 'linear-gradient(rgba(196,239,22,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(196,239,22,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px' }}>
      <m.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center text-[12px] font-semibold tracking-[3px] uppercase text-green mb-4"
      >
        Así de fácil
      </m.p>
      <m.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="font-title text-[clamp(40px,6vw,68px)] text-center mb-4"
      >
        Tres pasos pa&apos; ahorrar
      </m.h2>
      <m.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-center text-muted text-lg max-w-[500px] mx-auto mb-16"
      >
        Sin complicaciones. Ingresa lo que buscas y la IA hace el trabajo de
        rata por ti.
      </m.p>

      <m.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1000px] mx-auto"
      >
        {steps.map((step) => (
          <m.div
            key={step.num}
            variants={cardVariants}
            whileHover={{ y: -4, borderColor: 'rgba(196,239,22,0.6)' }}
            transition={{ duration: 0.3 }}
            className="bg-bg2 border border-border rounded-2xl p-8"
          >
            <div className="w-10 h-10 bg-green-glow border border-green/30 rounded-[10px] flex items-center justify-center font-title text-lg text-green mb-5">
              {step.num}
            </div>
            <h3 className="font-title text-xl mb-2.5">
              {step.title}
            </h3>
            <p className="text-muted text-[15px] leading-relaxed">
              {step.desc}
            </p>
          </m.div>
        ))}
      </m.div>
    </section>
  )
}
