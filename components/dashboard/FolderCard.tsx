'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Folder as FolderIcon } from 'lucide-react'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import type { Folder } from '@/types/folder'


interface FolderCardProps {
  folder: Folder
  searchCount?: number
}

export function FolderCard({ folder, searchCount = 0 }: FolderCardProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/folders?id=${folder.id}`, { method: 'DELETE' })
      if (res.ok) {
        setShowConfirm(false)
        router.refresh()
      }
    } catch (err) {
      console.error('Error deleting folder:', err)
    } finally {
      setDeleting(false)
    }
  }

  const createdDate = new Date(folder.created_at).toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <>
      <ConfirmDeleteModal
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={handleDelete}
        title={`¿Eliminar "${folder.name}"?`}
        description="Se eliminará la carpeta y todas las búsquedas guardadas dentro. Esta acción no se puede deshacer."
        loading={deleting}
      />

      <div
        onClick={() => router.push(`/dashboard/${folder.id}`)}
        className="bg-bg2 border border-border rounded-2xl p-6 cursor-pointer transition-all relative hover:border-green hover:shadow-[0_0_20px_var(--color-green-glow)]"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 bg-bg3 rounded-[10px] flex items-center justify-center">
            <FolderIcon size={20} className="text-accent" />
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); setShowConfirm(true) }}
            disabled={deleting}
            className="bg-transparent border-none text-xs px-2 py-1 rounded-md transition-colors cursor-pointer text-muted hover:text-red disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Eliminar
          </button>
        </div>

      <h3 className="text-base font-semibold text-foreground mb-2">
        {folder.name}
      </h3>

      <div className="flex items-center gap-3 text-[13px] text-muted">
        <span>{searchCount} busquedas</span>
        <span className="text-border">|</span>
        <span>{createdDate}</span>
      </div>
      </div>
    </>
  )
}
