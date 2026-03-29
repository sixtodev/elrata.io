'use client'

import { useState } from 'react'
import { AlertCard } from './AlertCard'
import { Spinner } from '@/components/ui/Spinner'
import type { PriceAlert, AlertStatus } from '@/types/alert'

interface AlertListProps {
  initialAlerts: PriceAlert[]
}

const tabs: { key: AlertStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'active', label: 'Activas' },
  { key: 'triggered', label: 'Disparadas' },
  { key: 'paused', label: 'Pausadas' },
]

export function AlertList({ initialAlerts }: AlertListProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>(initialAlerts)
  const [activeTab, setActiveTab] = useState<AlertStatus | 'all'>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)

  const refreshAlerts = async () => {
    setRefreshing(true)
    setRefreshError(null)
    try {
      const res = await fetch('/api/alerts')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setAlerts(data)
        }
      } else {
        setRefreshError('No se pudieron actualizar las alertas.')
      }
    } catch {
      setRefreshError('Error de conexión al actualizar alertas.')
    } finally {
      setRefreshing(false)
    }
  }

  const filtered =
    activeTab === 'all'
      ? alerts
      : alerts.filter((a) => a.status === activeTab)

  const counts: Record<string, number> = {
    all: alerts.length,
    active: alerts.filter((a) => a.status === 'active').length,
    triggered: alerts.filter((a) => a.status === 'triggered').length,
    paused: alerts.filter((a) => a.status === 'paused').length,
  }

  return (
    <div>
      {/* Refresh indicator */}
      {refreshing && (
        <div className="flex justify-end mb-2">
          <Spinner size="sm" />
        </div>
      )}

      {/* Refresh error */}
      {refreshError && (
        <div className="mb-3 text-sm text-red-500">
          {refreshError}
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '24px',
          background: '#1C1C1F',
          borderRadius: '12px',
          padding: '4px',
          border: '1px solid #2a2a2a',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s',
              background: activeTab === tab.key ? '#1a1a1e' : 'transparent',
              color: activeTab === tab.key ? '#fefeff' : '#6b7280',
            }}
          >
            {tab.label}{' '}
            <span
              style={{
                fontSize: '12px',
                opacity: 0.7,
              }}
            >
              ({counts[tab.key]})
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔕</div>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>
            {activeTab === 'all'
              ? 'No tienes alertas todavía. Busca un producto y crea tu primera alerta.'
              : `No tienes alertas ${tabs.find((t) => t.key === activeTab)?.label.toLowerCase()}.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onUpdate={refreshAlerts} />
          ))}
        </div>
      )}
    </div>
  )
}
