import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
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
import { Footer } from '@/components/landing/Footer'
import { SearchDrawer } from '@/components/landing/SearchDrawer'

const HowItWorks = dynamic(() => import('@/components/landing/HowItWorks').then(m => ({ default: m.HowItWorks })))
const Features = dynamic(() => import('@/components/landing/Features').then(m => ({ default: m.Features })))
const Pricing = dynamic(() => import('@/components/landing/Pricing').then(m => ({ default: m.Pricing })))
const CtaBottom = dynamic(() => import('@/components/landing/CtaBottom').then(m => ({ default: m.CtaBottom })))

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
