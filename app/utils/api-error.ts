import type { FetchError } from 'ofetch'

export function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as FetchError | undefined)?.data as { error?: unknown, message?: unknown } | undefined
  if (!data || typeof data !== 'object' || data.error === 'InternalServerError') return fallback
  if (typeof data.message === 'string' && data.message) return data.message
  if (typeof data.error === 'string' && data.error) return data.error
  return fallback
}
