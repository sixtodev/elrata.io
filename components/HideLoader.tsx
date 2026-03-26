'use client'

import { useEffect } from 'react'

export function HideLoader() {
  useEffect(() => {
    const loader = document.getElementById('page-loader')
    if (!loader) return

    // Already hidden from a previous navigation via CSS (body.app-ready #page-loader { display: none })
    if (document.body.classList.contains('app-ready')) return

    const opacity = parseFloat(getComputedStyle(loader).opacity)
    if (opacity > 0.01) {
      // Loader is visible — fade out gracefully, then hide via CSS
      loader.classList.add('loaded')
      setTimeout(() => {
        document.body.classList.add('app-ready')
      }, 500)
    } else {
      // Loader never became visible — hide immediately via CSS
      document.body.classList.add('app-ready')
    }

    // Handle bfcache restore
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) document.body.classList.add('app-ready')
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  return null
}
