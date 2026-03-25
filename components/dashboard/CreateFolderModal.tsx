'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'

interface CreateFolderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateFolderModal({ open, onOpenChange }: CreateFolderModalProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al crear carpeta')
      }

      setName('')
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear carpeta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Crear carpeta"
      description="Organiza tus busquedas en carpetas"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="folder-name"
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
            }}
          >
            Nombre
          </label>
          <input
            id="folder-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ej. Laptops Argentina"
            autoFocus
            style={{
              width: '100%',
              backgroundColor: '#1a1a1e',
              border: `1px solid ${error ? '#ef4444' : '#2a2a2a'}`,
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '15px',
              color: '#fefeff',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              if (!error) e.currentTarget.style.borderColor = '#c4ef16'
            }}
            onBlur={(e) => {
              if (!error) e.currentTarget.style.borderColor = '#2a2a2a'
            }}
          />
          {error && (
            <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>
              {error}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            style={{
              background: 'transparent',
              border: '1px solid #2a2a2a',
              color: '#6b7280',
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#c4ef16',
              border: 'none',
              color: '#000',
              fontWeight: 700,
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Creando...' : 'Crear carpeta'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
