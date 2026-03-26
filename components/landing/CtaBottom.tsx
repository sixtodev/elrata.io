'use client'

import Image from 'next/image'
import { m } from 'motion/react'
import { useSearchDrawer } from './SearchDrawerContext'
import { Button } from '@/components/ui/Button'

export function CtaBottom() {
  const { open } = useSearchDrawer()

  return (
    <section className="text-center py-12 px-6 bg-[radial-gradient(ellipse_at_center,rgba(196,239,22,0.08)_0%,transparent_70%)] relative z-10" style={{ backgroundImage: 'linear-gradient(rgba(196,239,22,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(196,239,22,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px' }}>
      <m.div
        className="w-48 h-48 mx-auto mb-2 relative"
        animate={{
          y: [0, -12, 0],
          rotate: [0, 3, -3, 0],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Image src="/icons/rata.webp" alt="Rata" fill className="object-contain" />
      </m.div>
      <m.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="font-[family-name:var(--font-title)] text-[clamp(40px,6vw,68px)] mb-4"
      >
        ¿Listo para ser el rata
        <br />
        más ahorrador del barrio?
      </m.h2>
      <m.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-muted text-lg mx-auto max-w-[480px] mb-10"
      >
        Sin tarjeta, sin trampa. Busca gratis ahora mismo.
      </m.p>
      <m.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3, type: 'spring', stiffness: 200, damping: 20 }}
      >
        <Button size="lg" onClick={open} className="text-base px-8 py-3 md:text-xl md:px-12 md:py-5 mx-auto">
          A Ratear Ahora
        </Button>
      </m.div>
    </section>
  )
}
