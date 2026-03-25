'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import type { Folder } from '@/types/folder'
import type { SearchQuery, SearchResult } from '@/types/search'

interface SaveToFolderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  queryData: SearchQuery
  results: SearchResult[]
  modelUsed: string
  isLoggedIn: boolean
}

export function SaveToFolderModal({
  open,
  onOpenChange,
  queryData,
  results,
  modelUsed,
  isLoggedIn,
}: SaveToFolderModalProps) {
  const router = useRouter()
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && isLoggedIn) {
      fetchFolders()
    }
    if (!open) {
      setSuccess(false)
      setError('')
      setSelectedFolderId(null)
      setShowNewFolder(false)
      setNewFolderName('')
    }
  }, [open, isLoggedIn])

  const fetchFolders = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/folders')
      if (res.ok) {
        const data = await res.json()
        setFolders(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    setCreatingFolder(true)
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName.trim() }),
      })
      if (res.ok) {
        const folder = await res.json()
        setFolders((prev) => [folder, ...prev])
        setSelectedFolderId(folder.id)
        setShowNewFolder(false)
        setNewFolderName('')
      }
    } catch {
      setError('Error al crear carpeta')
    } finally {
      setCreatingFolder(false)
    }
  }

  const handleSave = async () => {
    if (!selectedFolderId) {
      setError('Selecciona una carpeta')
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder_id: selectedFolderId,
          query_data: queryData,
          results,
          model_used: modelUsed,
        }),
      })

      if (!res.ok) {
        throw new Error('Error al guardar')
      }

      setSuccess(true)
      router.refresh()
    } catch {
      setError('Error al guardar la busqueda')
    } finally {
      setSaving(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title="Guardar busqueda"
      >
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</div>
          <p style={{ color: '#fefeff', fontSize: '16px', marginBottom: '8px' }}>
            Necesitas una cuenta para guardar
          </p>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
            Crea una cuenta gratuita para guardar busquedas y recibir alertas
          </p>
          <a
            href="/register"
            style={{
              display: 'inline-block',
              backgroundColor: '#c4ef16',
              color: '#000',
              fontWeight: 700,
              padding: '12px 28px',
              borderRadius: '10px',
              fontSize: '14px',
              textDecoration: 'none',
              transition: 'background-color 0.2s',
            }}
          >
            Crear cuenta para guardar
          </a>
        </div>
      </Modal>
    )
  }

  if (success) {
    return (
      <Modal open={open} onOpenChange={onOpenChange} title="Guardado">
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
          <p style={{ color: '#fefeff', fontSize: '16px', marginBottom: '8px' }}>
            Busqueda guardada exitosamente
          </p>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
            Puedes verla en tu dashboard
          </p>
          <button
            onClick={() => onOpenChange(false)}
            style={{
              backgroundColor: '#c4ef16',
              border: 'none',
              color: '#000',
              fontWeight: 700,
              padding: '10px 24px',
              borderRadius: '10px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Guardar busqueda"
      description="Selecciona una carpeta para guardar esta busqueda"
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
          Cargando carpetas...
        </div>
      ) : (
        <div>
          {/* Folder list */}
          <div
            style={{
              maxHeight: '240px',
              overflowY: 'auto',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                style={{
                  width: '100%',
                  background:
                    selectedFolderId === folder.id
                      ? 'rgba(196, 239, 22, 0.1)'
                      : '#1a1a1e',
                  border: `1px solid ${
                    selectedFolderId === folder.id ? '#c4ef16' : '#2a2a2a'
                  }`,
                  borderRadius: '10px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: '#fefeff',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span>📁</span>
                {folder.name}
              </button>
            ))}
          </div>

          {/* Create new folder inline */}
          {showNewFolder ? (
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nombre de carpeta"
                autoFocus
                style={{
                  flex: 1,
                  backgroundColor: '#1a1a1e',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  color: '#fefeff',
                  outline: 'none',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder()
                }}
              />
              <button
                onClick={handleCreateFolder}
                disabled={creatingFolder}
                style={{
                  backgroundColor: '#c4ef16',
                  border: 'none',
                  color: '#000',
                  fontWeight: 600,
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {creatingFolder ? '...' : 'Crear'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewFolder(true)}
              style={{
                background: 'transparent',
                border: '1px dashed #2a2a2a',
                color: '#6b7280',
                padding: '10px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                cursor: 'pointer',
                width: '100%',
                marginBottom: '16px',
                transition: 'color 0.2s',
              }}
            >
              + Nueva carpeta
            </button>
          )}

          {error && (
            <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>
              {error}
            </p>
          )}

          {/* Save button */}
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
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !selectedFolderId}
              style={{
                backgroundColor: '#c4ef16',
                border: 'none',
                color: '#000',
                fontWeight: 700,
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                cursor: saving || !selectedFolderId ? 'not-allowed' : 'pointer',
                opacity: saving || !selectedFolderId ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
