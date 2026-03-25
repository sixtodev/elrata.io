'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchDrawer } from './SearchDrawerContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { SetPriceAlertModal } from '@/components/results/SetPriceAlertModal'
import { createClient } from '@/lib/supabase/client'
import type { SearchResult } from '@/types/search'

interface AIAnalysis {
  summary: string
  recommendations: Array<{
    type: string
    label: string
    productIndex: number
    reason: string
  }>
  priceRange: { min: string; max: string; average: string }
  tip: string
}

export function ResultsSection() {
  const { results, clearResults, open } = useSearchDrawer()
  const sectionRef = useRef<HTMLElement>(null)
  const [alertResult, setAlertResult] = useState<SearchResult | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [analyzingAI, setAnalyzingAI] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })
  }, [])

  // Auto-scroll + trigger AI analysis when results change
  useEffect(() => {
    if (results && sectionRef.current) {
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)

      // Trigger AI analysis
      const purpose = (results as unknown as Record<string, unknown>)._purpose as string || ''
      const budget = (results as unknown as Record<string, unknown>)._budget as string || undefined

      if (results.results.length > 0 && purpose) {
        setAnalyzingAI(true)
        setAnalysis(null)

        fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            results: results.results,
            product: results.query.product,
            purpose,
            budget,
            country: results.query.country,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.analysis) setAnalysis(data.analysis)
          })
          .catch(() => {})
          .finally(() => setAnalyzingAI(false))
      }
    }
  }, [results])

  if (!results) return null

  const items = results.results || []

  // Build set of recommended indices for highlighting
  const recommendedIndices = new Set(
    analysis?.recommendations?.map((r) => r.productIndex) || []
  )

  return (
    <section
      ref={sectionRef}
      id="resultados"
      style={{ padding: '48px 24px', position: 'relative', zIndex: 10, background: '#1C1C1F', borderTop: '1px solid #2a2a2a' }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Action bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '12px' }}>
          <Button variant="secondary" size="sm" onClick={clearResults}>
            Cerrar resultados
          </Button>
          <Button size="sm" onClick={open}>
            Nueva búsqueda
          </Button>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 className="font-[family-name:var(--font-title)]" style={{ fontSize: '28px', marginBottom: '8px', color: '#fefeff' }}>
            🐀 Resultados para &quot;{results.query.product}&quot;
          </h2>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            {items.length} productos encontrados en {results.query.city}, {results.query.country}
            {results.sources_used && results.sources_used.length > 0 && (
              <> · Fuentes: <span style={{ color: '#c4ef16' }}>{results.sources_used.join(', ')}</span></>
            )}
          </p>
        </div>

        {/* AI Analysis section */}
        {analyzingAI && (
          <div style={{
            background: '#151518', border: '1px solid #c4ef1630', borderRadius: '12px',
            padding: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <Spinner size="sm" />
            <span style={{ color: '#6b7280', fontSize: '14px' }}>
              🤖 La IA está analizando los productos para darte recomendaciones...
            </span>
          </div>
        )}

        {analysis && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(196,239,22,0.05), rgba(196,239,22,0.02))',
            border: '1px solid rgba(196,239,22,0.2)', borderRadius: '16px',
            padding: '24px', marginBottom: '24px',
          }}>
            <h3 className="font-[family-name:var(--font-title)]" style={{ fontSize: '20px', color: '#fefeff', marginBottom: '8px' }}>
              🤖 Análisis inteligente
            </h3>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>{analysis.summary}</p>

            {/* Recommendations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {analysis.recommendations.map((rec, i) => {
                const product = items[rec.productIndex]
                if (!product) return null
                return (
                  <div key={i} style={{
                    background: '#151518', border: '1px solid #2a2a2a', borderRadius: '10px',
                    padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px' }}>{rec.label}</span>
                      </div>
                      <div style={{ color: '#fefeff', fontSize: '14px', fontWeight: 500 }}>{product.name}</div>
                      <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '2px' }}>{rec.reason}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ color: '#c4ef16', fontWeight: 'bold', fontSize: '18px' }}>{product.price}</div>
                      <div style={{ color: '#6b7280', fontSize: '11px' }}>{product.store}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Price range + tip */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ background: '#151518', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', color: '#6b7280' }}>
                Rango: <span style={{ color: '#c4ef16' }}>{analysis.priceRange.min}</span> — <span style={{ color: '#ef4444' }}>{analysis.priceRange.max}</span>
                {' · '}Promedio: <span style={{ color: '#fefeff' }}>{analysis.priceRange.average}</span>
              </div>
            </div>

            {analysis.tip && (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: '#c4ef1610', borderRadius: '8px', fontSize: '13px', color: '#c4ef16' }}>
                💡 {analysis.tip}
              </div>
            )}
          </div>
        )}

        {/* Results list */}
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🐀</span>
            <p style={{ color: '#6b7280' }}>No encontramos resultados. Intenta con otro producto.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((r, i) => {
              const isRecommended = recommendedIndices.has(i)
              const recLabel = analysis?.recommendations?.find((rec) => rec.productIndex === i)?.label

              return (
                <div
                  key={`result-${i}`}
                  style={{
                    background: '#151518',
                    border: isRecommended ? '1px solid rgba(196,239,22,0.4)' : '1px solid #2a2a2a',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '16px',
                    position: 'relative',
                  }}
                >
                  {/* Recommended badge */}
                  {recLabel && (
                    <div style={{
                      position: 'absolute', top: '-10px', left: '16px',
                      background: '#c4ef16', color: '#000', fontSize: '11px', fontWeight: 600,
                      padding: '2px 10px', borderRadius: '999px',
                    }}>
                      {recLabel}
                    </div>
                  )}

                  {/* Left */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ color: '#6b7280', fontSize: '12px', fontFamily: 'monospace' }}>#{i + 1}</span>
                      <Badge variant={r.source === 'crawlee' ? 'default' : 'muted'}>
                        {r.source === 'crawlee' ? '✓ Verificado' : 'Web'}
                      </Badge>
                    </div>
                    <h3 style={{ color: '#fefeff', fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>
                      {r.name}
                    </h3>
                    <p style={{ color: '#6b7280', fontSize: '14px' }}>{r.store}</p>
                    {r.notes && (
                      <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>{r.notes}</p>
                    )}
                  </div>

                  {/* Right */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ color: '#c4ef16', fontWeight: 'bold', fontSize: '20px' }}>{r.price}</div>
                    <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '8px' }}>{r.currency}</div>
                    {r.url && r.url !== '#' ? (
                      <a href={r.url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-block', background: '#c4ef16', color: '#000', padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                        Ver oferta →
                      </a>
                    ) : (
                      <span style={{ color: '#6b7280', fontSize: '12px' }}>Buscar en {r.store}</span>
                    )}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setAlertResult(r)}
                        style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '4px 10px', color: '#6b7280', fontSize: '12px', cursor: 'pointer' }}
                      >
                        🔔 Alerta
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {alertResult && results && (
        <SetPriceAlertModal
          open={!!alertResult}
          onOpenChange={(open) => { if (!open) setAlertResult(null) }}
          result={alertResult}
          query={results.query}
          isLoggedIn={isLoggedIn}
        />
      )}
    </section>
  )
}
