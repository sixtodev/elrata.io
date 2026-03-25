'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useAlerts } from '@/hooks/useAlerts'
import { PriceHistoryChart } from './PriceHistoryChart'
import type { PriceAlert, AlertStatus } from '@/types/alert'

interface AlertCardProps {
  alert: PriceAlert
  onUpdate: () => void
}

const statusConfig: Record<AlertStatus, { label: string; bg: string; color: string; borderColor: string }> = {
  active: { label: 'Activa', bg: 'rgba(196,239,22,0.1)', color: '#c4ef16', borderColor: 'rgba(196,239,22,0.2)' },
  triggered: { label: 'Disparada', bg: 'rgba(251,191,36,0.1)', color: '#fbbf24', borderColor: 'rgba(251,191,36,0.2)' },
  paused: { label: 'Pausada', bg: 'rgba(107,114,128,0.1)', color: '#6b7280', borderColor: 'rgba(107,114,128,0.2)' },
  deleted: { label: 'Eliminada', bg: 'rgba(239,68,68,0.1)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' },
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Nunca'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `Hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `Hace ${days}d`
}

export function AlertCard({ alert, onUpdate }: AlertCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const { pauseAlert, resumeAlert, deleteAlert } = useAlerts()

  const status = statusConfig[alert.status] || statusConfig.active

  const handlePauseResume = async () => {
    setActionLoading(true)
    try {
      if (alert.status === 'paused') {
        await resumeAlert(alert.id)
      } else {
        await pauseAlert(alert.id)
      }
      onUpdate()
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await deleteAlert(alert.id)
      onUpdate()
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div
      style={{
        background: '#151518',
        border: '1px solid #2a2a2a',
        borderRadius: '12px',
        padding: '20px',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Main row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Left */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                display: 'inline-block',
                borderRadius: '9999px',
                border: `1px solid ${status.borderColor}`,
                background: status.bg,
                color: status.color,
                padding: '2px 10px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {status.label}
            </span>
            <span style={{ color: '#6b7280', fontSize: '12px' }}>
              {formatTimeAgo(alert.last_checked_at)}
            </span>
          </div>
          <h3 style={{ color: '#fefeff', fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>
            {alert.product_name}
          </h3>
          <p style={{ color: '#6b7280', fontSize: '13px' }}>
            {alert.query_data.city}, {alert.query_data.country}
          </p>
        </div>

        {/* Right - Prices */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ color: '#6b7280', fontSize: '12px' }}>Objetivo: </span>
            <span style={{ color: '#c4ef16', fontWeight: 700, fontSize: '16px' }}>
              {alert.currency} {alert.target_price}
            </span>
          </div>
          {alert.last_price !== null && (
            <div>
              <span style={{ color: '#6b7280', fontSize: '12px' }}>Actual: </span>
              <span
                style={{
                  color: alert.last_price <= alert.target_price ? '#c4ef16' : '#fefeff',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                {alert.currency} {alert.last_price}
              </span>
            </div>
          )}
          <div style={{ color: '#6b7280', fontSize: '18px', marginTop: '4px' }}>
            {expanded ? '▲' : '▼'}
          </div>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div style={{ borderTop: '1px solid #2a2a2a', marginTop: '16px', paddingTop: '16px' }}>
          {/* Price history chart */}
          <PriceHistoryChart
            alertId={alert.id}
            targetPrice={alert.target_price}
            currency={alert.currency}
          />

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            {(alert.status === 'active' || alert.status === 'paused' || alert.status === 'triggered') && (
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePauseResume()
                }}
                disabled={actionLoading}
              >
                {alert.status === 'paused' ? '▶ Reanudar' : '⏸ Pausar'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete()
              }}
              disabled={actionLoading}
              style={{ color: '#ef4444' }}
            >
              Eliminar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
