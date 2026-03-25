'use client'

import { useEffect } from 'react'

export function HideLoader() {
  useEffect(() => {
    const loader = document.getElementById('page-loader')
    if (loader) {
      loader.classList.add('loaded')
    }
  }, [])

  return null
}
