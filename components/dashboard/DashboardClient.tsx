'use client'

import { useState } from 'react'
import type { Folder } from '@/types/folder'
import { FolderList } from './FolderList'
import { CreateFolderModal } from './CreateFolderModal'
import { DashboardSearch } from './DashboardSearch'
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
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div style={{ backgroundColor: '#1C1C1F', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Carpetas</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#fefeff' }}>{folders.length}</div>
        </div>
        <div style={{ backgroundColor: '#1C1C1F', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Búsquedas guardadas</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#c4ef16' }}>{recentSearchCount}</div>
        </div>
        <div style={{ backgroundColor: '#1C1C1F', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Plan</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#c4ef16' }}>🐀 Pro</div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>Búsquedas ilimitadas</div>
        </div>
      </div>

      {/* Search section */}
      <DashboardSearch />

      {/* Folder section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 className="font-[family-name:var(--font-title)]" style={{ fontSize: '22px', color: '#fefeff', margin: 0 }}>
          📁 Mis Carpetas
        </h2>
        <button
          onClick={() => setModalOpen(true)}
          style={{ backgroundColor: '#c4ef16', border: 'none', color: '#000', fontWeight: 700, padding: '10px 20px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          + Crear carpeta
        </button>
      </div>

      {folders.length > 0 ? (
        <FolderList folders={folders} searchCounts={searchCounts} />
      ) : (
        <EmptyState
          icon={<span>📁</span>}
          title="No tienes carpetas aún"
          description="Crea tu primera carpeta para organizar tus búsquedas"
          action={
            <button onClick={() => setModalOpen(true)}
              style={{ backgroundColor: '#c4ef16', border: 'none', color: '#000', fontWeight: 700, padding: '10px 24px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>
              Crear carpeta
            </button>
          }
        />
      )}

      <CreateFolderModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  )
}
