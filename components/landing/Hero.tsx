'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { m } from 'motion/react'
import { useSearchDrawer } from './SearchDrawerContext'
import { Button } from '@/components/ui/Button'

const stats = [
  { num: '+16', label: 'países' },
  { num: '17', label: 'modelos IA' },
  { num: '1h', label: 'alertas' },
  { num: '100%', label: 'rata approved' },
]

// Title split into tokens for word-by-word animation
const titleTokens: {
  text: string
  className?: string
  isLineBreak?: boolean
  isStrikethrough?: boolean
}[] = [
  { text: 'Para' },
  { text: 'el' },
  { text: 'rata', className: 'text-green' },
  { text: '', isLineBreak: true },
  { text: 'que' },
  { text: 'no' },
  { text: 'paga' },
  { text: 'de más', className: 'text-muted', isStrikethrough: true },
]

const wordVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
}

const rataVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.8, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: 'easeOut' as const,
    },
  },
}

export function Hero() {
  const { open } = useSearchDrawer()
  const [videoReady, setVideoReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const totalWords = titleTokens.filter(t => !t.isLineBreak).length
  const strikeThroughDelay = 0.3 + totalWords * 0.12 + 0.3

  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20 relative text-center overflow-hidden"
    >
      {/* Static background image — loads fast via Next.js Image with priority */}
      <Image
        src="/images/hero-bg2.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: '35% center' }}
      />

      {/* Hero background video — fades in smoothly once loaded */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onCanPlayThrough={() => setVideoReady(true)}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
        style={{
          objectPosition: '35% center',
          opacity: videoReady ? 1 : 0,
        }}
      >
        <source src="/out/hero.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay for readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'rgba(10, 10, 10, 0)' }}
      />

      {/* Heading — word-by-word stagger */}
      <m.h1
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
        }}
        className="relative z-10 -mt-32 font-[family-name:var(--font-title)] font-normal leading-none tracking-tight mb-8 sm:mb-20"
        style={{ fontSize: 'clamp(34px, 6vw, 82px)' }}
      >
        {titleTokens.map((token, i) => {
          if (token.isLineBreak) return <br key={`br-${i}`} />

          const isRata = token.text === 'rata'

          if (token.isStrikethrough) {
            return (
              <m.span
                key={token.text}
                variants={wordVariants}
                transition={{ duration: 0.4, ease: 'easeOut' as const }}
                className={`relative inline-block ${token.className ?? ''}`}
              >
                {token.text}
                <m.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.4, delay: strikeThroughDelay, ease: 'easeOut' }}
                  className="absolute left-0 right-0 top-1/2 h-1 bg-red -rotate-2 origin-left"
                />
              </m.span>
            )
          }

          return (
            <m.span
              key={token.text}
              variants={isRata ? rataVariants : wordVariants}
              transition={isRata ? undefined : { duration: 0.4, ease: 'easeOut' as const }}
              className={`inline-block ${token.className ?? ''}`}
            >
              {token.text}
              {i < titleTokens.length - 1 && !titleTokens[i + 1]?.isLineBreak && (
                <span>&nbsp;</span>
              )}
            </m.span>
          )
        })}
      </m.h1>

      {/* CTAs */}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: strikeThroughDelay + 0.2, ease: 'easeOut' }}
        className="relative z-10 flex items-center gap-4 justify-center flex-wrap"
      >
        <Button size="lg" onClick={open} className="px-6 py-3 text-base md:px-9 md:py-4 md:text-lg">
          A Ratear
        </Button>
        <button
          onClick={() =>
            document
              .getElementById('como-funciona')
              ?.scrollIntoView({ behavior: 'smooth' })
          }
          className="bg-bg2 text-foreground border-none rounded-xl px-6 py-3 text-base font-bold md:px-7 md:py-4 md:text-lg cursor-pointer transition-all shadow-[0_0_15px_rgba(196,239,22,0.15)]"
        >
          ¿Cómo funciona?
        </button>
      </m.div>

      {/* Stats */}
      <m.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1, delayChildren: strikeThroughDelay + 0.4 } },
        }}
        className="absolute bottom-3 left-0 right-0 z-10 flex gap-4 sm:gap-10 justify-center flex-nowrap px-4"
      >
        {stats.map((stat) => (
          <m.div
            key={stat.label}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-center"
          >
            <div className="font-[family-name:var(--font-title)] text-[18px] sm:text-[28px] text-green">
              {stat.num}
            </div>
            <div className="text-[10px] sm:text-[13px] text-muted">{stat.label}</div>
          </m.div>
        ))}
      </m.div>
    </section>
  )
}
