import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const NO_DECIMAL_CURRENCIES = new Set(['CLP', 'ARS', 'COP', 'UYU', 'MXN', 'PEN', 'VES'])

/**
 * Formats a raw price string from scrapers into a properly localized number.
 *
 * Handles formats from ScraperAPI / Serper:
 *   "10.709"   → dot with 3 decimals = thousands separator → 10709
 *   "1.299.990" → multiple dots = thousands separators → 1299990
 *   "10,709"   → comma with 3 decimals = thousands separator → 10709
 *   "10.99"    → dot with 2 decimals = decimal separator → 10.99
 *   "1,234.56" → US format → 1234.56
 *   "1.234,56" → European format → 1234.56
 */
export function formatPrice(price: string, currency: string): string {
  if (!price || price === 'Ver precio') return price
  const raw = price.replace(/[^0-9.,]/g, '')
  if (!raw) return price

  const dots = (raw.match(/\./g) || []).length
  const commas = (raw.match(/,/g) || []).length
  const afterLastDot = dots === 1 ? (raw.split('.').pop() ?? '') : ''
  const afterLastComma = commas === 1 ? (raw.split(',').pop() ?? '') : ''

  let num: number

  if (dots > 1) {
    // "1.299.990" — dots are thousands separators
    num = parseFloat(raw.replace(/\./g, ''))
  } else if (commas > 1) {
    // "1,299,990" — commas are thousands separators
    num = parseFloat(raw.replace(/,/g, ''))
  } else if (dots === 1 && commas === 1) {
    const dotPos = raw.indexOf('.')
    const commaPos = raw.indexOf(',')
    if (dotPos < commaPos) {
      // "1.234,56" — European: dot=thousands, comma=decimal
      num = parseFloat(raw.replace(/\./g, '').replace(',', '.'))
    } else {
      // "1,234.56" — US: comma=thousands, dot=decimal
      num = parseFloat(raw.replace(/,/g, ''))
    }
  } else if (dots === 1) {
    // "10.709" (3 digits after dot) → thousands separator
    // "10.99"  (1-2 digits after dot) → decimal separator
    num = afterLastDot.length === 3
      ? parseFloat(raw.replace(/\./g, ''))
      : parseFloat(raw)
  } else if (commas === 1) {
    // Same logic for comma
    num = afterLastComma.length === 3
      ? parseFloat(raw.replace(/,/g, ''))
      : parseFloat(raw.replace(',', '.'))
  } else {
    num = parseFloat(raw)
  }

  if (isNaN(num) || num === 0) return price

  if (NO_DECIMAL_CURRENCIES.has(currency)) {
    return new Intl.NumberFormat('es-CL').format(Math.round(num))
  }
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)
}
