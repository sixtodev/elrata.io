'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Folder } from '@/types/folder'

interface FolderCardProps {
  folder: Folder
  searchCount?: number
}

export function FolderCard({ folder, searchCount = 0 }: FolderCardProps) {
  const router = useRouter()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/folders?id=${folder.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        router.refresh()
      }
    } catch (err) {
      console.error('Error deleting folder:', err)
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const createdDate = new Date(folder.created_at).toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div
      onClick={() => router.push(`/dashboard/${folder.id}`)}
      style={{
        backgroundColor: '#1C1C1F',
        border: '1px solid #2a2a2a',
        borderRadius: '16px',
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#c4ef16'
        e.currentTarget.style.boxShadow = '0 0 20px rgba(196, 239, 22, 0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#2a2a2a'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#1a1a1e',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
          }}
        >
          📁
        </div>

        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            background: 'transparent',
            border: 'none',
            color: confirmDelete ? '#ef4444' : '#6b7280',
            fontSize: '12px',
            cursor: deleting ? 'not-allowed' : 'pointer',
            padding: '4px 8px',
            borderRadius: '6px',
            transition: 'color 0.2s',
            opacity: deleting ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!confirmDelete) e.currentTarget.style.color = '#ef4444'
          }}
          onMouseLeave={(e) => {
            if (!confirmDelete) {
              e.currentTarget.style.color = '#6b7280'
              setConfirmDelete(false)
            }
          }}
        >
          {deleting
            ? 'Eliminando...'
            : confirmDelete
              ? 'Confirmar?'
              : 'Eliminar'}
        </button>
      </div>

      <h3
        style={{
          fontFamily: 'var(--font-title)',
          fontSize: '18px',
          color: '#fefeff',
          margin: '0 0 8px 0',
          fontWeight: 400,
        }}
      >
        {folder.name}
      </h3>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px',
          color: '#6b7280',
        }}
      >
        <span>{searchCount} busquedas</span>
        <span style={{ color: '#2a2a2a' }}>|</span>
        <span>{createdDate}</span>
      </div>
    </div>
  )
}
