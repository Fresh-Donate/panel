import type { Currency } from '~/types'

const CURRENCY_SYMBOLS: Record<string, string> = { RUB: '₽', USD: '$', EUR: '€' }

export const CURRENCY_OPTIONS: { label: string, value: Currency }[] = [
  { label: '₽ RUB', value: 'RUB' },
  { label: '$ USD', value: 'USD' },
  { label: '€ EUR', value: 'EUR' }
]

export function currencySymbol(code: string | null | undefined): string {
  if (!code) return ''
  return CURRENCY_SYMBOLS[code] ?? code
}

export function formatNumber(value: number | string): string {
  return Number(value).toLocaleString('ru-RU')
}

export function pluralize(n: number, forms: [one: string, few: string, many: string]): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1]
  return forms[2]
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} с`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} мин`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ч ${minutes % 60} мин`
  return `${Math.floor(hours / 24)} д ${hours % 24} ч`
}

export function formatMoney(value: number | string, currency: string | null | undefined, options: { cents?: boolean } = {}): string {
  const digits = options.cents ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : undefined
  return `${Number(value).toLocaleString('ru-RU', digits)} ${currencySymbol(currency)}`.trimEnd()
}

export function formatDateTime(iso: string | null | undefined, options: { seconds?: boolean } = {}): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...(options.seconds ? { second: '2-digit' } : {})
  })
}
