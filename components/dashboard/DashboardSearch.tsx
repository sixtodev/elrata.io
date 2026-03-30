'use client'

import { useState, useRef } from 'react'
import { Drawer } from '@/components/ui/Drawer'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import Image from 'next/image'
import { SaveToFolderModal } from '@/components/results/SaveToFolderModal'
import { SetPriceAlertModal } from '@/components/results/SetPriceAlertModal'
import { SEARCH_CATEGORIES, getCategoryById, getVisibleFields } from '@/lib/search/categories'
import { SUPPORTED_COUNTRIES, ML_COUNTRIES } from '@/lib/search/countries'
import type { CategoryField } from '@/lib/search/categories'
import type { SearchResult, SearchResponse } from '@/types/search'

type SearchSource = 'all' | 'mercadolibre'

function extractStoreName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    const base = hostname.split('.')[0]
    return base.charAt(0).toUpperCase() + base.slice(1)
  } catch {
    return url
  }
}

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

interface SavedUrl {
  id: string
  url: string
  name: string
}

export function DashboardSearch() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [source, setSource] = useState<SearchSource>('all')
  const [category, setCategory] = useState('general')
  const [catFields, setCatFields] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Custom URL
  const [customUrl, setCustomUrl] = useState('')
  const [savedUrls, setSavedUrls] = useState<SavedUrl[]>([])
  const [urlsLoaded, setUrlsLoaded] = useState(false)
  const [savingUrl, setSavingUrl] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', url: '' })

  // Results state
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [analyzingAI, setAnalyzingAI] = useState(false)

  // Modals
  const [saveResult, setSaveResult] = useState<SearchResult | null>(null)
  const [alertResult, setAlertResult] = useState<SearchResult | null>(null)

  const productRef = useRef<HTMLInputElement>(null)
  const brandRef = useRef<HTMLInputElement>(null)
  const cityRef = useRef<HTMLInputElement>(null)
  const [selectedCountry, setSelectedCountry] = useState('')
  const budgetRef = useRef<HTMLInputElement>(null)
  const purposeRef = useRef<HTMLTextAreaElement>(null)

  // Load saved URLs when drawer opens
  const loadSavedUrls = async () => {
    if (urlsLoaded) return
    try {
      const res = await fetch('/api/user-stores')
      if (res.ok) {
        const data = await res.json()
        setSavedUrls(data)
      }
    } catch { /* ignore */ }
    setUrlsLoaded(true)
  }

  const handleSaveUrl = async () => {
    if (!customUrl.trim()) return
    setSavingUrl(true)
    try {
      const clean = customUrl.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')
      const fullUrl = `https://${clean}`
      const res = await fetch('/api/user-stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fullUrl, name: extractStoreName(fullUrl) }),
      })
      if (res.ok) {
        const data = await res.json()
        setSavedUrls((prev) => [data, ...prev.filter((u) => u.url !== clean)])
      }
    } catch { /* ignore */ }
    setSavingUrl(false)
  }

  const handleDeleteUrl = async (id: string) => {
    try {
      await fetch(`/api/user-stores?id=${id}`, { method: 'DELETE' })
      setSavedUrls((prev) => prev.filter((u) => u.id !== id))
    } catch { /* ignore */ }
  }

  const handleEditUrl = async (id: string) => {
    try {
      const res = await fetch(`/api/user-stores?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name || undefined,
          url: editForm.url ? `https://${editForm.url.replace(/^https?:\/\//, '').replace(/\/+$/, '')}` : undefined,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setSavedUrls((prev) => prev.map((u) => u.id === id ? updated : u))
      }
    } catch { /* ignore */ }
    setEditingId(null)
  }

  const handleSelectSavedUrl = (url: string) => {
    setCustomUrl((prev) => prev === url ? '' : url)
  }

  const cat = getCategoryById(category)

  const handleSearch = async () => {
    const product = productRef.current?.value.trim() || ''
    const city = cityRef.current?.value.trim() || ''
    const country = selectedCountry
    if (!product || !city || !country) return

    setLoading(true)
    setError('')
    setResults(null)
    setAnalysis(null)

    const brand = brandRef.current?.value.trim() || ''
    const purpose = purposeRef.current?.value.trim() || 'Uso general'
    const budget = budgetRef.current?.value.trim() || undefined
    // Send raw product + specs separately — server builds different queries per source
    const activeSpecs = Object.fromEntries(Object.entries(catFields).filter(([, v]) => v))

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product,
          brand: brand || undefined,
          city,
          country,
          purpose,
          budget,
          source,
          specs: Object.keys(activeSpecs).length > 0 ? activeSpecs : undefined,
          custom_url: customUrl.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error en la búsqueda')
        return
      }

      setResults(data)
      setDrawerOpen(false)

      // Trigger AI analysis
      if (data.results.length > 0 && purpose) {
        setAnalyzingAI(true)
        fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            results: data.results,
            product,
            purpose,
            budget,
            country,
          }),
        })
          .then((r) => r.json())
          .then((d) => { if (d.analysis) setAnalysis(d.analysis) })
          .catch(() => {})
          .finally(() => setAnalyzingAI(false))
      }
    } catch {
      setError('No se pudo conectar')
    } finally {
      setLoading(false)
    }
  }

  const recommendedIndices = new Set(
    analysis?.recommendations?.map((r) => r.productIndex) || []
  )

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => { setDrawerOpen(true); loadSavedUrls() }}
        style={{
          background: '#c4ef16',
          color: '#000',
          border: 'none',
          borderRadius: '12px',
          padding: '14px 28px',
          fontSize: '16px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 0 30px rgba(196,239,22,0.25)',
          transition: 'all 0.2s',
          width: '100%',
          justifyContent: 'center',
          marginBottom: '32px',
        }}
      >
        A Ratear — Nueva búsqueda
      </button>

      {/* Search Drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {loading && (
          <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-6 bg-[var(--background)]/95 backdrop-blur-sm rounded-2xl" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'calc(100% - 32px)', maxWidth: '680px', maxHeight: 'calc(100vh - 50px)' }}>
            <Image src="/icons/rata.webp" alt="Buscando..." width={120} height={120} className="animate-bounce drop-shadow-[0_0_24px_rgba(196,239,22,0.5)]" priority />
            <p className="text-lg font-semibold text-[var(--accent)]">Buscando en tiendas reales...</p>
            <p className="text-sm text-muted">Esto puede tardar unos segundos</p>
          </div>
        )}
        <h2 className="font-title" style={{ fontSize: '26px', marginBottom: '8px', color: '#fefeff' }}>
          Buscar productos
        </h2>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
          Búsquedas ilimitadas. Guarda resultados y crea alertas de precio.
        </p>

        {/* Category */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Categoría</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {SEARCH_CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => { setCategory(c.id); setCatFields({}) }}
                style={{ border: category === c.id ? '1px solid #c4ef16' : '1px solid #2a2a2a', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', background: category === c.id ? 'rgba(196,239,22,0.1)' : '#1a1a1e', color: category === c.id ? '#c4ef16' : '#6b7280' }}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product + Brand */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
          <Input ref={productRef} label="Producto *" placeholder="ej: Laptop, iPhone 15..." />
          <Input ref={brandRef} label="Marca" placeholder="ej: Apple, Lenovo..." />
        </div>

        {/* Dynamic fields — filtered by type */}
        {(() => {
          const visibleFields = getVisibleFields(cat, catFields)
          return visibleFields.length > 0 && (
          <div style={{ background: '#1C1C1F', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: '#c4ef16', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>Filtros {cat.label}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
              {visibleFields.map((f) => (
                <DynField key={f.id} field={f} value={catFields[f.id] || ''} onChange={(v) => setCatFields((p) => ({ ...p, [f.id]: v }))} />
              ))}
            </div>
          </div>
        )})()}

        {/* Location + Budget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
          <Input ref={cityRef} label="Ciudad *" placeholder="ej: Santiago, Bogotá..." />
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '6px' }}>País *</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              style={{ width: '100%', background: '#1a1a1e', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: selectedCountry ? '#fefeff' : '#6b7280', outline: 'none', appearance: 'none', cursor: 'pointer' }}
            >
              <option value="">Selecciona país</option>
              {SUPPORTED_COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-3">
          <Input ref={budgetRef} label="Presupuesto (opcional)" placeholder="ej: $500.000, €1500..." />
        </div>
        <div className="mb-3">
          <Textarea ref={purposeRef} label="¿Para qué lo necesitas?" placeholder="ej: Para estudiar, gaming, trabajo..." />
        </div>

        {/* Source */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '6px' }}>Buscar en</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {([{ id: 'all', label: 'Google Shopping' }, ...(ML_COUNTRIES.has(selectedCountry) ? [{ id: 'mercadolibre', label: 'Solo MercadoLibre' }] : [])] as { id: SearchSource; label: string }[]).map((s) => (
              <button key={s.id} onClick={() => setSource(s.id)}
                style={{ border: source === s.id ? '1px solid #c4ef16' : '1px solid #2a2a2a', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', background: source === s.id ? 'rgba(196,239,22,0.1)' : '#1a1a1e', color: source === s.id ? '#c4ef16' : '#6b7280' }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom URL */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '6px' }}>
            Buscar en un sitio específico (opcional)
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, background: '#1a1a1e', border: customUrl ? '1px solid #c4ef16' : '1px solid #2a2a2a', borderRadius: '8px', overflow: 'hidden' }}>
              <span style={{ padding: '6px 0 6px 10px', color: '#6b7280', fontSize: '13px', flexShrink: 0 }}>https://</span>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value.replace(/^https?:\/\//, ''))}
                placeholder="pcfactory.cl, ripley.com..."
                style={{ flex: 1, background: 'transparent', border: 'none', padding: '8px 10px', fontSize: '13px', color: '#fefeff', outline: 'none' }}
              />
            </div>
            {customUrl.trim() && (
              <button
                onClick={handleSaveUrl}
                disabled={savingUrl}
                style={{ background: '#c4ef16', color: '#000', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {savingUrl ? '...' : 'Guardar'}
              </button>
            )}
          </div>

          {/* Saved URLs */}
          {savedUrls.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              {savedUrls.map((u) => (
                <div key={u.id}>
                  {editingId === u.id ? (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Nombre"
                        style={{ flex: '0 0 110px', background: '#1a1a1e', border: '1px solid #c4ef16', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', color: '#fefeff', outline: 'none' }}
                      />
                      <input
                        type="text"
                        value={editForm.url}
                        onChange={(e) => setEditForm((f) => ({ ...f, url: e.target.value }))}
                        placeholder="URL"
                        style={{ flex: 1, minWidth: '120px', background: '#1a1a1e', border: '1px solid #c4ef16', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', color: '#fefeff', outline: 'none' }}
                      />
                      <button onClick={() => handleEditUrl(u.id)} style={{ background: '#c4ef16', color: '#000', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>OK</button>
                      <button onClick={() => setEditingId(null)} style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', color: '#6b7280', cursor: 'pointer' }}>Cancelar</button>
                    </div>
                  ) : (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0' }}>
                      <button
                        onClick={() => handleSelectSavedUrl(u.url)}
                        style={{ background: customUrl === u.url ? 'rgba(196,239,22,0.1)' : '#1a1a1e', border: customUrl === u.url ? '1px solid #c4ef16' : '1px solid #2a2a2a', borderRadius: '6px 0 0 6px', padding: '4px 8px', fontSize: '11px', color: customUrl === u.url ? '#c4ef16' : '#6b7280', cursor: 'pointer' }}
                      >
                        {extractStoreName(u.url)}
                      </button>
                      <button
                        onClick={() => { setEditingId(u.id); setEditForm({ name: u.name, url: u.url.replace(/^https?:\/\//, '') }) }}
                        style={{ background: '#1a1a1e', border: '1px solid #2a2a2a', borderLeft: 'none', padding: '4px 6px', fontSize: '10px', color: '#6b7280', cursor: 'pointer' }}
                        title="Editar"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDeleteUrl(u.id)}
                        style={{ background: '#1a1a1e', border: '1px solid #2a2a2a', borderLeft: 'none', borderRadius: '0 6px 6px 0', padding: '4px 6px', fontSize: '10px', color: '#6b7280', cursor: 'pointer' }}
                        title="Eliminar"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div style={{ marginBottom: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px', fontSize: '13px', color: '#ef4444' }}>{error}</div>}

        <Button className="w-full text-[16px] py-4" loading={loading} onClick={handleSearch}>
          {loading ? 'Buscando...' : '¡Buscar!'}
        </Button>
      </Drawer>

      {/* Results section */}
      {results && results.results.length > 0 && (
        <div style={{ marginTop: '8px', paddingBottom: '40px', borderBottom: '1px solid #2a2a2a', marginBottom: '40px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 className="font-title" style={{ fontSize: '24px', color: '#fefeff', margin: 0 }}>
                Resultados para &quot;{results.query.product}&quot;
              </h2>
              <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
                {results.results.length} productos · {results.query.city}, {results.query.country}
                {results.sources_used && <> · <span style={{ color: '#c4ef16' }}>{results.sources_used.join(', ')}</span></>}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setResults(null); setAnalysis(null) }}
                style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', color: '#6b7280', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Cerrar resultados
              </button>
              <button onClick={() => { setDrawerOpen(true); loadSavedUrls() }} style={{ background: '#c4ef16', color: '#000', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Nueva búsqueda
              </button>
            </div>
          </div>

          {/* AI Analysis */}
          {analyzingAI && (
            <div style={{ background: '#151518', border: '1px solid rgba(196,239,22,0.3)', borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Spinner size="sm" />
              <span style={{ color: '#6b7280', fontSize: '13px' }}>🤖 Analizando productos...</span>
            </div>
          )}

          {analysis && (
            <div style={{ background: 'linear-gradient(135deg, rgba(196,239,22,0.05), rgba(196,239,22,0.02))', border: '1px solid rgba(196,239,22,0.2)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
              <h3 className="font-semibold" style={{ fontSize: '18px', color: '#fefeff', marginBottom: '6px' }}>🤖 Análisis inteligente</h3>
              <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '14px' }}>{analysis.summary}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {analysis.recommendations.map((rec, i) => {
                  const p = results.results[rec.productIndex]
                  if (!p) return null
                  return (
                    <div key={i} style={{ background: '#151518', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '13px' }}>{rec.label}</span>
                        <div style={{ color: '#fefeff', fontSize: '13px', fontWeight: 500 }}>{p.name}</div>
                        <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '2px' }}>{rec.reason}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ color: '#c4ef16', fontWeight: 'bold', fontSize: '16px' }}>{p.price}</div>
                        <div style={{ color: '#6b7280', fontSize: '11px' }}>{p.store}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: '#6b7280' }}>
                <span>Rango: <span style={{ color: '#c4ef16' }}>{analysis.priceRange.min}</span> — <span style={{ color: '#ef4444' }}>{analysis.priceRange.max}</span></span>
                <span>Promedio: <span style={{ color: '#fefeff' }}>{analysis.priceRange.average}</span></span>
              </div>
              {analysis.tip && (
                <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(196,239,22,0.1)', borderRadius: '6px', fontSize: '12px', color: '#c4ef16' }}>💡 {analysis.tip}</div>
              )}
            </div>
          )}

          {/* Product cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {results.results.map((r, i) => {
              const isRec = recommendedIndices.has(i)
              const recLabel = analysis?.recommendations?.find((x) => x.productIndex === i)?.label

              return (
                <div key={`r-${i}`} style={{ background: '#151518', border: isRec ? '1px solid rgba(196,239,22,0.4)' : '1px solid #2a2a2a', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', position: 'relative' }}>
                  {recLabel && (
                    <div style={{ position: 'absolute', top: '-9px', left: '14px', background: '#c4ef16', color: '#000', fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px' }}>{recLabel}</div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ color: '#6b7280', fontSize: '11px', fontFamily: 'monospace' }}>#{i + 1}</span>
                      <Badge variant={r.source === 'crawlee' ? 'default' : 'muted'}>
                        {r.source === 'crawlee' ? '✓ Verificado' : 'Web'}
                      </Badge>
                    </div>
                    <h4 style={{ color: '#fefeff', fontSize: '14px', fontWeight: 500, marginBottom: '2px', margin: 0 }}>{r.name}</h4>
                    <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>{r.store}</p>
                    {r.notes && <p style={{ color: '#6b7280', fontSize: '11px', marginTop: '2px', margin: 0 }}>{r.notes}</p>}
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ color: '#c4ef16', fontWeight: 'bold', fontSize: '18px' }}>{r.price}</div>
                    <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: '6px' }}>{r.currency}</div>

                    {r.url && r.url !== '#' && (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#c4ef16', color: '#000', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', marginBottom: '6px' }}>Ver →</a>
                    )}

                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setSaveResult(r)} style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '5px', padding: '3px 8px', color: '#6b7280', fontSize: '11px', cursor: 'pointer' }}>
                        💾 Guardar
                      </button>
                      <button onClick={() => setAlertResult(r)} style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '5px', padding: '3px 8px', color: '#6b7280', fontSize: '11px', cursor: 'pointer' }}>
                        🔔 Alerta
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {results && results.results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', marginBottom: '40px', borderBottom: '1px solid #2a2a2a', paddingBottom: '40px' }}>
          <Image src="/icons/rata.webp" alt="Sin resultados" width={80} height={80} className="mx-auto mb-4 opacity-60" />
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>No encontramos resultados. Intenta con otro producto.</p>
          <button
            onClick={() => { setResults(null); setDrawerOpen(true); loadSavedUrls() }}
            style={{ background: '#c4ef16', color: '#000', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            Buscar de nuevo
          </button>
        </div>
      )}

      {/* Modals */}
      {saveResult && results && (
        <SaveToFolderModal
          open={!!saveResult}
          onOpenChange={(open) => { if (!open) setSaveResult(null) }}
          queryData={results.query}
          results={results.results}
          modelUsed={results.model_used}
          isLoggedIn={true}
        />
      )}

      {alertResult && results && (
        <SetPriceAlertModal
          open={!!alertResult}
          onOpenChange={(open) => { if (!open) setAlertResult(null) }}
          result={alertResult}
          query={results.query}
          isLoggedIn={true}
        />
      )}
    </>
  )
}

function DynField({ field, value, onChange }: { field: CategoryField; value: string; onChange: (v: string) => void }) {
  if (field.type === 'select' && field.options) {
    return (
      <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}>{field.label}</label>
        <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', background: '#1a1a1e', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '6px 10px', fontSize: '13px', color: '#fefeff', outline: 'none' }}>
          {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    )
  }
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}>{field.label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} style={{ width: '100%', background: '#1a1a1e', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '6px 10px', fontSize: '13px', color: '#fefeff', outline: 'none' }} />
    </div>
  )
}
