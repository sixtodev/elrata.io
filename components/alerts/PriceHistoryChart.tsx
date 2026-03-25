'use client'

import { useEffect, useState } from 'react'
import type { PriceHistory } from '@/types/alert'

interface PriceHistoryChartProps {
  alertId: string
  targetPrice: number
  currency: string
}

export function PriceHistoryChart({ alertId, targetPrice, currency }: PriceHistoryChartProps) {
  const [data, setData] = useState<PriceHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(`/api/alerts/${alertId}/history`)
        if (res.ok) {
          const history = await res.json()
          setData(history)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [alertId])

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
        Cargando historial...
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
        Sin datos de historial todavía.
      </div>
    )
  }

  // Take last 7 days of data, in chronological order
  const sorted = [...data].sort(
    (a, b) => new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime()
  )
  // Aggregate by day: take latest price per day
  const byDay = new Map<string, PriceHistory>()
  for (const point of sorted) {
    const day = new Date(point.checked_at).toLocaleDateString('es', {
      month: 'short',
      day: 'numeric',
    })
    byDay.set(day, point)
  }
  const points = Array.from(byDay.entries()).slice(-7)

  const prices = points.map(([, p]) => p.price)
  const allValues = [...prices, targetPrice]
  const minPrice = Math.min(...allValues) * 0.95
  const maxPrice = Math.max(...allValues) * 1.05
  const range = maxPrice - minPrice || 1

  const chartWidth = 500
  const chartHeight = 180
  const paddingLeft = 60
  const paddingBottom = 30
  const paddingTop = 10
  const paddingRight = 10
  const plotWidth = chartWidth - paddingLeft - paddingRight
  const plotHeight = chartHeight - paddingBottom - paddingTop

  const getX = (i: number) =>
    paddingLeft + (points.length > 1 ? (i / (points.length - 1)) * plotWidth : plotWidth / 2)
  const getY = (price: number) =>
    paddingTop + plotHeight - ((price - minPrice) / range) * plotHeight

  // Build polyline points
  const polylinePoints = points
    .map(([, p], i) => `${getX(i)},${getY(p.price)}`)
    .join(' ')

  const targetY = getY(targetPrice)

  return (
    <div style={{ padding: '12px 0' }}>
      <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '8px' }}>
        Historial de precios (últimos 7 días)
      </p>
      <div style={{ overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={{ width: '100%', maxWidth: `${chartWidth}px`, height: 'auto' }}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const y = paddingTop + plotHeight - frac * plotHeight
            const label = (minPrice + frac * range).toFixed(0)
            return (
              <g key={frac}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#2a2a2a"
                  strokeWidth="0.5"
                />
                <text
                  x={paddingLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#6b7280"
                  fontSize="9"
                >
                  {label}
                </text>
              </g>
            )
          })}

          {/* Target price line */}
          <line
            x1={paddingLeft}
            y1={targetY}
            x2={chartWidth - paddingRight}
            y2={targetY}
            stroke="#c4ef16"
            strokeWidth="1.5"
            strokeDasharray="6,3"
          />
          <text
            x={chartWidth - paddingRight}
            y={targetY - 4}
            textAnchor="end"
            fill="#c4ef16"
            fontSize="9"
          >
            Objetivo: {currency} {targetPrice}
          </text>

          {/* Price line */}
          {points.length > 1 && (
            <polyline
              points={polylinePoints}
              fill="none"
              stroke="#fefeff"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* Data points */}
          {points.map(([label, p], i) => {
            const belowTarget = p.price <= targetPrice
            return (
              <g key={i}>
                <circle
                  cx={getX(i)}
                  cy={getY(p.price)}
                  r="4"
                  fill={belowTarget ? '#c4ef16' : '#fefeff'}
                  stroke={belowTarget ? '#c4ef16' : '#2a2a2a'}
                  strokeWidth="1.5"
                />
                {/* X-axis label */}
                <text
                  x={getX(i)}
                  y={chartHeight - 4}
                  textAnchor="middle"
                  fill="#6b7280"
                  fontSize="8"
                >
                  {label}
                </text>
                {/* Price label on hover area */}
                <text
                  x={getX(i)}
                  y={getY(p.price) - 8}
                  textAnchor="middle"
                  fill={belowTarget ? '#c4ef16' : '#fefeff'}
                  fontSize="8"
                  fontWeight="600"
                >
                  {p.price.toFixed(0)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
