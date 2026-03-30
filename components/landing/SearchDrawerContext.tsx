'use client'

import { createContext, useContext, useState } from 'react'
import type { SearchResponse } from '@/types/search'

interface SearchDrawerContextType {
  isOpen: boolean
  open: () => void
  close: () => void
  results: SearchResponse | null
  setResults: (data: SearchResponse | null) => void
  clearResults: () => void
  remaining: number | null
  setRemaining: (n: number | null) => void
}

const SearchDrawerContext = createContext<SearchDrawerContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
  results: null,
  setResults: () => {},
  clearResults: () => {},
  remaining: null,
  setRemaining: () => {},
})

export function SearchDrawerProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const clearResults = () => setResults(null)

  return (
    <SearchDrawerContext value={{ isOpen, open, close, results, setResults, clearResults, remaining, setRemaining }}>
      {children}
    </SearchDrawerContext>
  )
}

export function useSearchDrawer() {
  return useContext(SearchDrawerContext)
}
