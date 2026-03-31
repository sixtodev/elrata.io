import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const NO_DECIMAL_CURRENCIES = new Set(['CLP', 'ARS', 'COP', 'UYU', 'MXN', 'PEN', 'VES'])

const CURRENCY_LOCALE: Record<string, string> = {
  CLP: 'es-CL', // 1.299.990
  ARS: 'es-AR', // 1.299.990
  COP: 'es-CO', // 1.299.990
  UYU: 'es-UY', // 17.077,41
  MXN: 'es-MX', // 17,077.41
  PEN: 'es-PE', // 17,077.41
  VES: 'es-VE', // 17.077,41
  USD: 'en-US', // 17,077.41
  CAD: 'en-CA', // 17,077.41
  EUR: 'es-ES', // 17.077,41
  GBP: 'en-GB', // 17,077.41
  BRL: 'pt-BR', // 17.077,41
}

/**
 * Formats a raw price string from scrapers into a localized currency string.
 *
 * Handles formats from ScraperAPI / Serper:
 *   "10.709"    → dot with 3 digits after = thousands separator → 10709
 *   "1.299.990" → multiple dots = thousands separators → 1299990
 *   "10,709"    → comma with 3 digits after = thousands separator → 10709
 *   "10.99"     → dot with 1-2 digits after = decimal separator → 10.99
 *   "1,234.56"  → US format → 1234.56
 *   "1.234,56"  → European format → 1234.56
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
    num = parseFloat(raw.replace(/\./g, ''))
  } else if (commas > 1) {
    num = parseFloat(raw.replace(/,/g, ''))
  } else if (dots === 1 && commas === 1) {
    const dotPos = raw.indexOf('.')
    const commaPos = raw.indexOf(',')
    if (dotPos < commaPos) {
      num = parseFloat(raw.replace(/\./g, '').replace(',', '.'))
    } else {
      num = parseFloat(raw.replace(/,/g, ''))
    }
  } else if (dots === 1) {
    num = afterLastDot.length === 3
      ? parseFloat(raw.replace(/\./g, ''))
      : parseFloat(raw)
  } else if (commas === 1) {
    num = afterLastComma.length === 3
      ? parseFloat(raw.replace(/,/g, ''))
      : parseFloat(raw.replace(',', '.'))
  } else {
    num = parseFloat(raw)
  }

  if (isNaN(num) || num === 0) return price

  const locale = CURRENCY_LOCALE[currency] ?? 'es-CL'
  const isoCode = currency || 'USD'

  try {
    if (NO_DECIMAL_CURRENCIES.has(currency)) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: isoCode,
        maximumFractionDigits: 0,
      }).format(Math.round(num))
    }
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: isoCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  } catch {
    // Fallback if currency code is invalid
    return new Intl.NumberFormat(locale).format(NO_DECIMAL_CURRENCIES.has(currency) ? Math.round(num) : num)
  }
}
