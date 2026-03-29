import type { SearchResult } from '@/types/search'

/**
 * Merges results from multiple sources, deduplicates, applies filters,
 * scores by spec match, and sorts by relevance then price.
 */
export function mergeAndSort(
  results: SearchResult[],
  brand?: string,
  specs?: Record<string, string>,
  budget?: string
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
      r.name.toLowerCase().includes(brandLower) ||
      r.store.toLowerCase().includes(brandLower)
    )
    if (brandMatched.length >= 2) filtered = brandMatched
  }

  // Filter by budget (with 15% tolerance so we don't miss near-budget items)
  if (budget) {
    const maxPrice = extractNumericPrice(budget) * 1.15
    if (isFinite(maxPrice) && maxPrice > 0) {
      const withinBudget = filtered.filter((r) => {
        const price = extractNumericPrice(r.price)
        return !isFinite(price) || price <= maxPrice
      })
      if (withinBudget.length >= 2) filtered = withinBudget
    }
  }

  // Score by spec match — specs like "32GB", "1TB SSD", "Ryzen 9" appear in product titles
  const specValues = specs
    ? Object.entries(specs)
        .filter(([key, val]) => val && !['type', 'condition', 'gender', 'size'].includes(key))
        .map(([, val]) => val.toLowerCase())
    : []

  if (specValues.length > 0) {
    filtered.sort((a, b) => {
      const scoreA = specScore(a, specValues)
      const scoreB = specScore(b, specValues)
      if (scoreB !== scoreA) return scoreB - scoreA  // higher spec match first
      return extractNumericPrice(a.price) - extractNumericPrice(b.price)  // then cheapest
    })
  } else {
    filtered.sort((a, b) => extractNumericPrice(a.price) - extractNumericPrice(b.price))
  }

  return filtered
}

/** Returns a 0–1 score: how many of the required specs appear in the result title */
function specScore(result: SearchResult, specValues: string[]): number {
  const text = `${result.name} ${result.notes || ''}`.toLowerCase()
  const matches = specValues.filter((spec) => {
    // Handle variants: "1TB SSD" → also match "1tb", "1 tb ssd"
    const normalized = spec.replace(/\s+/g, '').replace('ssd', '')
    return text.includes(spec) || text.replace(/\s+/g, '').includes(normalized)
  })
  return matches.length / specValues.length
}

export function extractNumericPrice(price: string): number {
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
