'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SearchQuery, SearchResult } from '@/types/search'

interface SearchRecord {
  id: string
  query_data: SearchQuery
  results: SearchResult[]
  model_used: string
  created_at: string
}

interface SearchHistoryProps {
  searches: SearchRecord[]
}

function SearchHistoryItem({ search }: { search: SearchRecord }) {
  const [expanded, setExpanded] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const router = useRouter()
  const q = search.query_data
  const date = new Date(search.created_at).toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar esta búsqueda guardada?')) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/searches?id=${search.id}`, { method: 'DELETE' })
      if (res.ok) {
        setDeleted(true)
        router.refresh()
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false)
    }
  }

  if (deleted) return null

  return (
    <div style={{ backgroundColor: '#1C1C1F', border: '1px solid #2a2a2a', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Header — click to expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{ width: '100%', background: 'transparent', border: 'none', padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', textAlign: 'left' }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '15px', color: '#fefeff', fontWeight: 500, marginBottom: '4px' }}>
            {q.product}{q.brand ? ` (${q.brand})` : ''}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span>{q.city ? `${q.city}, ` : ''}{q.country}</span>
            <span style={{ color: '#2a2a2a' }}>|</span>
            <span>{date}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ backgroundColor: 'rgba(196,239,22,0.1)', color: '#c4ef16', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(196,239,22,0.2)' }}>
            {search.results.length} resultados
          </span>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '4px 8px', color: '#6b7280', fontSize: '12px', cursor: deleting ? 'wait' : 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#6b7280' }}
            title="Eliminar búsqueda"
          >
            {deleting ? '...' : '🗑️'}
          </button>

          <span style={{ color: '#6b7280', fontSize: '16px', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </div>
      </button>

      {/* Expanded results */}
      {expanded && (
        <div style={{ borderTop: '1px solid #2a2a2a', padding: '16px 20px' }}>
          {search.results.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
              No se encontraron resultados para esta búsqueda.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(showAll ? search.results : search.results.slice(0, 10)).map((result, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '12px 14px',
                    backgroundColor: '#1a1a1e',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', color: '#fefeff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {result.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{result.store}</span>
                      {result.notes && (
                        <>
                          <span style={{ color: '#2a2a2a' }}>·</span>
                          <span>{result.notes}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#c4ef16', whiteSpace: 'nowrap' }}>
                      {result.price}
                    </span>

                    {/* Product link */}
                    {result.url && result.url !== '#' ? (
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#c4ef16',
                          color: '#000',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Ver →
                      </a>
                    ) : (
                      <span style={{ color: '#6b7280', fontSize: '11px' }}>Sin link</span>
                    )}
                  </div>
                </div>
              ))}
              {!showAll && search.results.length > 10 && (
                <button
                  onClick={() => setShowAll(true)}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: '1px dashed #2a2a2a',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#c4ef16',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Ver {search.results.length - 10} resultados más ↓
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function SearchHistory({ searches }: SearchHistoryProps) {
  if (searches.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', color: '#6b7280' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
        <p style={{ fontSize: '15px', margin: 0 }}>Aún no hay búsquedas en esta carpeta</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {searches.map((search) => (
        <SearchHistoryItem key={search.id} search={search} />
      ))}
    </div>
  )
}
