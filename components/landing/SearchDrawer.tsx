'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Drawer } from '@/components/ui/Drawer'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useSearchDrawer } from './SearchDrawerContext'
import { SEARCH_CATEGORIES, getCategoryById, getVisibleFields } from '@/lib/search/categories'
import { SUPPORTED_COUNTRIES, ML_COUNTRIES } from '@/lib/search/countries'
import type { CategoryField } from '@/lib/search/categories'

type SearchSource = 'all' | 'mercadolibre'

export function SearchDrawer() {
  const { isOpen, close, setResults } = useSearchDrawer()
  const [selectedSource, setSelectedSource] = useState<SearchSource>('all')
  const [selectedCategory, setSelectedCategory] = useState('general')
  const [categoryFields, setCategoryFields] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [searchError, setSearchError] = useState('')
  const [remaining, setRemaining] = useState<number | null>(null)

  const [selectedCountry, setSelectedCountry] = useState('')
  const productRef = useRef<HTMLInputElement>(null)
  const brandRef = useRef<HTMLInputElement>(null)
  const cityRef = useRef<HTMLInputElement>(null)
  const budgetRef = useRef<HTMLInputElement>(null)
  const purposeRef = useRef<HTMLTextAreaElement>(null)

  const category = getCategoryById(selectedCategory)

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId)
    setCategoryFields({})
  }

  const handleFieldChange = (fieldId: string, value: string) => {
    setCategoryFields((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleSearch = async () => {
    const product = productRef.current?.value.trim() || ''
    const city = cityRef.current?.value.trim() || ''
    const country = selectedCountry

    const newErrors: Record<string, boolean> = {}
    if (!product) newErrors.product = true
    if (!city) newErrors.city = true
    if (!country) newErrors.country = true

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setSearchError('')
    setLoading(true)

    const brand = brandRef.current?.value.trim() || ''
    // Send raw product + specs separately — server builds different queries per source
    const activeSpecs = Object.fromEntries(Object.entries(categoryFields).filter(([, v]) => v))

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product,
          brand: brand || undefined,
          city,
          country,
          purpose: purposeRef.current?.value.trim() || 'Uso general',
          budget: budgetRef.current?.value.trim() || undefined,
          source: selectedSource,
          specs: Object.keys(activeSpecs).length > 0 ? activeSpecs : undefined,
        }),
      })

      const data = await res.json()

      if (res.status === 429) {
        setSearchError(data.error || 'Límite alcanzado')
        setRemaining(0)
        return
      }

      const rem = res.headers.get('X-Searches-Remaining')
      if (rem !== null) setRemaining(parseInt(rem, 10))

      if (!res.ok) {
        setSearchError(data.error || 'Error en la búsqueda')
        return
      }

      setResults({
        ...data,
        _budget: budgetRef.current?.value.trim() || undefined,
        _purpose: purposeRef.current?.value.trim() || '',
      })
      close()
    } catch (error: unknown) {
      console.error('Search error:', error)
      setSearchError('No se pudo conectar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={isOpen} onClose={close}>
      {/* Loading overlay — rata en skate mientras busca */}
      {loading && (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-6 bg-[var(--background)]/95 backdrop-blur-sm rounded-2xl" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'calc(100% - 32px)', maxWidth: '680px', maxHeight: 'calc(100vh - 50px)' }}>
          <Image
            src="/icons/rata.webp"
            alt="Buscando..."
            width={120}
            height={120}
            className="animate-bounce drop-shadow-[0_0_24px_rgba(196,239,22,0.5)]"
            priority
          />
          <p className="text-lg font-semibold text-[var(--accent)]">Buscando en tiendas reales...</p>
          <p className="text-sm text-[var(--muted)]">Esto puede tardar unos segundos</p>
        </div>
      )}
      <h2 className="font-title text-xl sm:text-[26px] mb-2">
        🐀 A Ratear
      </h2>
      <p style={{ color: '#6b7280', fontSize: '15px', marginBottom: '20px' }}>
        Buscamos precios reales en tiendas online. La IA analiza y te recomienda la mejor opción.
      </p>

      {/* Category selector */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
          Categoría
        </label>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {SEARCH_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              style={{
                border: selectedCategory === cat.id ? '1px solid #c4ef16' : '1px solid #2a2a2a',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: selectedCategory === cat.id ? 'rgba(196,239,22,0.1)' : '#1a1a1e',
                color: selectedCategory === cat.id ? '#c4ef16' : '#6b7280',
              }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product + Brand */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Input
          ref={productRef}
          label="¿Qué buscas? *"
          placeholder={
            selectedCategory === 'vehiculos'
              ? 'ej: Kawasaki Ninja 400, Toyota Corolla...'
              : selectedCategory === 'computacion'
              ? 'ej: Laptop gaming, MacBook Air...'
              : 'ej: iPhone 15, Cafetera, PS5...'
          }
          className={errors.product ? 'border-red animate-shake' : ''}
        />
        <Input
          ref={brandRef}
          label="Marca (opcional)"
          placeholder="ej: Apple, Lenovo, Samsung..."
        />
      </div>

      {/* Dynamic category fields — filtered by type selection */}
      {(() => {
        const visibleFields = getVisibleFields(category, categoryFields)
        return visibleFields.length > 0 && (
        <div
          style={{
            background: '#1C1C1F',
            border: '1px solid #2a2a2a',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#c4ef16', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Filtros de {category.label}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {visibleFields.map((field) => (
              <DynamicField
                key={field.id}
                field={field}
                value={categoryFields[field.id] || ''}
                onChange={(val) => handleFieldChange(field.id, val)}
              />
            ))}
          </div>
        </div>
      )})()}

      {/* City + Country */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Input
          ref={cityRef}
          label="Ciudad *"
          placeholder="ej: Santiago, Bogotá, Madrid..."
          className={errors.city ? 'border-red animate-shake' : ''}
        />
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            País *
          </label>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            style={{
              width: '100%',
              background: '#1a1a1e',
              border: errors.country ? '1px solid #ef4444' : '1px solid #2a2a2a',
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '15px',
              color: selectedCountry ? '#fefeff' : '#6b7280',
              outline: 'none',
              appearance: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">Selecciona un país</option>
            {SUPPORTED_COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Budget */}
      <div className="mb-4">
        <Input
          ref={budgetRef}
          label="Presupuesto máximo (opcional)"
          placeholder="ej: $500.000, USD 800, €400..."
        />
      </div>

      {/* Purpose */}
      <div className="mb-4">
        <Textarea
          ref={purposeRef}
          label="¿Para qué lo necesitas? (la IA recomienda según esto)"
          placeholder={
            selectedCategory === 'computacion'
              ? 'ej: Para estudiar ingeniería, para editar video, para programar...'
              : selectedCategory === 'vehiculos'
              ? 'ej: Para transporte diario en ciudad, para viajes largos...'
              : selectedCategory === 'gaming'
              ? 'ej: Para jugar FPS competitivo, para streaming...'
              : 'ej: Para uso diario, para regalo, para trabajo...'
          }
        />
      </div>

      {/* Source selector */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
          Buscar en
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {([{ id: 'all', label: 'ML + Google Shopping' }, ...(ML_COUNTRIES.has(selectedCountry) ? [{ id: 'mercadolibre', label: 'Solo MercadoLibre' }] : [])] as { id: SearchSource; label: string }[]).map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSource(s.id)}
              style={{
                border: selectedSource === s.id ? '1px solid #c4ef16' : '1px solid #2a2a2a',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: selectedSource === s.id ? 'rgba(196,239,22,0.1)' : '#1a1a1e',
                color: selectedSource === s.id ? '#c4ef16' : '#6b7280',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {searchError && (
        <div style={{ marginBottom: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '12px', fontSize: '14px', color: '#ef4444' }}>
          {searchError}
        </div>
      )}

      {/* Remaining */}
      {remaining !== null && remaining <= 5 && remaining > 0 && (
        <div style={{ marginBottom: '16px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '10px', padding: '12px', fontSize: '14px', color: '#fbbf24' }}>
          🐀 Te quedan {remaining} búsquedas gratis hoy
        </div>
      )}

      {/* Submit */}
      <Button
        className="w-full text-[17px] py-4"
        loading={loading}
        onClick={handleSearch}
      >
        {loading ? '🐀 Buscando en tiendas reales...' : '🐀 ¡A buscar el precio más rata!'}
      </Button>

      {/* Info */}
      <div style={{ marginTop: '16px', background: 'rgba(196,239,22,0.05)', border: '1px solid rgba(196,239,22,0.15)', borderRadius: '10px', padding: '14px', fontSize: '13px', color: '#6b7280', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>🤖</span>
        <div>
          <strong style={{ color: '#fefeff' }}>Búsqueda real + análisis inteligente</strong>
          <br />
          Buscamos en tiendas reales (MercadoLibre, Google Shopping). La IA analiza y te recomienda la mejor opción según lo que necesitas.
        </div>
      </div>
    </Drawer>
  )
}

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: CategoryField
  value: string
  onChange: (val: string) => void
}) {
  if (field.type === 'select' && field.options) {
    return (
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
          {field.label}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            background: '#1a1a1e',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '14px',
            color: '#fefeff',
            outline: 'none',
            appearance: 'none',
            cursor: 'pointer',
          }}
        >
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
        {field.label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        style={{
          width: '100%',
          background: '#1a1a1e',
          border: '1px solid #2a2a2a',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '14px',
          color: '#fefeff',
          outline: 'none',
        }}
      />
    </div>
  )
}
