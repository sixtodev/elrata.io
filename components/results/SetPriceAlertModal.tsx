'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAlerts } from '@/hooks/useAlerts'
import type { SearchResult, SearchQuery } from '@/types/search'

interface SetPriceAlertModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  result: SearchResult
  query: SearchQuery
  isLoggedIn: boolean
}

export function SetPriceAlertModal({
  open,
  onOpenChange,
  result,
  query,
  isLoggedIn,
}: SetPriceAlertModalProps) {
  const numericPrice = parseFloat(result.price.replace(/[^0-9.]/g, ''))
  const [targetPrice, setTargetPrice] = useState(
    isNaN(numericPrice) ? '' : String(Math.floor(numericPrice * 0.9))
  )
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const { createAlert, loading } = useAlerts()

  const handleSubmit = async () => {
    setError('')
    const target = parseFloat(targetPrice)
    if (isNaN(target) || target <= 0) {
      setError('Ingresa un precio válido')
      return
    }

    try {
      await createAlert({
        product_name: result.name,
        query_data: query as unknown as Record<string, unknown>,
        target_price: target,
        currency: result.currency,
      })
      setSuccess(true)
    } catch {
      setError('Error al crear la alerta. Intenta de nuevo.')
    }
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      setSuccess(false)
      setError('')
    }
    onOpenChange(open)
  }

  if (!isLoggedIn) {
    return (
      <Modal open={open} onOpenChange={handleClose} title="Alerta de Precio">
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <Bell size={48} color="#c4ef16" />
          </div>
          <p style={{ color: '#fefeff', fontSize: '16px', marginBottom: '8px' }}>
            Crea una cuenta para usar alertas
          </p>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Te avisamos cuando el precio baje a tu objetivo.
          </p>
          <div style={{ marginTop: '20px' }}>
            <a
              href="/login"
              style={{
                display: 'inline-block',
                background: '#c4ef16',
                color: '#000',
                padding: '10px 24px',
                borderRadius: '12px',
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: '14px',
              }}
            >
              Crear cuenta
            </a>
          </div>
        </div>
      </Modal>
    )
  }

  if (success) {
    return (
      <Modal open={open} onOpenChange={handleClose} title="Alerta creada">
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <p style={{ color: '#fefeff', fontSize: '16px', marginBottom: '8px' }}>
            Te avisaremos cuando <strong>{result.name}</strong> baje a{' '}
            <strong style={{ color: '#c4ef16' }}>
              {result.currency} {targetPrice}
            </strong>
          </p>
          <p style={{ color: '#6b7280', fontSize: '13px' }}>
            Revisamos los precios periódicamente y te notificaremos por email.
          </p>
          <div style={{ marginTop: '20px' }}>
            <Button variant="secondary" size="sm" onClick={() => handleClose(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} onOpenChange={handleClose} title="Crear Alerta de Precio">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Product info */}
        <div
          style={{
            background: '#151518',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            padding: '12px',
          }}
        >
          <p style={{ color: '#fefeff', fontSize: '14px', fontWeight: 500 }}>
            {result.name}
          </p>
          <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
            {result.store}
          </p>
          <p style={{ color: '#c4ef16', fontSize: '18px', fontWeight: 700, marginTop: '8px' }}>
            Precio actual: {result.price} {result.currency}
          </p>
        </div>

        {/* Target price input */}
        <div>
          <label
            style={{
              display: 'block',
              color: '#fefeff',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '6px',
            }}
          >
            Precio objetivo ({result.currency})
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>{result.currency}</span>
            <input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="Ej: 500"
              style={{
                flex: 1,
                background: '#151518',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#fefeff',
                fontSize: '16px',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#c4ef16'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#2a2a2a'
              }}
            />
          </div>
          <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
            Te avisaremos cuando el precio baje a este valor o menos.
          </p>
        </div>

        {error && (
          <p style={{ color: '#ef4444', fontSize: '13px' }}>{error}</p>
        )}

        <Button onClick={handleSubmit} loading={loading} size="md">
          Crear alerta
        </Button>
      </div>
    </Modal>
  )
}
