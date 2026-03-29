'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
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
      className="bg-bg2 border border-border rounded-2xl p-6 cursor-pointer transition-all relative hover:border-green hover:shadow-[0_0_20px_var(--color-green-glow)]"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-bg3 rounded-[10px] flex items-center justify-center text-xl">
          📁
        </div>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className={cn(
            'bg-transparent border-none text-xs px-2 py-1 rounded-md transition-colors cursor-pointer hover:text-red disabled:opacity-50 disabled:cursor-not-allowed',
            confirmDelete ? 'text-red' : 'text-muted',
          )}
        >
          {deleting
            ? 'Eliminando...'
            : confirmDelete
              ? 'Confirmar?'
              : 'Eliminar'}
        </button>
      </div>

      <h3 className="font-title text-lg text-foreground mb-2 font-normal">
        {folder.name}
      </h3>

      <div className="flex items-center gap-3 text-[13px] text-muted">
        <span>{searchCount} busquedas</span>
        <span className="text-border">|</span>
        <span>{createdDate}</span>
      </div>
    </div>
  )
}
