'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { useAlerts } from '@/hooks/useAlerts'
import { PriceHistoryChart } from './PriceHistoryChart'
import type { PriceAlert, AlertStatus } from '@/types/alert'

interface AlertCardProps {
  alert: PriceAlert
  onUpdate: () => void
}

const statusVariant: Record<AlertStatus, 'default' | 'warning' | 'muted' | 'error'> = {
  active: 'default',
  triggered: 'warning',
  paused: 'muted',
  deleted: 'error',
}

const statusLabel: Record<AlertStatus, string> = {
  active: 'Activa',
  triggered: 'Disparada',
  paused: 'Pausada',
  deleted: 'Eliminada',
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
    <div className="bg-background border border-border rounded-xl p-5 transition-colors">
      {/* Main row */}
      <div
        className="flex justify-between items-start gap-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Left */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant={statusVariant[alert.status] ?? 'default'}>
              {statusLabel[alert.status]}
            </Badge>
            <span className="text-muted text-xs">
              {formatTimeAgo(alert.last_checked_at)}
            </span>
          </div>
          <h3 className="text-[15px] font-semibold text-foreground mb-1">
            {alert.product_name}
          </h3>
          <p className="text-muted text-[13px]">
            {alert.query_data.city}, {alert.query_data.country}
          </p>
        </div>

        {/* Right - Prices */}
        <div className="text-right shrink-0">
          <div className="mb-1">
            <span className="text-muted text-xs">Objetivo: </span>
            <span className="text-green font-bold text-base">
              {alert.currency} {alert.target_price}
            </span>
          </div>
          {alert.last_price !== null && (
            <div>
              <span className="text-muted text-xs">Actual: </span>
              <span
                className={cn(
                  'font-semibold text-sm',
                  alert.last_price <= alert.target_price ? 'text-green' : 'text-foreground'
                )}
              >
                {alert.currency} {alert.last_price}
              </span>
            </div>
          )}
          <div className="text-muted text-lg mt-1">
            {expanded ? '▲' : '▼'}
          </div>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-border mt-4 pt-4">
          <PriceHistoryChart
            alertId={alert.id}
            targetPrice={alert.target_price}
            currency={alert.currency}
          />
          <div className="flex gap-2 mt-3">
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
              className="text-red hover:text-red"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete()
              }}
              disabled={actionLoading}
            >
              Eliminar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
