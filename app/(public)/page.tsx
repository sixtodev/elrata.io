import type { Metadata } from 'next'
import { SearchDrawerProvider } from '@/components/landing/SearchDrawerContext'

export const metadata: Metadata = {
  title: 'ElRata.io — Busca como rata, compra como rey',
  description: 'Compara precios de cualquier producto en tu ciudad y país con IA. Alertas de precio, carpetas de búsquedas y multi-modelo. Gratis para siempre.',
  alternates: {
    canonical: 'https://elrata.io',
  },
}
import { MotionProvider } from '@/components/landing/MotionProvider'
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'

import { ResultsSection } from '@/components/landing/ResultsSection'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Features } from '@/components/landing/Features'
import { Pricing } from '@/components/landing/Pricing'
import { CtaBottom } from '@/components/landing/CtaBottom'
import { Footer } from '@/components/landing/Footer'
import { SearchDrawer } from '@/components/landing/SearchDrawer'

export default function LandingPage() {
  return (
    <MotionProvider>
      <SearchDrawerProvider>
        <Navbar />
        <Hero />
        <ResultsSection />
        <HowItWorks />
        <Features />
        <Pricing />
        <CtaBottom />
        <Footer />
        <SearchDrawer />
      </SearchDrawerProvider>
    </MotionProvider>
  )
}
