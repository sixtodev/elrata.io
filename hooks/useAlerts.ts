'use client'

import { useState, useCallback } from 'react'

export function useAlerts() {
  const [loading, setLoading] = useState(false)

  const createAlert = useCallback(async (data: {
    product_name: string
    query_data: Record<string, unknown>
    target_price: number
    currency: string
  }) => {
    setLoading(true)
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create alert')
      return res.json()
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteAlert = useCallback(async (id: string) => {
    await fetch(`/api/alerts/${id}`, { method: 'DELETE' })
  }, [])

  const pauseAlert = useCallback(async (id: string) => {
    await fetch(`/api/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paused' }),
    })
  }, [])

  const resumeAlert = useCallback(async (id: string) => {
    await fetch(`/api/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    })
  }, [])

  return { createAlert, deleteAlert, pauseAlert, resumeAlert, loading }
}
