'use client'

import type { Folder } from '@/types/folder'
import { FolderCard } from './FolderCard'

interface FolderListProps {
  folders: Folder[]
  searchCounts?: Record<string, number>
}

export function FolderList({ folders, searchCounts = {} }: FolderListProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
      }}
    >
      {folders.map((folder) => (
        <FolderCard
          key={folder.id}
          folder={folder}
          searchCount={searchCounts[folder.id] ?? 0}
        />
      ))}
    </div>
  )
}
