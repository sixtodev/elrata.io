import type { SearchResult } from '@/types/search'

/**
 * Merges results from multiple sources, deduplicates,
 * filters by brand if specified, and sorts by price ascending.
 */
export function mergeAndSort(
  results: SearchResult[],
  brand?: string
): SearchResult[] {
  // Deduplicate by URL
  const seen = new Set<string>()
  const deduped: SearchResult[] = []

  for (const r of results) {
    const key = r.url !== '#' ? r.url : `${r.name}|${r.store}|${r.price}`
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push(r)
    }
  }

  // Filter by brand if specified
  let filtered = deduped
  if (brand) {
    const brandLower = brand.toLowerCase().trim()
    const brandMatched = deduped.filter((r) =>
      r.name.toLowerCase().includes(brandLower)
    )
    // Only filter if we still have results, otherwise show all
    if (brandMatched.length >= 3) {
      filtered = brandMatched
    }
  }

  // Sort by numeric price ascending
  filtered.sort((a, b) => {
    const pa = extractNumericPrice(a.price)
    const pb = extractNumericPrice(b.price)
    return pa - pb
  })

  return filtered
}

function extractNumericPrice(price: string): number {
  const cleaned = price.replace(/[^0-9.,]/g, '')

  if (cleaned.includes('.') && cleaned.includes(',')) {
    const lastDot = cleaned.lastIndexOf('.')
    const lastComma = cleaned.lastIndexOf(',')

    if (lastComma > lastDot) {
      return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'))
    } else {
      return parseFloat(cleaned.replace(/,/g, ''))
    }
  }

  if (cleaned.includes(',')) {
    const parts = cleaned.split(',')
    if (parts[parts.length - 1].length <= 2) {
      return parseFloat(cleaned.replace(',', '.'))
    }
    return parseFloat(cleaned.replace(/,/g, ''))
  }

  if (cleaned.includes('.')) {
    const parts = cleaned.split('.')
    if (parts.length > 2) {
      return parseFloat(cleaned.replace(/\./g, ''))
    }
    return parseFloat(cleaned)
  }

  return parseFloat(cleaned) || Infinity
}
