'use client'

import type { SearchResult, SearchQuery } from '@/types/search'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

const availabilityLabels: Record<string, { text: string; variant: 'default' | 'warning' | 'muted' }> = {
  in_stock: { text: 'Disponible', variant: 'default' },
  online_only: { text: 'Solo online', variant: 'warning' },
  limited: { text: 'Stock limitado', variant: 'warning' },
  unknown: { text: 'Sin info', variant: 'muted' },
}

interface ResultsTableProps {
  results: SearchResult[]
  query: SearchQuery
  modelUsed: string
}

export function ResultsTable({ results, query, modelUsed }: ResultsTableProps) {
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-6xl block mb-4">🐀</span>
        <h3 className="text-xl font-semibold mb-2">
          No encontramos resultados
        </h3>
        <p className="text-muted text-sm">
          Intenta con otro producto o ciudad
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-title text-2xl mb-2">
          🐀 Resultados para &quot;{query.product}&quot;
        </h2>
        <p className="text-muted text-sm">
          {results.length} opciones en {query.city}, {query.country}
          <span className="mx-2">·</span>
          Modelo: <span className="text-green">{modelUsed}</span>
        </p>
      </div>

      {/* Results as cards — works on all screen sizes */}
      <div className="space-y-3">
        {results.map((r, i) => {
          const avail = availabilityLabels[r.availability] || availabilityLabels.unknown
          return (
            <div
              key={`${r.store}-${i}`}
              className="bg-background border border-border rounded-xl p-5 hover:border-green/40 transition-colors"
            >
              <div className="flex justify-between items-start gap-4">
                {/* Left: product info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-muted text-xs font-mono">#{i + 1}</span>
                    <Badge variant={avail.variant}>{avail.text}</Badge>
                  </div>
                  <h3 className="font-sans font-medium text-foreground text-[15px] leading-snug mb-1">
                    {r.name}
                  </h3>
                  <p className="text-muted text-sm">{r.store}</p>
                  {r.notes && (
                    <p className="text-muted text-xs mt-1.5">{r.notes}</p>
                  )}
                </div>

                {/* Right: price + action */}
                <div className="text-right shrink-0 flex flex-col items-end gap-2">
                  <span className="text-green font-bold text-xl">
                    {r.price}
                  </span>
                  <span className="text-muted text-xs">{r.currency}</span>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="primary">
                      Ver oferta →
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
