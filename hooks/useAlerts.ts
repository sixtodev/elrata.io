'use client'

import { useState } from 'react'

export function useAlerts() {
  const [loading, setLoading] = useState(false)

  const createAlert = async (data: {
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
  }

  const deleteAlert = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const res = await fetch(`/api/alerts/${id}`, { method: 'DELETE' })
    if (!res.ok) return { success: false, error: 'Failed to delete alert' }
    return { success: true }
  }

  const pauseAlert = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const res = await fetch(`/api/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paused' }),
    })
    if (!res.ok) return { success: false, error: 'Failed to pause alert' }
    return { success: true }
  }

  const resumeAlert = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const res = await fetch(`/api/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    })
    if (!res.ok) return { success: false, error: 'Failed to resume alert' }
    return { success: true }
  }

  return { createAlert, deleteAlert, pauseAlert, resumeAlert, loading }
}
