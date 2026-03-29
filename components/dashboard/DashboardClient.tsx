'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Folder } from '@/types/folder'
import { FolderList } from './FolderList'
import { CreateFolderModal } from './CreateFolderModal'
import { DashboardSearch } from './DashboardSearch'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

interface DashboardClientProps {
  folders: Folder[]
  searchCounts: Record<string, number>
  recentSearchCount: number
}

export function DashboardClient({
  folders,
  searchCounts,
  recentSearchCount,
}: DashboardClientProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      {/* Stats summary */}
      <div
        className="grid gap-4 mb-8"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))' }}
      >
        <div className="bg-bg2 border border-border rounded-xl p-5">
          <div className="text-[13px] text-muted mb-1">Carpetas</div>
          <div className="text-[28px] font-bold text-foreground">{folders.length}</div>
        </div>
        <div className="bg-bg2 border border-border rounded-xl p-5">
          <div className="text-[13px] text-muted mb-1">Búsquedas guardadas</div>
          <div className="text-[28px] font-bold text-green">{recentSearchCount}</div>
        </div>
        <div className="bg-bg2 border border-border rounded-xl p-5">
          <div className="text-[13px] text-muted mb-1">Plan</div>
          <div className="flex items-center gap-1.5 text-lg font-bold text-green">
            <Image src="/icons/rata.webp" alt="" width={32} height={32} />
            Pro
          </div>
          <div className="text-[11px] text-muted">Búsquedas ilimitadas</div>
        </div>
      </div>

      {/* Search section */}
      <DashboardSearch />

      {/* Folder section */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-title text-[22px] text-foreground m-0">
          📁 Mis Carpetas
        </h2>
        <Button onClick={() => setModalOpen(true)}>
          + Crear carpeta
        </Button>
      </div>

      {folders.length > 0 ? (
        <FolderList folders={folders} searchCounts={searchCounts} />
      ) : (
        <EmptyState
          icon={<span>📁</span>}
          title="No tienes carpetas aún"
          description="Crea tu primera carpeta para organizar tus búsquedas"
          action={
            <Button onClick={() => setModalOpen(true)}>
              Crear carpeta
            </Button>
          }
        />
      )}

      <CreateFolderModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  )
}
